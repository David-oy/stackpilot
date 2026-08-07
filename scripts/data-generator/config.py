from pathlib import Path
import os
from datetime import datetime
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent

# Load environment variables from the .env file in this directory.
load_dotenv(BASE_DIR / ".env")

INPUT_DIR = BASE_DIR / "input"
OUTPUT_DIR = BASE_DIR / "output"

CATEGORIES_FILE = INPUT_DIR / "categories.csv"
EXISTING_PROVIDERS_FILE = INPUT_DIR / "providers.csv"
OUTPUT_PROVIDERS_FILE = OUTPUT_DIR / "providers.csv"
FAILED_CATEGORIES_FILE = OUTPUT_DIR / "failed_categories.csv"
LOG_FILE = OUTPUT_DIR / "logs.txt"

# How many NEW providers to try to generate per category.
PROVIDERS_PER_CATEGORY = 10

# ---------------------------------------------------------------------------
# Google Gemini settings. The API key is read from the .env file (GEMINI_API_KEY).
#
# Models are tried in rotation, one attempt each. The generator switches to
# the next model immediately after any failure (429 / 5xx / timeout /
# connection / invalid JSON). A model that fails MODEL_FAILURE_LIMIT times in
# a row is disabled for MODEL_COOLDOWN_SECONDS before being tried again.
# ---------------------------------------------------------------------------
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")

DEFAULT_MODEL_ROTATION = [
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite",
    "gemini-3-flash",
    "gemini-3-flash-preview",
    "gemini-3.5-flash",
    "gemini-3.6-flash",
]

# Rotation order, overridable via GEMINI_MODEL_ROTATION="m1,m2,...". This
# supersedes GEMINI_MODEL / GEMINI_FALLBACK_MODELS for generation.
MODEL_ROTATION = [
    model.strip()
    for model in os.getenv("GEMINI_MODEL_ROTATION", "").split(",")
    if model.strip()
] or DEFAULT_MODEL_ROTATION

# ---------------------------------------------------------------------------
# Time-based rotation window.
#
# Free tier quotas are per-day per-model. Until RESTRICTED_UNTIL (local time)
# today, only the models in RESTRICTED_MODELS are tried (the ones that still
# have daily quota). After that moment, the full MODEL_ROTATION is used again.
# ---------------------------------------------------------------------------
RESTRICTED_MODELS = [
    "gemini-2.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite",
]
RESTRICTED_UNTIL = "23:59:59"


def model_rotation():
    """Return the model list to use right now.

    Uses RESTRICTED_MODELS until today's RESTRICTED_UNTIL, then the full
    MODEL_ROTATION (restricted models must be part of MODEL_ROTATION)."""
    now = datetime.now()
    deadline = now.replace(
        hour=int(RESTRICTED_UNTIL[0:2]),
        minute=int(RESTRICTED_UNTIL[3:5]),
        second=int(RESTRICTED_UNTIL[6:8]),
        microsecond=0,
    )
    if now < deadline:
        restricted = [m for m in MODEL_ROTATION if m in RESTRICTED_MODELS]
        if restricted:
            return restricted
    return MODEL_ROTATION

# Ask for a large output budget. Without this, some models default to a low
# output cap and TRUNCATE the JSON mid-array, producing unparseable responses.
# The API clamps this value to each model's own maximum, so it is safe to set
# high. (10 providers x ~30 fields is roughly 16k chars ~= 4-5k tokens.)
MAX_OUTPUT_TOKENS = 65536

# ---------------------------------------------------------------------------
# Rate limiting / failover settings.
#
# Free tier is capped around 5 requests/minute, so we stay safely below it:
# at least MIN_REQUEST_INTERVAL seconds between every API call and an extra
# REQUEST_DELAY pause between categories.
# ---------------------------------------------------------------------------
MIN_REQUEST_INTERVAL = 16   # Seconds between any two Gemini API calls.
REQUEST_DELAY = 16          # Extra pause after a completed category.

# Per-request timeout (seconds). Without this, a hung connection can stall a
# category for many minutes before the SDK gives up; timing out fast lets the
# failover switch to another model.
REQUEST_TIMEOUT_SECONDS = 180

# How many full passes over unfinished categories to run before giving up.
MAX_PASSES = 3

# Category-level retry settings (safety net on top of the model failover).
MAX_RETRIES = 10            # Max attempts for one category per pass.
BASE_RETRY_DELAY = 2        # Initial backoff (seconds) for transient errors.
MAX_RETRY_DELAY = 600       # Cap for the backoff delay (seconds).

# Model failover.
MODEL_FAILURE_LIMIT = 3     # Consecutive failures before disabling a model.
MODEL_COOLDOWN_SECONDS = 600  # 10 minutes cooldown for a disabled model.
POOL_RETRY_WAIT = 60        # Wait (seconds) when every model is unavailable.
MAX_POOL_ROUNDS = 3         # Max full-pool retry rounds per request.
