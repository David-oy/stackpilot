import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { CTA } from '@/components/landing/cta';

export type StaticSection = {
  title: string;
  body?: string;
  items?: { title: string; body: string; href?: string }[];
};

export type StaticPageProps = {
  eyebrow: string;
  title: string;
  highlight?: string;
  description: string;
  sections: StaticSection[];
  showCta?: boolean;
};

export function StaticPage({
  eyebrow,
  title,
  highlight,
  description,
  sections,
  showCta = true,
}: StaticPageProps) {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navbar />

      <div className="relative overflow-hidden px-4 pb-20 pt-32 sm:px-6 sm:pt-36">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-[120px]" />

        <header className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium text-violet-400">{eyebrow}</p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {title}
            {highlight && <span className="gradient-text"> {highlight}</span>}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {description}
          </p>
        </header>

        <div className="mx-auto mt-16 max-w-5xl">
          {sections.map((section) => (
            <section key={section.title} className="mt-14 first:mt-0">
              <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {section.title}
              </h2>
              {section.body && (
                <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">
                  {section.body}
                </p>
              )}
              {section.items && (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {section.items.map((item) => {
                    const content = (
                      <>
                        <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                          {item.body}
                        </p>
                        {item.href && (
                          <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-violet-400">
                            Learn more <ArrowRight className="h-3 w-3" />
                          </span>
                        )}
                      </>
                    );
                    return item.href ? (
                      <Link
                        key={item.title}
                        href={item.href}
                        className="glass glass-hover group rounded-2xl p-6 transition-all hover:-translate-y-1"
                      >
                        {content}
                      </Link>
                    ) : (
                      <div key={item.title} className="glass rounded-2xl p-6">
                        {content}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>

      {showCta && <CTA />}
      <Footer />
    </main>
  );
}
