import type * as PDFJS from 'pdfjs-dist';
import type { StackProviderItem, UserStack } from './types';
import { generateId } from './id';

export const PDF_WORKER_SRC = '/pdf.worker.min.mjs';
export const PDF_LIB_SRC = '/pdf.min.mjs';

export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = (await import(/* webpackIgnore: true */ '/pdf.min.mjs' as string)) as typeof PDFJS;
  pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
  const data = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;
  try {
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i += 1) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const rows = groupIntoLines(content.items as { str: string; transform: number[] }[]);
      pages.push(rows.join('\n'));
    }
    return pages.join('\n');
  } finally {
    await doc.destroy();
  }
}

function groupIntoLines(items: { str: string; transform: number[] }[]): string[] {
  const rows = new Map<string, { y: number; x: number; text: string }[]>();
  for (const item of items) {
    if (!item.str) continue;
    const x = item.transform[4];
    const y = item.transform[5];
    const key = String(Math.round(y / 3));
    const row = rows.get(key) ?? [];
    row.push({ y, x, text: item.str });
    rows.set(key, row);
  }
  return Array.from(rows.values())
    .sort((a, b) => b[0].y - a[0].y)
    .map((row) =>
      row
        .sort((a, b) => a.x - b.x)
        .map((item) => item.text.trim())
        .filter(Boolean)
        .join(' '),
    )
    .map((line) => line.replace(/\s+/g, ' ').trim());
}

const SUMMARY_RE =
  /(\d+)\s+categories\s*·\s*(\d+)\s+providers\s*(?:·\s*(.*?))?\s*·\s*Complexity:\s*(\w+)/i;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function parsePricingLabel(label: string): Pick<StackProviderItem, 'pricingModel' | 'freeTier' | 'openSource'> {
  const parts = label.toLowerCase().split('·').map((p) => p.trim());
  const modelPart = parts[0] ?? '';
  let pricingModel: StackProviderItem['pricingModel'];
  switch (modelPart.replace(/\s+/g, '-')) {
    case 'free':
      pricingModel = 'free';
      break;
    case 'open-source':
      pricingModel = 'open-source';
      break;
    case 'freemium':
      pricingModel = 'freemium';
      break;
    case 'usage-based':
      pricingModel = 'usage-based';
      break;
    case 'subscription':
      pricingModel = 'subscription';
      break;
    case 'per-seat':
      pricingModel = 'per-seat';
      break;
    default:
      pricingModel = undefined;
  }
  return {
    pricingModel,
    freeTier: parts.some((p) => p.includes('free tier')),
    openSource: parts.some((p) => p.includes('open source')),
  };
}

export function parseStackFromPdfText(text: string): UserStack | null {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const summaryIndex = lines.findIndex((line) => SUMMARY_RE.test(line));
  if (summaryIndex < 0) return null;

  const title = lines[0] ?? 'Imported Stack';
  const summaryMatch = lines[summaryIndex].match(SUMMARY_RE);

  const prompt = summaryIndex > 1 ? lines[1] : '';

  const META_PREFIXES = ['Why:', 'Pricing:', 'Popularity:', 'Tags:', 'Links:', 'Built with StackPilot'];

  const providerHeadings = lines
    .slice(summaryIndex + 1)
    .map((line) => {
      if (META_PREFIXES.some((prefix) => line.startsWith(prefix))) return null;
      const parts = line.split('·').map((p) => p.trim());
      if (parts.length < 2) return null;
      return { name: parts[0], category: parts.slice(1).join('·').trim() };
    })
    .filter((p): p is { name: string; category: string } => Boolean(p));

  const categories: { name: string; providers: StackProviderItem[] }[] = [];
  for (const heading of providerHeadings) {
    if (!categories.some((c) => c.name === heading.category)) {
      categories.push({ name: heading.category, providers: [] });
    }
  }

  const rawComplexity = summaryMatch?.[4];
  const complexity: 'Low' | 'Medium' | 'High' | undefined =
    rawComplexity === 'Low' || rawComplexity === 'Medium' || rawComplexity === 'High'
      ? rawComplexity
      : undefined;

  let currentCategory: { name: string; providers: StackProviderItem[] } | null = null;
  let currentProvider: StackProviderItem | null = null;

  const body = lines.slice(summaryIndex + 1);

  const providerLine = (line: string) =>
    providerHeadings.find((h) => `${h.name} · ${h.category}` === line);

  for (const line of body) {
    const matched = providerLine(line);

    if (matched) {
      currentCategory =
        categories.find((c) => c.name === matched.category) ?? null;
      currentProvider = {
        providerId: slugify(matched.name),
        name: matched.name,
        description: '',
        reason: '',
        website: undefined,
        documentation: undefined,
        tags: [],
        features: [],
        pricingModel: undefined,
        freeTier: false,
        openSource: false,
        popularityScore: undefined,
        addedAt: new Date().toISOString(),
      };
      currentCategory?.providers.push(currentProvider);
      continue;
    }

    if (categories.some((c) => c.name === line)) {
      currentCategory = categories.find((c) => c.name === line) ?? null;
      currentProvider = null;
      continue;
    }

    if (!currentProvider) continue;

    if (line.startsWith('Why:')) {
      currentProvider.reason = line.replace(/^Why:\s*/, '').trim();
      continue;
    }

    if (line.startsWith('Pricing:')) {
      const parsed = parsePricingLabel(line.replace(/^Pricing:\s*/, '').trim());
      currentProvider.pricingModel = parsed.pricingModel;
      currentProvider.freeTier = parsed.freeTier;
      currentProvider.openSource = parsed.openSource;
      continue;
    }

    const popularity = line.match(/^Popularity:\s*(\d+)\/100/);
    if (popularity) {
      currentProvider.popularityScore = Number(popularity[1]);
      continue;
    }

    if (line.startsWith('Tags:')) {
      currentProvider.tags = line
        .replace(/^Tags:\s*/, '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
      continue;
    }

    if (line.startsWith('Links:')) {
      const links = line.replace(/^Links:\s*/, '');
      const website = links.match(/Website:\s*(https?:\/\/\S+)/);
      const docs = links.match(/Documentation:\s*(https?:\/\/\S+)/);
      if (website) currentProvider.website = website[1];
      if (docs) currentProvider.documentation = docs[1];
      continue;
    }

    const standaloneWebsite = line.match(/^Website:\s*(https?:\/\/\S+)/);
    if (standaloneWebsite) {
      currentProvider.website = standaloneWebsite[1];
      continue;
    }

    const standaloneDocs = line.match(/^Documentation:\s*(https?:\/\/\S+)/);
    if (standaloneDocs) {
      currentProvider.documentation = standaloneDocs[1];
      continue;
    }

    if (line.startsWith('Built with StackPilot')) continue;

    currentProvider.description = currentProvider.description
      ? `${currentProvider.description} ${line}`
      : line;
  }

  const filtered = categories.filter((c) => c.providers.length > 0);
  if (filtered.length === 0) return null;

  const projectType = summaryMatch?.[3]?.trim() || undefined;

  return {
    id: generateId(),
    name: title,
    prompt,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sourceAnalysis: {
      projectType,
      complexity,
      summary: '',
    },
    categories: filtered.map((c) => ({
      categoryId: slugify(c.name),
      categoryName: c.name,
      collapsed: false,
      providers: c.providers,
    })),
  };
}

export async function importStackFromPdf(file: File): Promise<UserStack | null> {
  const text = await extractPdfText(file);
  return parseStackFromPdfText(text);
}
