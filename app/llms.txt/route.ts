import { siteConfig } from '@/lib/site';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const base = siteConfig.url;
  const body = `# Stack2Set

> AI-powered technology stack discovery for developers.

Stack2Set is an AI-powered developer tool that analyzes your project idea and recommends the best technologies, APIs, databases, authentication providers, hosting services, and developer tools. Describe what you want to build and Stack2Set returns a complete, ranked tech stack with provider comparisons.

## Purpose

Stack2Set helps developers discover every technology, API, and service needed to build a project. Instead of manually researching hundreds of tools, describe your idea in plain English and get a curated, ranked list of recommended providers with reasoning, best use cases, and official links.

## Homepage

- ${base}/

## Important URLs

- Homepage: ${base}/
- Results: ${base}/results
- Category providers: ${base}/category?id={category}
- FAQ: ${base}/faq
- Documentation: ${base}/docs
- Sitemap: ${base}/sitemap.xml
- robots.txt: ${base}/robots.txt

## Supported features

- AI-powered tech stack recommendations
- Technology category identification (databases, auth, hosting, storage, CDN, email, notifications, analytics, AI tools, frontend/backend frameworks)
- Ranked provider lists with "why it is recommended" and best use cases
- Provider comparison
- Free tier, open source, and popularity filtering
- Build and save a personalized tech stack
- Dark / light theme

## Target audience

- Software developers and engineers
- Startup founders and indie hackers
- Full-stack developers planning new projects
- Technical teams evaluating tooling
- Students learning modern web development

## Example queries users can ask

- "I want to build a YouTube clone" — what stack should I use?
- "Which database should I use for a real-time chat app?"
- "Best authentication provider for a Next.js app?"
- "What are the best AI tools and LLM providers?"
- "Recommended hosting platform for a serverless API?"
- "Best open-source alternative to commercial databases?"
- "Which frontend framework should I pick for a React project?"

## Contact

- GitHub: https://github.com/David-oy/get.stack
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
