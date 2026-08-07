export type DocBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'code'; language: string; code: string }
  | { type: 'ul'; items: string[] }
  | {
      type: 'callout';
      tone: 'tip' | 'info' | 'warning';
      title: string;
      text: string;
    };

export type Doc = {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  blocks: DocBlock[];
};

export type DocGroup = {
  title: string;
  items: { slug: string; title: string; description: string }[];
};

const curlAnalyze = `# Requires an authenticated session (sign in to StackPilot first, then run
# this from the same browser, or include your session cookie).
curl -X POST https://get-stack.vercel.app/api/analyze \\
  -H "Content-Type: application/json" \\
  -d '{"description": "I want to build a YouTube clone"}';`;

const analyzeResponse = `{
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

const frontendExample = `// Example: query the API from your frontend.
// The request must be made with an authenticated session — the browser sends
// the session cookie automatically for same-origin requests like this one.
const response = await fetch('/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ description: 'I want to build a dating app' }),
});

const analysis = await response.json();

for (const category of analysis.categories) {
  console.log(\`\${category.name}: \${category.providers[0]?.name}\`);
}`;

export const docGroups: DocGroup[] = [
  {
    title: 'Getting Started',
    items: [
      {
        slug: 'getting-started',
        title: 'Getting Started',
        description: 'From idea to a complete tech stack in three steps.',
      },
      {
        slug: 'search',
        title: 'Search',
        description: 'Describe your project and let AI find what you need.',
      },
      {
        slug: 'tech-discovery',
        title: 'Tech Discovery',
        description: 'How StackPilot identifies the categories your project needs.',
      },
    ],
  },
  {
    title: 'Core Features',
    items: [
      {
        slug: 'compare',
        title: 'Compare',
        description: 'Compare providers side-by-side before you choose.',
      },
      {
        slug: 'ai',
        title: 'AI',
        description: 'The AI models and criteria behind recommendations.',
      },
    ],
  },
  {
    title: 'Technology Categories',
    items: [
      {
        slug: 'authentication',
        title: 'Authentication',
        description: 'Clerk, Auth0, Supabase Auth and friends.',
      },
      {
        slug: 'databases',
        title: 'Databases',
        description: 'SQL, NoSQL, vector and real-time databases.',
      },
      {
        slug: 'payments',
        title: 'Payments',
        description: 'Stripe, Paddle, Lemon Squeezy and billing APIs.',
      },
      {
        slug: 'cloud',
        title: 'Cloud',
        description: 'AWS, GCP, Azure and serverless platforms.',
      },
      {
        slug: 'deployment',
        title: 'Deployment',
        description: 'Ship your frontend, backend and edge functions.',
      },
    ],
  },
  {
    title: 'Resources',
    items: [
      {
        slug: 'api',
        title: 'API',
        description: 'Reference for the StackPilot analysis endpoint.',
      },
      {
        slug: 'faq',
        title: 'FAQ',
        description: 'Frequently asked questions about StackPilot.',
      },
    ],
  },
];

export const allDocs: Doc[] = [
  {
    slug: 'getting-started',
    title: 'Getting Started',
    description:
      'Learn how to describe your project, review the recommended technology categories, compare providers, and assemble a complete stack.',
    keywords: ['getting started', 'how it works', 'introduction', 'quick start', 'stackpilot'],
    blocks: [
      {
        type: 'p',
        text: 'StackPilot turns a plain-English project description into a complete technology stack. You describe what you want to build — a YouTube clone, a SaaS dashboard, an AI chatbot — and StackPilot identifies every category of technology your project needs and recommends the best providers for each one.',
      },
      { type: 'h2', text: 'Try it in one minute' },
      {
        type: 'ul',
        items: [
          'Go to the homepage and type a short description of your project.',
          'Press Search. StackPilot analyzes your idea with AI.',
          'Review the recommended categories and ranked providers on the results page.',
          'Open any category to compare providers in detail.',
          'Add your favorites and export your stack when ready.',
        ],
      },
      {
        type: 'callout',
        tone: 'tip',
        title: 'Be specific',
        text: 'The more detail you include — users, scale, platform, budget — the sharper the recommendations become.',
      },
      { type: 'h2', text: 'What you will get' },
      {
        type: 'p',
        text: 'Each analysis returns the technology categories your project genuinely requires, with providers ranked from best overall fit to niche or beginner-friendly options. Providers include a description, the best use cases, and links to their website and documentation.',
      },
      {
        type: 'code',
        language: 'json',
        code: analyzeResponse,
      },
      { type: 'h2', text: 'Next steps' },
      {
        type: 'p',
        text: 'Head over to Search to learn about the search experience, or Tech Discovery to understand how categories are chosen.',
      },
    ],
  },
  {
    slug: 'search',
    title: 'Search',
    description:
      'How to describe your project on the homepage, use popular searches, and what happens while StackPilot analyzes your idea.',
    keywords: ['search', 'query', 'describe project', 'popular searches', 'loading screen'],
    blocks: [
      {
        type: 'p',
        text: 'The search box on the homepage is the entry point to StackPilot. Type a description of the project you want to build and press Search to start the analysis.',
      },
      { type: 'h2', text: 'Writing a good description' },
      {
        type: 'ul',
        items: [
          'Name the product type: "a YouTube clone", "a food delivery app".',
          'Mention your audience and scale: "for 10,000 students".',
          'Note important constraints: "no-code", "self-hosted", "budget-friendly".',
          'Skip marketing fluff — concrete details get better results.',
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'Popular searches',
        text: 'Stuck for an idea? The homepage shows popular examples such as YouTube, Spotify, Netflix, Instagram, Uber, Discord, and AI Chatbot. Click one to run it instantly.',
      },
      { type: 'h2', text: 'While the analysis runs' },
      {
        type: 'p',
        text: 'After you search, StackPilot shows a progress screen that walks through understanding your project, identifying required technologies, finding the best providers, and building your stack.',
      },
      { type: 'h2', text: 'Handling errors' },
      {
        type: 'p',
        text: 'If the analysis fails — for example the AI provider is temporarily unavailable — an error message appears below the search box. Just try again; your description is never lost.',
      },
    ],
  },
  {
    slug: 'tech-discovery',
    title: 'Tech Discovery',
    description:
      'How StackPilot identifies which technology categories your project needs and how the category pages are organized.',
    keywords: ['categories', 'tech discovery', 'technology', 'stack', 'discovery'],
    blocks: [
      {
        type: 'p',
        text: 'Tech discovery is the core of StackPilot. After reading your project description, the AI decides which technology categories your project genuinely requires — nothing more, nothing less.',
      },
      { type: 'h2', text: 'How categories are chosen' },
      {
        type: 'ul',
        items: [
          'A video app needs video APIs, object storage, a CDN, and a database.',
          'A marketplace needs authentication, payments, email, and notifications.',
          'A mobile game might need real-time sync, analytics, and push notifications.',
        ],
      },
      {
        type: 'p',
        text: 'Categories include authentication, database, storage, video APIs, CDN, email, notifications, analytics, and hosting. Additional categories appear when your project requires them.',
      },
      { type: 'h2', text: 'Category pages' },
      {
        type: 'p',
        text: 'Every category page lists ranked providers with descriptions, best use cases, free-tier and open-source indicators. Each provider links to its website and documentation so you can verify details yourself.',
      },
      {
        type: 'code',
        language: 'json',
        code: analyzeResponse,
      },
      {
        type: 'callout',
        tone: 'tip',
        title: 'No category fits?',
        text: 'Static categories act as a fallback. When AI returns a category we do not ship yet, we still show its providers using the data returned by the analysis.',
      },
    ],
  },
  {
    slug: 'compare',
    title: 'Compare',
    description:
      'Compare technology providers side-by-side using rankings, best use cases, free tiers, and open-source indicators.',
    keywords: ['compare', 'providers', 'alternatives', 'ranking', 'best use cases'],
    blocks: [
      {
        type: 'p',
        text: 'Every category page ranks multiple providers so you can compare before you commit. Providers are ordered from the best overall fit for your project to niche or beginner-friendly alternatives.',
      },
      { type: 'h2', text: 'What to look at' },
      {
        type: 'ul',
        items: [
          'Rank — the overall fit for your specific project, not just popularity.',
          'Best use cases — the scenarios where the provider shines.',
          'Free tier — whether you can start without paying.',
          'Open source — whether you can self-host or inspect the code.',
        ],
      },
      { type: 'h2', text: 'Comparing databases' },
      {
        type: 'p',
        text: 'Database recommendations compare SQL, NoSQL, vector, and real-time engines. A relational database like PostgreSQL suits structured data and transactions, while a vector database is built for similarity search in AI applications.',
      },
      {
        type: 'callout',
        tone: 'warning',
        title: 'Verify before you commit',
        text: 'Recommendations reflect the AI\'s best judgment. Always confirm pricing, quotas, and compliance against your own requirements.',
      },
    ],
  },
  {
    slug: 'ai',
    title: 'AI',
    description:
      'The AI models and structured criteria StackPilot uses to analyze projects and rank technology providers.',
    keywords: ['ai', 'model', 'gemini', 'recommendation', 'ranking criteria', 'llm'],
    blocks: [
      {
        type: 'p',
        text: 'StackPilot uses large language models to read your project description and generate technology recommendations. Analysis runs on your latest description, so results are always fresh.',
      },
      { type: 'h2', text: 'Which AI models are supported' },
      {
        type: 'p',
        text: 'StackPilot is powered by the Google Gemini API for analysis. The provider library also includes AI categories, so your project can get recommendations for LLM providers, AI SDKs, and vector databases when it needs them.',
      },
      { type: 'h2', text: 'Ranking criteria' },
      {
        type: 'ul',
        items: [
          'Popularity and community adoption',
          'Reliability and production readiness',
          'Active maintenance and documentation quality',
          'Free tier availability and ease of integration',
          'Security, scalability, and performance',
        ],
      },
      {
        type: 'code',
        language: 'typescript',
        code: frontendExample,
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'Accuracy',
        text: 'Recommendations are AI-generated and continuously improved. Use them as a strong starting point, then verify final choices against your budget and requirements.',
      },
    ],
  },
  {
    slug: 'authentication',
    title: 'Authentication',
    description:
      'Auth providers such as Clerk, Auth0, and Supabase Auth — and how to pick the right one for your app.',
    keywords: ['authentication', 'auth', 'clerk', 'auth0', 'login', 'oauth', 'supabase auth'],
    blocks: [
      {
        type: 'p',
        text: 'Authentication handles user identity: sign-up, sign-in, sessions, and permissions. Choosing the right provider early avoids painful migration later.',
      },
      { type: 'h2', text: 'What StackPilot recommends' },
      {
        type: 'ul',
        items: [
          'Clerk — drop-in UI and session management, great for modern web apps.',
          'Auth0 — enterprise-grade identity with many integrations.',
          'Supabase Auth — built into the Supabase platform with Postgres.',
          'NextAuth.js — open-source auth for the Next.js ecosystem.',
        ],
      },
      { type: 'h2', text: 'How to choose' },
      {
        type: 'ul',
        items: [
          'Need social login and magic links quickly? Choose a hosted service like Clerk.',
          'Already using Supabase for your database? Use Supabase Auth.',
          'Want to self-host and control everything? Pick an open-source option.',
        ],
      },
      {
        type: 'callout',
        tone: 'tip',
        title: 'Start simple',
        text: 'Most apps can start with a hosted auth provider and switch later if needed. Avoid building your own auth from scratch.',
      },
    ],
  },
  {
    slug: 'databases',
    title: 'Databases',
    description:
      'SQL, NoSQL, vector, and real-time databases — and how StackPilot recommends the right one for your data model.',
    keywords: ['database', 'sql', 'nosql', 'postgresql', 'mongodb', 'redis', 'vector'],
    blocks: [
      {
        type: 'p',
        text: 'The database is the foundation of your stack. StackPilot recommends the engine that fits your data model, scale, and team.',
      },
      { type: 'h2', text: 'Database families' },
      {
        type: 'ul',
        items: [
          'Relational (SQL) — PostgreSQL, MySQL. Structured data and transactions.',
          'Document (NoSQL) — MongoDB. Flexible schemas for rapid iteration.',
          'In-memory / cache — Redis. Caching, queues, and real-time counters.',
          'Vector — pgvector, Pinecone, Weaviate. Similarity search for AI features.',
          'Real-time — Supabase Realtime, Firebase. Live data sync.',
        ],
      },
      { type: 'h2', text: 'How to choose' },
      {
        type: 'p',
        text: 'Start with the shape of your data. Structured and relational data points to PostgreSQL. Rapidly changing documents point to MongoDB. AI embeddings point to a vector database. When in doubt, PostgreSQL is a safe default that scales with you.',
      },
      {
        type: 'callout',
        tone: 'warning',
        title: 'Avoid over-engineering',
        text: 'A single well-chosen database beats a zoo of databases. Add specialized engines only when your workload genuinely needs them.',
      },
    ],
  },
  {
    slug: 'payments',
    title: 'Payments',
    description:
      'Payment providers like Stripe, Paddle, and Lemon Squeezy, plus billing, subscriptions, and revenue models.',
    keywords: ['payments', 'stripe', 'paddle', 'billing', 'subscriptions', 'lemon squeezy'],
    blocks: [
      {
        type: 'p',
        text: 'Payments cover checkout, subscriptions, invoicing, and revenue operations. The right provider depends on your market, pricing model, and where your customers are.',
      },
      { type: 'h2', text: 'Common providers' },
      {
        type: 'ul',
        items: [
          'Stripe — developer-friendly payments and billing, global scale.',
          'Paddle — merchant of record that handles taxes and compliance.',
          'Lemon Squeezy — simple digital-product checkout and licensing.',
          'PayPal / Razorpay — regional coverage and alternative audiences.',
        ],
      },
      { type: 'h2', text: 'Key decisions' },
      {
        type: 'ul',
        items: [
          'One-time payments or recurring subscriptions?',
          'Do you want to handle sales tax yourself or use a merchant of record?',
          'Which currencies and payment methods do your users expect?',
        ],
      },
      {
        type: 'callout',
        tone: 'tip',
        title: 'Start with one provider',
        text: 'Begin with a single payments provider and a simple pricing model. Add subscriptions and international billing as your revenue grows.',
      },
    ],
  },
  {
    slug: 'cloud',
    title: 'Cloud',
    description:
      'Cloud platforms such as AWS, Google Cloud, and Azure, plus serverless platforms like Vercel, Netlify, and Railway.',
    keywords: ['cloud', 'aws', 'gcp', 'azure', 'serverless', 'vercel', 'netlify', 'railway'],
    blocks: [
      {
        type: 'p',
        text: 'The cloud layer runs your application: compute, storage, networking, and managed services. StackPilot matches the platform to your deployment needs.',
      },
      { type: 'h2', text: 'Platforms' },
      {
        type: 'ul',
        items: [
          'AWS — the broadest service catalog, from EC2 to Lambda.',
          'Google Cloud — Kubernetes, data, and AI/ML strengths.',
          'Azure — deep enterprise and Microsoft integrations.',
          'Vercel — best-in-class for frontend and serverless functions.',
          'Netlify — simple static and serverless deploys with a friendly CLI.',
          'Railway — deploy backends and databases with zero config.',
        ],
      },
      { type: 'h2', text: 'How to choose' },
      {
        type: 'p',
        text: 'Frontend-heavy apps love Vercel or Netlify. Full-stack Node apps fit Railway, Vercel functions, or AWS. Data-heavy, ML, or regulated workloads often mean AWS, GCP, or Azure.',
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'Managed services',
        text: 'Prefer managed databases, queues, and object storage over running your own infrastructure. You move faster and avoid operations work.',
      },
    ],
  },
  {
    slug: 'deployment',
    title: 'Deployment',
    description:
      'Ship your frontend, backend, and edge functions with CI/CD, hosting, and monitoring best practices.',
    keywords: ['deployment', 'hosting', 'ci/cd', 'vercel', 'netlify', 'devops', 'monitoring'],
    blocks: [
      {
        type: 'p',
        text: 'Deployment moves your code from your machine to a production environment. A good deployment setup is repeatable, fast, and easy to roll back.',
      },
      { type: 'h2', text: 'Deployment checklist' },
      {
        type: 'ul',
        items: [
          'Connect your Git repository to a hosting platform.',
          'Preview deployments for every pull request.',
          'Automate builds, migrations, and environment variables.',
          'Configure a custom domain and HTTPS.',
          'Add uptime monitoring and error tracking.',
        ],
      },
      {
        type: 'code',
        language: 'bash',
        code: `# Example: deploy a Next.js app to Vercel
vercel login
vercel pull --yes --environment=production
vercel build --prod
vercel deploy --prebuilt --prod`,
      },
      {
        type: 'callout',
        tone: 'tip',
        title: 'Preview before production',
        text: 'Use preview deployments on every branch so you can test changes in a production-like environment before merging.',
      },
    ],
  },
  {
    slug: 'api',
    title: 'API',
    description:
      'Reference for the StackPilot analysis endpoint: request format, response schema, and error handling.',
    keywords: ['api', 'endpoint', 'analyze', 'request', 'response', 'reference', 'curl'],
    blocks: [
      {
        type: 'p',
        text: 'The StackPilot analysis API powers the search experience. It accepts a project description and returns a ranked technology stack.',
      },
      { type: 'h2', text: 'Endpoint' },
      {
        type: 'code',
        language: 'bash',
        code: `POST /api/analyze
Content-Type: application/json`,
      },
      { type: 'h2', text: 'Request body' },
      {
        type: 'code',
        language: 'json',
        code: `{
  "description": "I want to build a YouTube clone"
}`,
      },
      { type: 'h2', text: 'Example request' },
      {
        type: 'code',
        language: 'bash',
        code: curlAnalyze,
      },
      { type: 'h2', text: 'Response schema' },
      {
        type: 'code',
        language: 'json',
        code: analyzeResponse,
      },
      { type: 'h2', text: 'Errors' },
      {
        type: 'ul',
        items: [
          '401 — you are not signed in. Sign in to StackPilot before calling this endpoint.',
          '400 — the description is empty or too short.',
          '502 — the AI provider could not be reached. Try again shortly.',
          '500 — an unexpected server error occurred.',
        ],
      },
    ],
  },
  {
    slug: 'faq',
    title: 'FAQ',
    description:
      'Frequently asked questions about StackPilot, recommendations, pricing, and supported providers.',
    keywords: ['faq', 'questions', 'help', 'support', 'frequently asked'],
    blocks: [
      {
        type: 'p',
        text: 'Quick answers to the questions we hear most often. For the full list with search and filters, visit the FAQ page.',
      },
      { type: 'h2', text: 'Top questions' },
      {
        type: 'ul',
        items: [
          'What is StackPilot? — an AI tool that turns a project idea into a complete tech stack.',
          'Is it free? — yes, StackPilot is free to use.',
          'Which AI models are supported? — the analysis uses the Google Gemini API.',
          'Can I compare providers? — yes, every category page ranks multiple providers.',
          'Can I export my stack? — yes, you can export your assembled stack.',
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'More questions',
        text: 'Browse all questions, search them, and filter by category on the FAQ page.',
      },
    ],
  },
];

export const flatDocList: { slug: string; title: string; description: string }[] =
  docGroups.flatMap((group) => group.items);

export function getDoc(slug: string): Doc | undefined {
  return allDocs.find((doc) => doc.slug === slug);
}

export function getDocGroup(slug: string): DocGroup | undefined {
  return docGroups.find((group) => group.items.some((item) => item.slug === slug));
}

export function getDocIndex(slug: string): number {
  return flatDocList.findIndex((item) => item.slug === slug);
}

export function getPrevNext(slug: string): {
  prev?: { slug: string; title: string };
  next?: { slug: string; title: string };
} {
  const index = getDocIndex(slug);
  if (index === -1) return {};
  return {
    prev: index > 0 ? flatDocList[index - 1] : undefined,
    next: index < flatDocList.length - 1 ? flatDocList[index + 1] : undefined,
  };
}

export function getDocHeadings(doc: Doc): { id: string; text: string; level: 2 | 3 }[] {
  return doc.blocks
    .filter((block): block is Extract<DocBlock, { type: 'h2' | 'h3' }> =>
      block.type === 'h2' || block.type === 'h3',
    )
    .map((block, index) => ({
      id: `section-${index}`,
      text: block.text,
      level: block.type === 'h3' ? 3 : 2,
    }));
}
