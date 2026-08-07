import csv
import json
import logging
import os
import re
import time
import uuid
from datetime import datetime, timedelta, timezone

import httpx
from google import genai
from google.genai import types as genai_types

from config import (
    CATEGORIES_FILE,
    EXISTING_PROVIDERS_FILE,
    OUTPUT_PROVIDERS_FILE,
    FAILED_CATEGORIES_FILE,
    GEMINI_API_KEY,
    model_rotation,
    MAX_RETRIES,
    BASE_RETRY_DELAY,
    MAX_RETRY_DELAY,
    MIN_REQUEST_INTERVAL,
    REQUEST_DELAY,
    MAX_OUTPUT_TOKENS,
    MAX_PASSES,
    MODEL_FAILURE_LIMIT,
    MODEL_COOLDOWN_SECONDS,
    POOL_RETRY_WAIT,
    MAX_POOL_ROUNDS,
    PROVIDERS_PER_CATEGORY,
    REQUEST_TIMEOUT_SECONDS,
)

logger = logging.getLogger(__name__)


class ResponseValidationError(ValueError):
    """Raised when a model response cannot be parsed as a JSON array."""


class SafetyRefusalError(ResponseValidationError):
    """Raised when Gemini refuses the request for safety reasons."""


PRICING_MODELS = {
    "free",
    "freemium",
    "usage-based",
    "subscription",
    "per-seat",
    "open-source",
}

FIELDNAMES = [
    "id",
    "category_id",
    "name",
    "slug",
    "short_description",
    "long_description",
    "logo",
    "official_website",
    "documentation",
    "github",
    "pricing_model",
    "free_tier",
    "open_source",
    "popularity_score",
    "featured",
    "status",
    "created_at",
    "updated_at",
    "normalized_name",
    "community_rating",
    "stack2set_rating",
    "monthly_cost",
    "enterprise_pricing",
    "learning_curve",
    "speed",
    "scalability",
    "reliability",
    "security",
    "compliance",
    "integrations",
    "apis",
    "sdks",
    "ai_features",
    "languages",
    "compatibility",
    "pros",
    "cons",
    "best_use_cases",
    "ai_summary",
    "ai_suggested",
    "source",
    "last_synced_at",
]

# ---------------------------------------------------------------------------
# Rate limiter state (module level so it survives across category requests).
# ---------------------------------------------------------------------------
_last_call_time = 0.0
_model_cursor = 0

# Model failover state.
_model_failures = {}        # model -> consecutive failures since last success
_model_disabled_until = {}  # model -> monotonic timestamp while disabled


# ---------------------------------------------------------------------------
# CSV helpers
# ---------------------------------------------------------------------------
def read_csv(path):
    with open(path, "r", encoding="utf-8-sig", newline="") as file:
        return list(csv.DictReader(file))


def get_value(row, possible_names):
    for name in possible_names:
        if name in row and row[name]:
            return str(row[name]).strip()

    return ""


def csv_value(value):
    if value is None:
        return ""

    if isinstance(value, bool):
        return "true" if value else "false"

    if isinstance(value, (list, tuple)):
        return json.dumps(list(value), ensure_ascii=False)

    if isinstance(value, dict):
        return json.dumps(value, ensure_ascii=False)

    return value


def save_providers(providers, path=OUTPUT_PROVIDERS_FILE):
    """Atomically write all providers to the output CSV."""
    path.parent.mkdir(parents=True, exist_ok=True)

    tmp_path = path.with_suffix(".csv.tmp")

    with open(tmp_path, "w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=FIELDNAMES)
        writer.writeheader()

        for provider in providers:
            writer.writerow(
                {field: csv_value(provider.get(field, "")) for field in FIELDNAMES}
            )

    os.replace(tmp_path, path)


def save_failed_categories(categories, progress, path=FAILED_CATEGORIES_FILE):
    """Record which categories still need providers. The generator resumes them
    automatically on the next pass (or on a later re-run)."""
    rows = [
        {
            "category_id": category["id"],
            "category_name": category["name"],
            "providers": progress.get(category["id"], 0),
        }
        for category in categories
        if progress.get(category["id"], 0) < PROVIDERS_PER_CATEGORY
    ]

    path.parent.mkdir(parents=True, exist_ok=True)

    with open(path, "w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(
            file, fieldnames=["category_id", "category_name", "providers"]
        )
        writer.writeheader()
        writer.writerows(rows)


# ---------------------------------------------------------------------------
# Normalization / deduplication
# ---------------------------------------------------------------------------
def normalize_key(value):
    return re.sub(r"[^a-z0-9]+", "", str(value or "").lower())


def normalize_website(value):
    value = re.sub(r"\s+", " ", str(value or "").strip().lower())
    value = re.sub(r"^https?://", "", value)
    value = re.sub(r"^www\.", "", value)
    return value.rstrip("/")


def load_categories():
    rows = read_csv(CATEGORIES_FILE)

    categories = []

    for row in rows:
        name = get_value(row, ["name", "category", "category_name", "title"])

        if not name:
            continue

        categories.append({
            "id": get_value(row, ["id", "category_id"]),
            "name": name,
            "slug": get_value(row, ["slug", "category_slug"]),
        })

    return categories


def collect_existing(path):
    rows = read_csv(path)

    existing = {
        "names": set(),
        "slugs": set(),
        "websites": set(),
    }

    for row in rows:
        name = get_value(row, ["name", "provider", "provider_name", "title"])
        slug = get_value(row, ["slug"])
        website = get_value(
            row,
            ["official_website", "website", "url", "homepage"],
        )

        if name:
            existing["names"].add(normalize_key(name))

        if slug:
            existing["slugs"].add(normalize_key(slug))

        if website:
            existing["websites"].add(normalize_website(website))

    return existing


def load_existing_providers():
    existing = collect_existing(EXISTING_PROVIDERS_FILE)

    # Also merge in anything already generated to output/providers.csv so an
    # interrupted run can be resumed without regenerating duplicates.
    if OUTPUT_PROVIDERS_FILE.exists():
        generated = collect_existing(OUTPUT_PROVIDERS_FILE)

        existing["names"].update(generated["names"])
        existing["slugs"].update(generated["slugs"])
        existing["websites"].update(generated["websites"])

    return existing


def load_generated_output():
    """Return rows previously saved to output/providers.csv and the set of
    category_ids that already have a full set (>= PROVIDERS_PER_CATEGORY) of
    providers there."""
    if not OUTPUT_PROVIDERS_FILE.exists():
        return [], set()

    rows = read_csv(OUTPUT_PROVIDERS_FILE)

    counts = {}

    for row in rows:
        category_id = get_value(row, ["category_id", "category"])

        if category_id:
            counts[category_id] = counts.get(category_id, 0) + 1

    completed = {
        category_id
        for category_id, count in counts.items()
        if count >= PROVIDERS_PER_CATEGORY
    }

    return rows, completed


def is_duplicate(name, slug, website, existing):
    if not name:
        return True

    if normalize_key(name) in existing["names"]:
        return True

    if slug and normalize_key(slug) in existing["slugs"]:
        return True

    if website and normalize_website(website) in existing["websites"]:
        return True

    return False


# ---------------------------------------------------------------------------
# Prompt
# ---------------------------------------------------------------------------
def build_prompt(category, existing_names, need=None, safer=False):
    if need is None:
        need = PROVIDERS_PER_CATEGORY

    excluded = ", ".join(sorted(existing_names)) if existing_names else "none"

    safety_note = ""
    if safer:
        safety_note = (
            "\nSAFETY NOTE: Respond with professional, neutral, factual "
            "descriptions only. Do not generate anything harmful, sexual, "
            "violent, or defamatory.\n"
        )

    prompt = f"""
You are a software provider research assistant. Find exactly {need} NEW
software products, developer tools, platforms, SaaS products, APIs, or
technology providers that belong to this category:

CATEGORY: {category["name"]}
{safety_note}
STRICT RULES:
1. Only return REAL, existing products/providers with their official
   websites. NEVER invent companies, products, or URLs.
2. Do NOT include any of these providers (already in the database):
   {excluded}
3. Do not repeat the same provider twice in your response.
4. Return providers strongly related to "{category["name"]}".
5. Keep every "slug" unique, url-friendly, and in kebab-case.

For EVERY provider return a JSON object with the following fields:

- "name": official provider name (string)
- "slug": url-friendly unique slug in kebab-case (string)
- "short_description": one sentence summary (string)
- "long_description": a 2-3 sentence detailed description (string)
- "official_website": official https URL (string)
- "documentation": https URL of the docs, or "" (string)
- "github": GitHub owner/repo, or "" (string)
- "pricing_model": one of "free", "freemium", "usage-based", "subscription", "per-seat", "open-source"
- "free_tier": true or false
- "open_source": true or false
- "popularity_score": integer from 1 to 100
- "community_rating": number from 0.0 to 5.0
- "stack2set_rating": number from 0.0 to 5.0
- "monthly_cost": integer USD cost of a typical paid starter plan (0 if free)
- "enterprise_pricing": short note about enterprise pricing, or ""
- "learning_curve": integer from 1 to 5 (1 = easiest)
- "speed": integer from 1 to 5
- "scalability": integer from 1 to 5
- "reliability": integer from 1 to 5
- "security": true or false
- "compliance": array of strings, e.g. ["SOC 2", "GDPR"]
- "integrations": array of strings naming common tools/services it integrates with
- "apis": array of strings of API types, e.g. ["REST", "Webhooks"]
- "sdks": array of strings of official SDK languages, e.g. ["Python", "JavaScript"]
- "ai_features": array of strings describing notable AI/ML capabilities, or []
- "languages": array of strings of primary supported languages
- "compatibility": object mapping frameworks/runtimes to booleans, e.g. {{"Next.js": true, "Node.js": true, "Python": true}}
- "pros": array of 2-4 strings
- "cons": array of 2-3 strings
- "best_use_cases": array of 2-4 strings
- "ai_summary": a 1-2 sentence neutral summary of the provider

Return ONLY valid JSON: an array of exactly {need} provider objects. No
markdown, no commentary, no extra text before or after the JSON.
"""

    return prompt


# ---------------------------------------------------------------------------
# Value sanitizers
# ---------------------------------------------------------------------------
def clean_string(value, default=""):
    if value is None:
        return default

    text = str(value).strip()

    return text if text else default


def clean_bool(value, default=False):
    if isinstance(value, bool):
        return value

    if isinstance(value, (int, float)):
        return bool(value)

    return str(value or "").strip().lower() in {"true", "1", "yes", "y"}


def clean_int(value, default, minimum=None, maximum=None):
    try:
        number = int(round(float(value)))
    except (TypeError, ValueError):
        number = default

    if minimum is not None:
        number = max(number, minimum)

    if maximum is not None:
        number = min(number, maximum)

    return number


def clean_rating(value, default):
    try:
        number = float(value)
    except (TypeError, ValueError):
        number = default

    number = max(0.0, min(5.0, number))
    return round(number, 1)


def clean_string_list(value, limit=None):
    if value is None:
        return []

    if isinstance(value, str):
        raw = value
    elif isinstance(value, (list, tuple)):
        raw = value
    else:
        return []

    items = []

    for item in raw:
        if isinstance(item, (list, tuple)):
            item = ", ".join(str(x) for x in item)

        text = str(item).strip()

        if text:
            items.append(text)

    if limit is not None:
        items = items[:limit]

    return items


def clean_compatibility(value):
    if not isinstance(value, dict):
        return {}

    result = {}

    for key, enabled in value.items():
        result[clean_string(key)] = clean_bool(enabled)

    return result


def make_slug(name):
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or "provider"


def sanitize_provider(raw, category, existing, now_ts):
    name = clean_string(
        raw.get("name") or raw.get("provider_name") or raw.get("title")
    )

    website = clean_string(
        raw.get("official_website")
        or raw.get("website")
        or raw.get("url")
        or raw.get("homepage")
    )

    slug = clean_string(raw.get("slug") or raw.get("slugs"))

    if not slug:
        slug = make_slug(name)

    if is_duplicate(name, slug, website, existing):
        logger.info(
            "Skipping duplicate provider: name=%r slug=%r website=%r",
            name,
            slug,
            website,
        )
        return None

    pricing_model = clean_string(
        raw.get("pricing_model") or raw.get("pricing"),
        default="freemium",
    ).lower()

    if pricing_model not in PRICING_MODELS:
        pricing_model = "freemium"

    provider = {
        "id": str(uuid.uuid4()),
        "category_id": category["id"],
        "name": name,
        "slug": slug,
        "short_description": clean_string(
            raw.get("short_description")
            or raw.get("description")
            or raw.get("summary")
        ),
        "long_description": clean_string(
            raw.get("long_description") or raw.get("detailed_description")
        ),
        "logo": clean_string(raw.get("logo")),
        "official_website": website,
        "documentation": clean_string(
            raw.get("documentation") or raw.get("docs")
        ),
        "github": clean_string(raw.get("github") or raw.get("github_repo")),
        "pricing_model": pricing_model,
        "free_tier": clean_bool(raw.get("free_tier")),
        "open_source": clean_bool(raw.get("open_source")),
        "popularity_score": clean_int(
            raw.get("popularity_score"), default=50, minimum=1, maximum=100
        ),
        "featured": False,
        "status": "active",
        "created_at": now_ts,
        "updated_at": now_ts,
        "normalized_name": normalize_key(name),
        "community_rating": clean_rating(raw.get("community_rating"), 4.0),
        "stack2set_rating": clean_rating(raw.get("stack2set_rating"), 4.0),
        "monthly_cost": clean_int(
            raw.get("monthly_cost"), default=0, minimum=0, maximum=100000
        ),
        "enterprise_pricing": clean_string(raw.get("enterprise_pricing")),
        "learning_curve": clean_int(
            raw.get("learning_curve"), default=2, minimum=1, maximum=5
        ),
        "speed": clean_int(
            raw.get("speed"), default=4, minimum=1, maximum=5
        ),
        "scalability": clean_int(
            raw.get("scalability"), default=4, minimum=1, maximum=5
        ),
        "reliability": clean_int(
            raw.get("reliability"), default=4, minimum=1, maximum=5
        ),
        "security": clean_bool(raw.get("security"), default=True),
        "compliance": clean_string_list(raw.get("compliance")),
        "integrations": clean_string_list(raw.get("integrations")),
        "apis": clean_string_list(raw.get("apis")),
        "sdks": clean_string_list(raw.get("sdks")),
        "ai_features": clean_string_list(raw.get("ai_features")),
        "languages": clean_string_list(raw.get("languages")),
        "compatibility": clean_compatibility(raw.get("compatibility")),
        "pros": clean_string_list(raw.get("pros"), limit=4),
        "cons": clean_string_list(raw.get("cons"), limit=3),
        "best_use_cases": clean_string_list(raw.get("best_use_cases"), limit=4),
        "ai_summary": clean_string(
            raw.get("ai_summary") or raw.get("summary")
        ),
        "ai_suggested": True,
        "source": "gemini",
        "last_synced_at": now_ts,
    }

    # Register as seen so we never emit the same provider twice in a run.
    existing["names"].add(normalize_key(name))

    if slug:
        existing["slugs"].add(normalize_key(slug))

    if website:
        existing["websites"].add(normalize_website(website))

    return provider


# ---------------------------------------------------------------------------
# Robust JSON extraction
# ---------------------------------------------------------------------------
def _strip_trailing_commas(text):
    """Remove trailing commas before '}' / ']' that are outside strings.

    json.loads rejects trailing commas, but Gemini sometimes emits them.
    This is a string-aware pass so commas inside string values are untouched."""
    out = []
    in_str = False
    escaped = False

    for ch in text:
        if in_str:
            out.append(ch)

            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == '"':
                in_str = False

            continue

        if ch == '"':
            in_str = True
            out.append(ch)
            continue

        if ch in "}]":
            index = len(out) - 1

            while index >= 0 and out[index] in " \t\r\n":
                index -= 1

            if index >= 0 and out[index] == ",":
                del out[index:]

            out.append(ch)
        else:
            out.append(ch)

    return "".join(out)


def _scan_first_json(text):
    """Return the first valid JSON value (list or dict) in text.

    Uses raw_decode from each '[' or '{' position, which lets us skip any
    explanatory text before the JSON and ignore trailing prose."""
    decoder = json.JSONDecoder()
    index = 0
    length = len(text)

    while index < length:
        while index < length and text[index] not in "[{":
            index += 1

        if index >= length:
            break

        try:
            value, _ = decoder.raw_decode(text, index)
            return value
        except json.JSONDecodeError:
            index += 1

    return None


def extract_json(text):
    """Best-effort JSON extraction from a model response.

    Accepts markdown code blocks, surrounding prose, trailing commas,
    escaped quotes, and nested JSON (e.g. a response wrapped inside
    candidates/content/parts/text). Returns the parsed value or None."""
    text = clean_string(text)

    if not text:
        return None

    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
        text = text.strip()

    cleaned = _strip_trailing_commas(text)

    def _load(candidate):
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            return None

    value = _load(cleaned)

    if value is None:
        value = _load(text)

    if value is None:
        value = _scan_first_json(cleaned)

    if value is None:
        value = _scan_first_json(text)

    if isinstance(value, list):
        return value

    # The top-level value is a dict (or None). Search nested string fields for
    # embedded JSON, preferring an array (e.g. {"candidates": [{"content":
    # {"parts": [{"text": "[...]"}]}}]}). This makes extraction immune to the
    # exact response envelope the API returns.
    found_list = None
    found_other = None

    def _search(item, depth=0):
        nonlocal found_list, found_other

        if depth > 8 or found_list is not None:
            return

        if isinstance(item, dict):
            for child in item.values():
                _search(child, depth + 1)
        elif isinstance(item, list):
            if item and any(
                isinstance(x, dict)
                and (x.get("name") or x.get("provider_name") or x.get("title"))
                for x in item
            ):
                if found_list is None:
                    found_list = item
                return

            for child in item:
                _search(child, depth + 1)
        elif isinstance(item, str):
            inner = _scan_first_json(_strip_trailing_commas(item))

            if isinstance(inner, list) and found_list is None:
                found_list = inner
            elif inner is not None and found_other is None:
                found_other = inner

    if isinstance(value, dict):
        _search(value)

    if found_list is not None:
        return found_list

    if found_other is not None:
        return found_other

    if isinstance(value, dict):
        return value

    return None


def validate_schema(data):
    """Filter parsed JSON down to well-formed provider objects."""
    if not isinstance(data, list):
        return []

    valid = []

    for item in data:
        if not isinstance(item, dict):
            continue

        name = clean_string(
            item.get("name")
            or item.get("provider_name")
            or item.get("title")
        )

        if name:
            valid.append(item)

    return valid


# ---------------------------------------------------------------------------
# Rate limiting and retries
# ---------------------------------------------------------------------------
def wait_for_rate_limit():
    """Sleep so that at least MIN_REQUEST_INTERVAL passes between API calls."""
    global _last_call_time

    now = time.monotonic()
    elapsed = now - _last_call_time

    if elapsed < MIN_REQUEST_INTERVAL:
        time.sleep(MIN_REQUEST_INTERVAL - elapsed)

    _last_call_time = time.monotonic()


def error_code(error):
    """Return a short, human-readable code for an API/transport error."""
    code = getattr(error, "code", None)

    if code is not None:
        return str(code)

    status = getattr(error, "status", None)

    if status:
        return status

    name = type(error).__name__.lower()

    if "timeout" in name:
        return "timeout"

    if "connect" in name:
        return "connection"

    return "error"


def register_model_failure(model):
    """Record a failed attempt for a model and disable it on repeated failure."""
    count = _model_failures.get(model, 0) + 1
    _model_failures[model] = count

    if count >= MODEL_FAILURE_LIMIT:
        _model_disabled_until[model] = time.monotonic() + MODEL_COOLDOWN_SECONDS
        _model_failures[model] = 0
        logger.warning(
            "Model %s disabled for %d minutes after %d consecutive failures.",
            model,
            MODEL_COOLDOWN_SECONDS // 60,
            MODEL_FAILURE_LIMIT,
        )


def model_disabled(model):
    return time.monotonic() < _model_disabled_until.get(model, 0)


def detect_safety_refusal(response):
    """Return True when Gemini blocked the request for safety reasons."""
    candidates = getattr(response, "candidates", None) or []

    if candidates and candidates[0].finish_reason is not None:
        reason = candidates[0].finish_reason
        reason_name = getattr(reason, "name", None) or str(reason)

        if reason_name == "SAFETY":
            return True

    feedback = getattr(response, "prompt_feedback", None)

    if feedback is not None:
        block_reason = getattr(feedback, "block_reason", None)

        if block_reason is not None:
            reason_name = getattr(block_reason, "name", None) or str(block_reason)

            if reason_name and reason_name != "BLOCK_REASON_UNSPECIFIED":
                return True

    return False


def validate_response(response, model):
    """Return the response text if it is a complete JSON array.

    Raises SafetyRefusalError for blocked responses and
    ResponseValidationError when the response is empty, truncated, or does not
    parse as a JSON array."""
    if detect_safety_refusal(response):
        raise SafetyRefusalError(f"{model}: request blocked for safety reasons.")

    text = getattr(response, "text", None) or ""

    if not text.strip():
        raise ResponseValidationError(f"{model}: empty response (no text parts).")

    candidates = getattr(response, "candidates", None) or []

    if candidates and candidates[0].finish_reason is not None:
        reason = candidates[0].finish_reason
        reason_name = getattr(reason, "name", None) or str(reason)

        if reason_name != "STOP":
            raise ResponseValidationError(
                f"{model}: response stopped early "
                f"(finish_reason={reason_name}), likely truncated "
                f"(text length {len(text)})."
            )

    data = extract_json(text)

    if not isinstance(data, list):
        raise ResponseValidationError(
            f"{model}: response is not a JSON array "
            f"(text length {len(text)})."
        )

    return text


def attempt_with_model(client, model, prompt):
    """Make a single generation call for a model.

    Returns validated response text. Any failure raises immediately; the
    caller decides whether to switch models."""
    wait_for_rate_limit()

    response = client.models.generate_content(
        model=model,
        contents=prompt,
        config=genai_types.GenerateContentConfig(
            temperature=0.2,
            response_mime_type="application/json",
            max_output_tokens=MAX_OUTPUT_TOKENS,
        ),
    )

    return validate_response(response, model)


def generate_text(client, prompt):
    """Generate content with automatic model failover.

    - Tries models in the current rotation, one attempt each.
    - Switches to the next model immediately after any failure
      (429 / 5xx / timeout / connection / invalid JSON).
    - Disables a model for MODEL_COOLDOWN_SECONDS after
      MODEL_FAILURE_LIMIT consecutive failures.
    - If every model is unavailable, waits POOL_RETRY_WAIT seconds and retries
      the whole pool, up to MAX_POOL_ROUNDS rounds."""
    global _model_cursor

    models = model_rotation()

    errors = []

    for _ in range(MAX_POOL_ROUNDS):
        attempted = False
        last_error = None

        for offset in range(len(models)):
            model = models[(_model_cursor + offset) % len(models)]

            if model_disabled(model):
                continue

            attempted = True

            logger.info("Using model: %s", model)

            try:
                text = attempt_with_model(client, model, prompt)

                _model_failures[model] = 0
                _model_cursor = models.index(model)
                return text

            except SafetyRefusalError as error:
                # Content-related block: let the caller regenerate a safer
                # prompt instead of switching models for the same prompt.
                raise error

            except Exception as error:
                last_error = error
                register_model_failure(model)

                code = error_code(error)
                errors.append(f"{model}: {code}")

                logger.warning("Model failed (%s)", code)

                next_model = models[(_model_cursor + offset + 1) % len(models)]
                logger.info("Switching to %s", next_model)

        if not attempted:
            logger.warning(
                "All models are currently disabled; waiting %ds before "
                "retrying them.",
                POOL_RETRY_WAIT,
            )
        else:
            logger.warning(
                "All available models failed; waiting %ds before retrying.",
                POOL_RETRY_WAIT,
            )

        time.sleep(POOL_RETRY_WAIT)

    raise RuntimeError(
        "All Gemini models failed after retries."
        + (f" Last errors: {'; '.join(errors)}" if errors else "")
    )


# ---------------------------------------------------------------------------
# Generation
# ---------------------------------------------------------------------------
def generate_for_category(client, category, existing, already=0):
    """Fill a category toward PROVIDERS_PER_CATEGORY providers.

    - Retries the category up to MAX_RETRIES times.
    - Regenerates the prompt on every retry (so exclusion lists stay current).
    - Asks Gemini only for the still-missing providers.
    - Switches to a safer prompt if Gemini refuses the request.
    - Returns the list of newly generated providers (deduplicated).
    """
    target = PROVIDERS_PER_CATEGORY
    got = already
    added = []
    safer = False
    no_progress = 0

    for attempt in range(1, MAX_RETRIES + 1):
        need = target - got

        if need <= 0:
            break

        prompt = build_prompt(category, existing["names"], need=need, safer=safer)

        try:
            text = generate_text(client, prompt)
        except Exception as error:
            if isinstance(error, SafetyRefusalError):
                logger.warning(
                    "Category %s was blocked for safety reasons; regenerating "
                    "a safer prompt.",
                    category["name"],
                )
                safer = True

            delay = min(BASE_RETRY_DELAY * (2 ** (attempt - 1)), MAX_RETRY_DELAY)

            logger.warning(
                "Category %s attempt %d/%d failed: %s. Waiting %.0fs.",
                category["name"],
                attempt,
                MAX_RETRIES,
                error,
                delay,
            )

            if attempt < MAX_RETRIES:
                time.sleep(delay)

            continue

        data = extract_json(text)

        if data is None:
            delay = min(BASE_RETRY_DELAY * (2 ** (attempt - 1)), MAX_RETRY_DELAY)

            logger.warning(
                "Category %s attempt %d/%d: no JSON found in response. "
                "Waiting %.0fs.",
                category["name"],
                attempt,
                MAX_RETRIES,
                delay,
            )

            if attempt < MAX_RETRIES:
                time.sleep(delay)

            continue

        valid = validate_schema(data)

        if not valid:
            delay = min(BASE_RETRY_DELAY * (2 ** (attempt - 1)), MAX_RETRY_DELAY)

            logger.warning(
                "Category %s attempt %d/%d: response had no valid provider "
                "objects. Waiting %.0fs.",
                category["name"],
                attempt,
                MAX_RETRIES,
                delay,
            )

            if attempt < MAX_RETRIES:
                time.sleep(delay)

            continue

        now_ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S.%f+00")

        new_this_attempt = []

        for raw in valid[:need]:
            provider = sanitize_provider(raw, category, existing, now_ts)

            if provider:
                new_this_attempt.append(provider)

        if new_this_attempt:
            added.extend(new_this_attempt)
            got += len(new_this_attempt)
            no_progress = 0

            logger.info(
                "   %s: attempt %d/%d returned %d new provider(s) "
                "(category total: %d/%d).",
                category["name"],
                attempt,
                MAX_RETRIES,
                len(new_this_attempt),
                got,
                target,
            )
            continue

        no_progress += 1

        logger.warning(
            "   %s: attempt %d/%d returned no new providers (likely all "
            "duplicates).",
            category["name"],
            attempt,
            MAX_RETRIES,
        )

        if no_progress >= 3:
            logger.warning(
                "   %s: giving up this pass after %d attempts with no "
                "progress; it will be retried automatically.",
                category["name"],
                no_progress,
            )
            break

    if got >= target:
        logger.info("   %s is now complete.", category["name"])
    else:
        logger.warning(
            "   %s is missing %d provider(s) this pass; will be retried "
            "automatically.",
            category["name"],
            target - got,
        )

    return added


def generate_new_providers(max_categories=None):
    if not GEMINI_API_KEY:
        raise RuntimeError(
            "GEMINI_API_KEY is missing. Set it in the .env file before "
            "running the generator."
        )

    client = genai.Client(
        api_key=GEMINI_API_KEY,
        http_options={
            # Inject a plain httpx client. The SDK's default SSL context is
            # built from the certifi bundle and fails its TLS handshake in
            # some environments; a default httpx.Client (system trust path)
            # connects reliably.
            "httpx_client": httpx.Client(timeout=REQUEST_TIMEOUT_SECONDS),
        },
    )

    categories = load_categories()
    existing = load_existing_providers()

    # Resume support: carry forward ALL providers already written to
    # output/providers.csv. Completed categories are skipped; partial
    # categories are topped up (never dropped or duplicated).
    carried_rows, completed = load_generated_output()

    generated = list(carried_rows)

    if max_categories is not None:
        categories = categories[:max_categories]

    total = len(categories)

    logger.info("Categories found: %d", total)
    logger.info(
        "Existing providers found: %d unique names, %d slugs, %d websites",
        len(existing["names"]),
        len(existing["slugs"]),
        len(existing["websites"]),
    )
    logger.info(
        "Carrying forward %d previously generated providers.", len(generated)
    )
    logger.info(
        "Skipping %d categories already complete in output/providers.csv.",
        sum(1 for c in categories if c["id"] in completed),
    )

    category_progress = {}

    for row in generated:
        category_id = get_value(row, ["category_id", "category"])

        if category_id:
            category_progress[category_id] = (
                category_progress.get(category_id, 0) + 1
            )

    pending = [
        category
        for category in categories
        if category_progress.get(category["id"], 0) < PROVIDERS_PER_CATEGORY
    ]

    pass_number = 0
    category_times = []
    overall_start = time.monotonic()

    def process_category(category):
        """Generate providers for one category and persist immediately."""
        category_start = time.monotonic()

        try:
            new_items = generate_for_category(
                client,
                category,
                existing,
                already=category_progress.get(category["id"], 0),
            )

            generated.extend(new_items)
            category_progress[category["id"]] = (
                category_progress.get(category["id"], 0) + len(new_items)
            )

            save_providers(generated)
        except Exception as error:
            logger.error("   ERROR for %s: %s", category["name"], error)

        elapsed = time.monotonic() - category_start

        logger.info(
            "   %s done in %.0fs. Category total: %d/%d. Progress saved.",
            category["name"],
            elapsed,
            category_progress.get(category["id"], 0),
            PROVIDERS_PER_CATEGORY,
        )

        return elapsed

    # Pass 1 is the initial sweep; passes 2..(MAX_PASSES+1) are automatic
    # retries over any category still missing providers.
    while pending and pass_number < MAX_PASSES + 1:
        pass_number += 1

        logger.info(
            "=== Pass %d/%d: %d category(ies) still to process ===",
            pass_number,
            MAX_PASSES + 1,
            len(pending),
        )

        next_pending = []

        for number, category in enumerate(pending, start=1):
            logger.info(
                "[Pass %d/%d | %d/%d] Finding %d providers for %s...",
                pass_number,
                MAX_PASSES + 1,
                number,
                len(pending),
                PROVIDERS_PER_CATEGORY,
                category["name"],
            )

            elapsed = process_category(category)
            category_times.append(elapsed)

            average_time = sum(category_times) / len(category_times)

            remaining_categories = len(pending) - number

            for other in pending[number:]:
                if category_progress.get(other["id"], 0) >= PROVIDERS_PER_CATEGORY:
                    remaining_categories -= 1

            estimated_seconds = average_time * remaining_categories
            estimated_dt = datetime.now() + timedelta(
                seconds=estimated_seconds
            )

            logger.info(
                "   Remaining categories: %d. Avg %.0fs/category. "
                "Est. completion: %s (~%d min).",
                remaining_categories,
                average_time,
                estimated_dt.strftime("%H:%M:%S"),
                int(estimated_seconds // 60),
            )

            if (
                category_progress.get(category["id"], 0)
                >= PROVIDERS_PER_CATEGORY
            ):
                logger.info("   %s is now complete.", category["name"])
            else:
                next_pending.append(category)

            if number < len(pending):
                time.sleep(REQUEST_DELAY)

        save_failed_categories(categories, category_progress)

        pending = next_pending

    # --- Final report ------------------------------------------------------
    save_providers(generated)
    save_failed_categories(categories, category_progress)

    elapsed_total = time.monotonic() - overall_start

    completed_categories = [
        category
        for category in categories
        if category_progress.get(category["id"], 0) >= PROVIDERS_PER_CATEGORY
    ]

    failed_categories = [
        category
        for category in categories
        if category_progress.get(category["id"], 0) < PROVIDERS_PER_CATEGORY
    ]

    logger.info("Run finished in %.0fs.", elapsed_total)

    logger.info("=" * 60)
    logger.info("SUCCESS:")
    logger.info("  Categories completed: %d", len(completed_categories))

    for category in completed_categories:
        logger.info(
            "  - %s (%d providers)",
            category["name"],
            category_progress[category["id"]],
        )

    logger.info("  Providers generated: %d", len(generated))

    logger.info("FAILED:")
    logger.info(
        "  Categories still missing providers: %d", len(failed_categories)
    )

    for category in failed_categories:
        logger.info(
            "  - %s (%d/%d providers)",
            category["name"],
            category_progress.get(category["id"], 0),
            PROVIDERS_PER_CATEGORY,
        )

    logger.info("SUMMARY:")
    logger.info("  Total providers: %d", len(generated))
    logger.info("  Total categories completed: %d/%d", len(completed_categories), total)
    logger.info("  Total failed categories: %d", len(failed_categories))
    logger.info("=" * 60)

    return generated
