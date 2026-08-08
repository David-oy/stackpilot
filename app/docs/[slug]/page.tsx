import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CodeBlock } from '@/components/docs/code-block';
import { DocsToc } from '@/components/docs/docs-toc';
import { siteConfig } from '@/lib/site';
import {
  getDoc,
  getDocGroup,
  getPrevNext,
  getDocHeadings,
  allDocs,
  type DocBlock,
} from '@/lib/docs';

export function generateStaticParams() {
  return allDocs.map((doc) => ({ slug: doc.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const doc = getDoc(params.slug);
  if (!doc) return { title: 'Not Found' };
  return {
    title: doc.title,
    description: doc.description,
    alternates: { canonical: `/docs/${doc.slug}` },
    openGraph: {
      type: 'website',
      title: `${doc.title} — ${siteConfig.name}`,
      description: doc.description,
    },
  };
}

function Callout({ block }: { block: Extract<DocBlock, { type: 'callout' }> }) {
  const styles = {
    tip: 'border-emerald-500/30 bg-emerald-500/[0.06]',
    info: 'border-sky-500/30 bg-sky-500/[0.06]',
    warning: 'border-amber-500/30 bg-amber-500/[0.06]',
  } as const;
  const labels = { tip: 'Tip', info: 'Note', warning: 'Warning' } as const;
  return (
    <aside className={`my-4 rounded-xl border p-4 ${styles[block.tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
        {labels[block.tone]}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{block.text}</p>
    </aside>
  );
}

function renderBlock(block: DocBlock, index: number) {
  switch (block.type) {
    case 'p':
      return (
        <p key={index} className="text-[15px] leading-relaxed text-muted-foreground">
          {block.text}
        </p>
      );
    case 'h2':
      return (
        <h2
          key={index}
          id={`section-${index}`}
          className="mt-10 scroll-mt-28 text-2xl font-semibold tracking-tight text-foreground"
        >
          {block.text}
        </h2>
      );
    case 'h3':
      return (
        <h3
          key={index}
          id={`section-${index}`}
          className="mt-8 scroll-mt-28 text-lg font-semibold tracking-tight text-foreground"
        >
          {block.text}
        </h3>
      );
    case 'code':
      return <CodeBlock key={index} code={block.code} language={block.language} />;
    case 'ul':
      return (
        <ul key={index} className="my-4 space-y-2">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-muted-foreground">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
              {item}
            </li>
          ))}
        </ul>
      );
    case 'callout':
      return <Callout key={index} block={block} />;
  }
}

export default function DocPage({ params }: { params: { slug: string } }) {
  const doc = getDoc(params.slug);
  if (!doc) notFound();

  const group = getDocGroup(doc.slug);
  const { prev, next } = getPrevNext(doc.slug);
  const headings = getDocHeadings(doc);

  return (
    <div className="flex gap-10">
      <article className="min-w-0 flex-1">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="transition-colors hover:text-foreground">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/docs" className="transition-colors hover:text-foreground">
                Docs
              </Link>
            </li>
            {group && (
              <>
                <li aria-hidden="true">/</li>
                <li>
                  <Link
                    href="/docs"
                    className="transition-colors hover:text-foreground"
                  >
                    {group.title}
                  </Link>
                </li>
              </>
            )}
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="font-medium text-foreground">
              {doc.title}
            </li>
          </ol>
        </nav>

        <header>
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {doc.title}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">{doc.description}</p>
        </header>

        <div className="mt-8">{doc.blocks.map(renderBlock)}</div>

        <nav
          aria-label="Previous and next pages"
          className="mt-16 flex flex-col gap-3 border-t border-foreground/5 pt-6 sm:flex-row"
        >
          {prev ? (
            <Link
              href={`/docs/${prev.slug}`}
              className="group flex flex-1 items-center gap-3 rounded-2xl glass p-4 transition-all hover:-translate-y-0.5"
            >
              <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
              <span>
                <span className="block text-xs text-muted-foreground">Previous</span>
                <span className="block text-sm font-medium text-foreground">{prev.title}</span>
              </span>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
          {next && (
            <Link
              href={`/docs/${next.slug}`}
              className="group flex flex-1 items-center justify-end gap-3 rounded-2xl glass p-4 text-right transition-all hover:-translate-y-0.5"
            >
              <span>
                <span className="block text-xs text-muted-foreground">Next</span>
                <span className="block text-sm font-medium text-foreground">{next.title}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </nav>
      </article>

      <DocsToc items={headings} />
    </div>
  );
}
