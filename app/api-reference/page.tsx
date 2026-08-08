import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { CodeBlock } from '@/components/docs/code-block';
import { breadcrumbSchema, serializeJsonLd } from '@/lib/jsonld';
import { siteConfig } from '@/lib/site';

export const metadata: Metadata = {
  title: 'API Reference',
  description:
    'Reference for the Stack2Set analysis endpoint: request format, response schema, and error handling.',
  alternates: { canonical: '/api-reference' },
};

const curlExample = `# Requires an authenticated session (sign in to Stack2Set first,
# then run this from the same browser, or include your session cookie).
curl -X POST ${siteConfig.url}/api/analyze \\
  -H "Content-Type: application/json" \\
  -d '{"description": "I want to build a YouTube clone"}';`;

const responseExample = `{
  "query": "I want to build a YouTube clone",
  "categories": [
    {
      "id": "authentication",
      "name": "Authentication",
      "providers": [
        {
          "name": "Clerk",
          "rank": 1,
          "description": "Drop-in auth with OAuth and session management.",
          "bestUseCases": ["User login", "Multi-tenant SaaS"],
          "website": "https://clerk.com"
        }
      ]
    }
  ]
}`;

export default function ApiReferencePage() {
  const jsonLd = breadcrumbSchema([
    { name: 'Docs', url: '/docs' },
    { name: 'API Reference', url: '/api-reference' },
  ]);

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <Navbar />
      <div className="relative overflow-hidden px-4 pb-24 pt-32 sm:px-6 sm:pt-36">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-teal-500/10 blur-[120px]" />

        <div className="mx-auto max-w-3xl">
          <header className="text-center">
            <p className="text-sm font-medium text-teal-400">API Reference</p>
            <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Stack2Set <span className="gradient-text">analysis API</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Send a project description and get a ranked technology stack back. This is the same
              endpoint that powers the search experience.
            </p>
          </header>

          <section className="mt-12">
            <h2 className="text-lg font-semibold text-foreground">Endpoint</h2>
            <CodeBlock
              code={`POST /api/analyze
Content-Type: application/json`}
              language="bash"
            />
            <h2 className="mt-8 text-lg font-semibold text-foreground">Example request</h2>
            <CodeBlock code={curlExample} language="bash" />
            <h2 className="mt-8 text-lg font-semibold text-foreground">Response schema</h2>
            <CodeBlock code={responseExample} language="json" />
            <h2 className="mt-8 text-lg font-semibold text-foreground">Errors</h2>
            <ul className="mt-3 space-y-2">
              {[
                ['401', 'You are not signed in. Sign in to use this endpoint.'],
                ['400', 'The description is empty or too short.'],
                ['502', 'The AI provider could not be reached. Try again shortly.'],
                ['500', 'An unexpected server error occurred.'],
              ].map(([code, text]) => (
                <li key={code} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <span className="mt-0.5 font-mono text-xs text-teal-400">{code}</span>
                  {text}
                </li>
              ))}
            </ul>
            <p className="mt-8 text-sm text-muted-foreground">
              Read the full guide in the{' '}
              <a href="/docs/api" className="text-teal-400 transition-colors hover:text-teal-300">
                API documentation
              </a>
              .
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}
