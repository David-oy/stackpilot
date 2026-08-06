import type { StackHealth, StackProviderItem, StackExportFile, UserStack } from './types';
import { STACK_EXPORT_TYPE, STACK_EXPORT_VERSION } from './types';
import { stackExportSchema, userStackSchema } from './repository';
import { complexityDifficulty, formatCurrency, stackCategoryCount, stackProviderCount } from './health';
import { pricingLabel } from './comparison';

export function stackToExportFile(stack: UserStack, health: StackHealth): StackExportFile {
  return {
    type: STACK_EXPORT_TYPE,
    version: STACK_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    stack,
    health,
  };
}

export function toJsonExport(stack: UserStack, health: StackHealth): string {
  return JSON.stringify(stackToExportFile(stack, health), null, 2);
}

function escapeMarkdown(value: string): string {
  return value.replace(/([\\`*_[\]()#+.!-])/g, '\\$1');
}

export function toMarkdown(stack: UserStack): string {
  const lines: string[] = [];
  lines.push(`# ${stack.name}`);
  lines.push('');
  if (stack.prompt) {
    lines.push(`> ${stack.prompt}`);
    lines.push('');
  }
  const analysis = stack.sourceAnalysis;
  lines.push(
    `**${stackCategoryCount(stack)} categories · ${stackProviderCount(stack)} providers**` +
      (analysis?.projectType ? ` · ${escapeMarkdown(analysis.projectType)}` : '') +
      (analysis?.complexity ? ` · Complexity: ${analysis.complexity}` : ''),
  );
  lines.push('');

  for (const category of stack.categories) {
    lines.push(`## ${category.categoryName}`);
    lines.push('');
    if (category.providers.length === 0) {
      lines.push('_No provider selected._');
      lines.push('');
      continue;
    }
    for (const provider of category.providers) {
      lines.push(`### ${provider.name}`);
      lines.push('');
      lines.push(provider.description || '');
      if (provider.reason) {
        lines.push('');
        lines.push(`**Why:** ${provider.reason}`);
      }
      lines.push('');
      lines.push(`- **Pricing:** ${pricingLabel(provider)}`);
      if (typeof provider.popularityScore === 'number') {
        lines.push(`- **Popularity:** ${provider.popularityScore}/100`);
      }
      if (provider.tags?.length) {
        lines.push(`- **Tags:** ${provider.tags.join(', ')}`);
      }
      if (provider.website) {
        lines.push(`- **Website:** ${provider.website}`);
      }
      if (provider.documentation) {
        lines.push(`- **Documentation:** ${provider.documentation}`);
      }
      lines.push('');
    }
  }

  lines.push('---');
  lines.push('');
  lines.push(
    `_Built with [StackPilot](${'https://get-stack.vercel.app'}) — AI-powered tech stack discovery._`,
  );
  return lines.join('\n').trim() + '\n';
}

export function parseStackImport(text: string): UserStack | null {
  try {
    const parsed = JSON.parse(text);
    if (
      parsed &&
      typeof parsed === 'object' &&
      (parsed as StackExportFile).type === STACK_EXPORT_TYPE
    ) {
      const result = stackExportSchema.safeParse(parsed);
      if (result.success) return result.data.stack;
    }
    const result = userStackSchema.safeParse(parsed);
    if (result.success) return result.data;
    return null;
  } catch {
    return null;
  }
}

export function downloadText(filename: string, text: string, mime = 'text/plain'): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

const ESCAPE_HTML = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function providerToHtml(provider: StackProviderItem, categoryName: string): string {
  const links: string[] = [];
  if (provider.website) {
    links.push(
      `<a href="${ESCAPE_HTML(provider.website)}" target="_blank" rel="noopener">Website: ${ESCAPE_HTML(provider.website)}</a>`,
    );
  }
  if (provider.documentation) {
    links.push(
      `<a href="${ESCAPE_HTML(provider.documentation)}" target="_blank" rel="noopener">Documentation: ${ESCAPE_HTML(provider.documentation)}</a>`,
    );
  }
  return `
    <section class="provider">
      <h3>${ESCAPE_HTML(provider.name)} <small>· ${ESCAPE_HTML(categoryName)}</small></h3>
      <p class="desc">${ESCAPE_HTML(provider.description || '')}</p>
      ${provider.reason ? `<p class="reason"><strong>Why:</strong> ${ESCAPE_HTML(provider.reason)}</p>` : ''}
      <ul class="meta">
        <li><strong>Pricing:</strong> ${ESCAPE_HTML(pricingLabel(provider))}</li>
        <li><strong>Popularity:</strong> ${typeof provider.popularityScore === 'number' ? `${provider.popularityScore}/100` : '—'}</li>
        ${provider.tags?.length ? `<li><strong>Tags:</strong> ${ESCAPE_HTML(provider.tags.join(', '))}</li>` : ''}
        ${links.length ? `<li><strong>Links:</strong> ${links.join(' · ')}</li>` : ''}
      </ul>
    </section>`;
}

export function printStackHtml(stack: UserStack, health: StackHealth): void {
  const analysis = stack.sourceAnalysis;
  const cost = health?.estimatedMonthlyCost ?? 0;
  const difficulty = complexityDifficulty(analysis?.complexity);
  const categoriesHtml = stack.categories
    .filter((c) => c.providers.length > 0)
    .map(
      (c) => `
      <section class="category">
        <h2>${ESCAPE_HTML(c.categoryName)}</h2>
        ${c.providers.map((p) => providerToHtml(p, c.categoryName)).join('')}
      </section>`,
    )
    .join('');

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${ESCAPE_HTML(stack.name)} — StackPilot</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; color: #1a1a2e; margin: 40px; }
    h1 { font-size: 26px; margin-bottom: 4px; }
    h2 { font-size: 18px; border-bottom: 2px solid #a78bfa; padding-bottom: 4px; margin-top: 28px; }
    h3 { font-size: 15px; margin: 16px 0 4px; }
    h3 small { font-weight: 400; color: #666; }
    .prompt { color: #555; font-style: italic; margin: 8px 0 16px; }
    .summary { background: #f6f5fb; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; }
    .provider { margin: 10px 0 18px; }
    .provider .desc { margin: 4px 0; }
    .provider .reason { color: #4a3f78; margin: 4px 0; }
    .meta { list-style: none; padding: 0; margin: 6px 0; font-size: 13px; color: #333; }
    .meta li { margin: 2px 0; }
    a { color: #6d28d9; }
    .footer { margin-top: 30px; font-size: 12px; color: #888; }
  </style>
</head>
<body>
  <h1>${ESCAPE_HTML(stack.name)}</h1>
  ${stack.prompt ? `<p class="prompt">${ESCAPE_HTML(stack.prompt)}</p>` : ''}
  <div class="summary">
    <strong>${stackCategoryCount(stack)} categories · ${stackProviderCount(stack)} providers</strong>
    ${analysis?.projectType ? ` · ${ESCAPE_HTML(analysis.projectType)}` : ''}
    · Complexity: <strong>${difficulty}</strong>
    · Est. monthly cost: <strong>${formatCurrency(cost)}</strong>
  </div>
  ${categoriesHtml}
  <p class="footer">Built with StackPilot — AI-powered tech stack discovery.</p>
  <script>window.onload = function(){ window.focus(); window.print(); };</script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
    return;
  }

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  if (!doc) {
    iframe.remove();
    return;
  }
  doc.open();
  doc.write(html.replace(/<script[\s\S]*?<\/script>/g, ''));
  doc.close();
  iframe.contentWindow?.addEventListener('afterprint', () => {
    setTimeout(() => iframe.remove(), 1000);
  });
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  }, 250);
}
