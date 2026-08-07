import { jsPDF } from 'jspdf';
import type { StackHealth, UserStack } from './types';
import {
  complexityDifficulty,
  formatCurrency,
  stackCategoryCount,
  stackProviderCount,
} from './health';
import { pricingLabel } from './comparison';

export function buildPdfDoc(stack: UserStack, health: StackHealth): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const PAGE_WIDTH = doc.internal.pageSize.getWidth();
  const PAGE_HEIGHT = doc.internal.pageSize.getHeight();
  const MARGIN = 48;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
  const BOTTOM = PAGE_HEIGHT - 48;
  let y = MARGIN;

  const ensureSpace = (needed: number) => {
    if (y + needed > BOTTOM) {
      doc.addPage();
      y = MARGIN;
    }
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(26, 26, 46);
  doc.text(stack.name, MARGIN, y);
  y += 26;

  if (stack.prompt) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(12);
    doc.setTextColor(96, 96, 118);
    const lines = doc.splitTextToSize(stack.prompt, CONTENT_WIDTH) as string[];
    for (const line of lines) {
      doc.text(line, MARGIN, y);
      y += 17;
    }
    y += 10;
  }

  const cost = health?.estimatedMonthlyCost ?? 0;
  const difficulty = complexityDifficulty(stack.sourceAnalysis?.complexity);
  const projectType = stack.sourceAnalysis?.projectType;
  const summary =
    `${stackCategoryCount(stack)} categories · ${stackProviderCount(stack)} providers` +
    (projectType ? ` · ${projectType}` : '') +
    ` · Complexity: ${difficulty} · Est. monthly cost: ${formatCurrency(cost)}`;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const summaryLines = doc.splitTextToSize(summary, CONTENT_WIDTH) as string[];
  const summaryHeight = summaryLines.length * 16 + 18;
  ensureSpace(summaryHeight);
  doc.setFillColor(246, 245, 251);
  doc.roundedRect(MARGIN, y - 13, CONTENT_WIDTH, summaryHeight, 6, 6, 'F');
  doc.setTextColor(40, 40, 60);
  for (const line of summaryLines) {
    doc.text(line, MARGIN + 12, y);
    y += 16;
  }
  y += 10;

  for (const category of stack.categories) {
    if (category.providers.length === 0) continue;
    ensureSpace(46);
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(109, 40, 217);
    doc.text(category.categoryName, MARGIN, y);
    y += 5;
    doc.setDrawColor(167, 139, 250);
    doc.setLineWidth(1.5);
    doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);
    y += 20;

    for (const provider of category.providers) {
      ensureSpace(56);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13.5);
      doc.setTextColor(26, 26, 46);
      doc.text(`${provider.name} · ${category.categoryName}`, MARGIN, y);
      y += 16;

      if (provider.description) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(70, 70, 90);
        const lines = doc.splitTextToSize(provider.description, CONTENT_WIDTH) as string[];
        for (const line of lines) {
          doc.text(line, MARGIN, y);
          y += 14;
        }
      }

      if (provider.reason) {
        ensureSpace(24);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10.5);
        doc.setTextColor(74, 63, 120);
        const lines = doc.splitTextToSize(`Why: ${provider.reason}`, CONTENT_WIDTH) as string[];
        for (const line of lines) {
          doc.text(line, MARGIN, y);
          y += 13;
        }
      }

      const meta: string[] = [`Pricing: ${pricingLabel(provider)}`];
      if (typeof provider.popularityScore === 'number') {
        meta.push(`Popularity: ${provider.popularityScore}/100`);
      }
      if (provider.tags?.length) {
        meta.push(`Tags: ${provider.tags.join(', ')}`);
      }
      if (provider.website) {
        meta.push(`Website: ${provider.website}`);
      }
      if (provider.documentation) {
        meta.push(`Documentation: ${provider.documentation}`);
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(90, 90, 110);
      for (const line of meta) {
        const wrapped = doc.splitTextToSize(line, CONTENT_WIDTH) as string[];
        ensureSpace(wrapped.length * 12 + 2);
        for (const l of wrapped) {
          doc.text(l, MARGIN, y);
          y += 12;
        }
      }
      y += 6;
    }
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(140, 140, 160);
  doc.text('Built with Stack2Set — AI-powered tech stack discovery.', MARGIN, BOTTOM);

  return doc;
}

export function downloadPdf(stack: UserStack, health: StackHealth, filename: string): void {
  buildPdfDoc(stack, health).save(filename);
}
