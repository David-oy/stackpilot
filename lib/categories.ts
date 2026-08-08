import {
  ShieldCheck,
  Database,
  HardDrive,
  Video,
  Globe,
  Mail,
  Bell,
  BarChart3,
  Cloud,
  Layers,
  MonitorSmartphone,
  Server,
  CloudCog,
  CreditCard,
  Brain,
  Sparkles,
  Search,
  Zap,
  Activity,
  ScrollText,
  LayoutDashboard,
  Rocket,
  Map,
  ScanText,
  Languages,
  Mic,
  MessageSquare,
  FlaskConical,
  Workflow,
  Box,
  CloudLightning,
  Repeat,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CSSProperties } from 'react';

/**
 * Centralized category color system.
 *
 * Every technology category maps to ONE visual identity. The same color is
 * reused everywhere (workspace cards, browse pages, provider chips, dialogs,
 * landing preview) so a category always looks the same across the product.
 *
 * Use `hex` / `rgb` for inline styles (glows, borders) via `categoryCssVars`
 * and the `cat-*` utilities in globals.css. Use `text` / `gradient` for
 * static Tailwind classes (icon color, icon-box gradients).
 */
export type CategoryColor = {
  /** Hex accent (400-level) used for glows and inline borders. */
  hex: string;
  /** "r, g, b" triplet for rgba() values in inline styles. */
  rgb: string;
  /** Tailwind text class for the accent (e.g. "text-purple-300"). */
  text: string;
  /** Tailwind gradient classes for icon backgrounds. */
  gradient: string;
};

const C = {
  purple: {
    hex: '#c084fc',
    rgb: '192,132,252',
    text: 'text-purple-300',
    gradient: 'from-purple-500/25 to-violet-500/20',
  },
  violet: {
    hex: '#a78bfa',
    rgb: '167,139,250',
    text: 'text-violet-300',
    gradient: 'from-violet-500/25 to-purple-500/20',
  },
  indigo: {
    hex: '#818cf8',
    rgb: '129,140,248',
    text: 'text-indigo-300',
    gradient: 'from-indigo-500/25 to-blue-500/20',
  },
  blue: {
    hex: '#60a5fa',
    rgb: '96,165,250',
    text: 'text-blue-300',
    gradient: 'from-blue-500/25 to-sky-500/20',
  },
  sky: {
    hex: '#38bdf8',
    rgb: '56,189,248',
    text: 'text-sky-300',
    gradient: 'from-sky-500/25 to-blue-500/20',
  },
  cyan: {
    hex: '#22d3ee',
    rgb: '34,211,238',
    text: 'text-cyan-300',
    gradient: 'from-cyan-500/25 to-sky-500/20',
  },
  teal: {
    hex: '#2dd4bf',
    rgb: '45,212,191',
    text: 'text-teal-300',
    gradient: 'from-teal-500/25 to-emerald-500/20',
  },
  emerald: {
    hex: '#34d399',
    rgb: '52,211,153',
    text: 'text-emerald-300',
    gradient: 'from-emerald-500/25 to-teal-500/20',
  },
  green: {
    hex: '#4ade80',
    rgb: '74,222,128',
    text: 'text-green-300',
    gradient: 'from-green-500/25 to-emerald-500/20',
  },
  lime: {
    hex: '#a3e635',
    rgb: '163,230,53',
    text: 'text-lime-300',
    gradient: 'from-lime-500/25 to-green-500/20',
  },
  yellow: {
    hex: '#facc15',
    rgb: '250,204,21',
    text: 'text-yellow-300',
    gradient: 'from-yellow-500/25 to-amber-500/20',
  },
  amber: {
    hex: '#fbbf24',
    rgb: '251,191,36',
    text: 'text-amber-300',
    gradient: 'from-amber-500/25 to-orange-500/20',
  },
  orange: {
    hex: '#fb923c',
    rgb: '251,146,60',
    text: 'text-orange-300',
    gradient: 'from-orange-500/25 to-amber-500/20',
  },
  red: {
    hex: '#f87171',
    rgb: '248,113,113',
    text: 'text-red-300',
    gradient: 'from-red-500/25 to-rose-500/20',
  },
  rose: {
    hex: '#fb7185',
    rgb: '251,113,133',
    text: 'text-rose-300',
    gradient: 'from-rose-500/25 to-pink-500/20',
  },
  pink: {
    hex: '#f472b6',
    rgb: '244,114,182',
    text: 'text-pink-300',
    gradient: 'from-pink-500/25 to-rose-500/20',
  },
  fuchsia: {
    hex: '#e879f9',
    rgb: '232,121,249',
    text: 'text-fuchsia-300',
    gradient: 'from-fuchsia-500/25 to-purple-500/20',
  },
  slate: {
    hex: '#94a3b8',
    rgb: '148,163,184',
    text: 'text-slate-300',
    gradient: 'from-slate-500/25 to-zinc-500/20',
  },
} satisfies Record<string, CategoryColor>;

export type Category = {
  id: string;
  name: string;
  icon: LucideIcon;
  providers: number;
  description: string;
  gradient: string;
  iconColor: string;
  color: CategoryColor;
  recommended: string;
};

export const categories: Category[] = [
  {
    id: 'frontend',
    name: 'Frontend',
    icon: MonitorSmartphone,
    providers: 7,
    description: 'Frameworks and libraries for building modern, interactive user interfaces.',
    color: C.purple,
    recommended: 'React',
  },
  {
    id: 'backend',
    name: 'Backend',
    icon: Server,
    providers: 7,
    description: 'Runtimes and frameworks for APIs, business logic, and server-side processing.',
    color: C.blue,
    recommended: 'Node.js',
  },
  {
    id: 'authentication',
    name: 'Authentication',
    icon: ShieldCheck,
    providers: 7,
    description: 'OAuth, magic links, biometrics, and session management for secure user login.',
    color: C.orange,
    recommended: 'Clerk',
  },
  {
    id: 'database',
    name: 'Database',
    icon: Database,
    providers: 8,
    description: 'SQL, NoSQL, vector, and real-time databases to store and query your data.',
    color: C.green,
    recommended: 'PostgreSQL',
  },
  {
    id: 'hosting',
    name: 'Hosting',
    icon: Cloud,
    providers: 7,
    description: 'Deploy and scale your frontend, backend, and serverless functions globally.',
    color: C.cyan,
    recommended: 'Vercel',
  },
  {
    id: 'cloud',
    name: 'Cloud',
    icon: CloudCog,
    providers: 6,
    description: 'Infrastructure providers for compute, networking, and managed services.',
    color: C.cyan,
    recommended: 'Amazon Web Services',
  },
  {
    id: 'storage',
    name: 'Storage',
    icon: HardDrive,
    providers: 7,
    description: 'File and object storage solutions for images, videos, and user uploads.',
    color: C.teal,
    recommended: 'Cloudinary',
  },
  {
    id: 'payments',
    name: 'Payments',
    icon: CreditCard,
    providers: 7,
    description: 'Payment processing, subscriptions, and billing infrastructure.',
    color: C.pink,
    recommended: 'Stripe',
  },
  {
    id: 'email',
    name: 'Email',
    icon: Mail,
    providers: 7,
    description: 'Transactional and marketing email APIs with templates and deliverability.',
    color: C.sky,
    recommended: 'Resend',
  },
  {
    id: 'analytics',
    name: 'Analytics',
    icon: BarChart3,
    providers: 7,
    description: 'Product analytics, event tracking, and user behavior insights.',
    color: C.yellow,
    recommended: 'PostHog',
  },
  {
    id: 'ai-models',
    name: 'AI Models',
    icon: Brain,
    providers: 7,
    description: 'Model inference and hosting platforms to run AI and machine learning workloads.',
    color: C.violet,
    recommended: 'Hugging Face',
  },
  {
    id: 'llm',
    name: 'LLM',
    icon: Sparkles,
    providers: 7,
    description: 'Large language model APIs for chat, generation, and AI-powered features.',
    color: C.violet,
    recommended: 'OpenAI',
  },
  {
    id: 'search',
    name: 'Search',
    icon: Search,
    providers: 8,
    description: 'Full-text, typo-tolerant, and vector search engines and APIs.',
    color: C.indigo,
    recommended: 'Meilisearch',
  },
  {
    id: 'caching',
    name: 'Caching',
    icon: Zap,
    providers: 6,
    description: 'In-memory and edge caches to speed up reads and reduce latency.',
    color: C.amber,
    recommended: 'Redis',
  },
  {
    id: 'monitoring',
    name: 'Monitoring',
    icon: Activity,
    providers: 6,
    description: 'Observability for metrics, traces, uptime, and application performance.',
    color: C.red,
    recommended: 'Datadog',
  },
  {
    id: 'logging',
    name: 'Logging',
    icon: ScrollText,
    providers: 6,
    description: 'Centralized log aggregation, querying, and analysis.',
    color: C.slate,
    recommended: 'Better Stack',
  },
  {
    id: 'cms',
    name: 'CMS',
    icon: LayoutDashboard,
    providers: 7,
    description: 'Content management systems for structured content and editing workflows.',
    color: C.emerald,
    recommended: 'Sanity',
  },
  {
    id: 'deployment',
    name: 'Deployment',
    icon: Rocket,
    providers: 7,
    description: 'Platforms for shipping, hosting, and releasing your applications.',
    color: C.rose,
    recommended: 'Vercel',
  },
  {
    id: 'maps',
    name: 'Maps',
    icon: Map,
    providers: 7,
    description: 'Mapping, geocoding, routing, and location-based services.',
    color: C.lime,
    recommended: 'Google Maps Platform',
  },
  {
    id: 'ocr',
    name: 'OCR',
    icon: ScanText,
    providers: 7,
    description: 'Optical character recognition to extract text from images and documents.',
    color: C.cyan,
    recommended: 'Tesseract OCR',
  },
  {
    id: 'translation',
    name: 'Translation',
    icon: Languages,
    providers: 6,
    description: 'Machine translation APIs and localization tooling.',
    color: C.indigo,
    recommended: 'Google Cloud Translation',
  },
  {
    id: 'voice',
    name: 'Voice',
    icon: Mic,
    providers: 7,
    description: 'Speech-to-text, text-to-speech, and voice call APIs.',
    color: C.purple,
    recommended: 'ElevenLabs',
  },
  {
    id: 'chat',
    name: 'Chat',
    icon: MessageSquare,
    providers: 6,
    description: 'In-app chat, messaging, and realtime communication APIs.',
    color: C.rose,
    recommended: 'Sendbird',
  },
  {
    id: 'notifications',
    name: 'Notifications',
    icon: Bell,
    providers: 7,
    description: 'Push notifications, in-app messaging, and multi-channel alert systems.',
    color: C.pink,
    recommended: 'OneSignal',
  },
  {
    id: 'testing',
    name: 'Testing',
    icon: FlaskConical,
    providers: 7,
    description: 'Unit, integration, and end-to-end testing frameworks and tools.',
    color: C.emerald,
    recommended: 'Jest',
  },
  {
    id: 'devops',
    name: 'DevOps',
    icon: Workflow,
    providers: 6,
    description: 'Infrastructure as code and configuration management tooling.',
    color: C.amber,
    recommended: 'Terraform',
  },
  {
    id: 'containerization',
    name: 'Containerization',
    icon: Box,
    providers: 7,
    description: 'Containers, orchestration, and related runtimes for packaging apps.',
    color: C.sky,
    recommended: 'Docker',
  },
  {
    id: 'serverless',
    name: 'Serverless',
    icon: CloudLightning,
    providers: 7,
    description: 'Function-as-a-service platforms that scale to zero and back.',
    color: C.violet,
    recommended: 'AWS Lambda',
  },
  {
    id: 'ci-cd',
    name: 'CI/CD',
    icon: Repeat,
    providers: 7,
    description: 'Continuous integration and continuous delivery pipelines.',
    color: C.teal,
    recommended: 'GitHub Actions',
  },
  {
    id: 'video-apis',
    name: 'Video APIs',
    icon: Video,
    providers: 7,
    description: 'Video streaming, transcoding, live streaming, and player SDKs.',
    color: C.fuchsia,
    recommended: 'Mux',
  },
  {
    id: 'cdn',
    name: 'CDN',
    icon: Globe,
    providers: 7,
    description: 'Global content delivery networks for low-latency asset distribution.',
    color: C.cyan,
    recommended: 'Cloudflare',
  },
].map(({ color, ...rest }) => ({ ...rest, gradient: color.gradient, iconColor: color.text, color }));

export const fallbackCategory: Category = {
  id: 'technology',
  name: 'Technology',
  icon: Layers,
  providers: 0,
  description: '',
  gradient: C.slate.gradient,
  iconColor: C.slate.text,
  color: C.slate,
  recommended: '',
};

export function getCategoryMeta(id: string): Category {
  return categories.find((c) => c.id === id) ?? fallbackCategory;
}

/**
 * CSS custom properties consumed by the `cat-*` utilities (globals.css).
 * Set them on a wrapper element to make category accents (borders, glows,
 * top lines) available to descendants without inline styles everywhere.
 */
export type CategoryCssVars = CSSProperties & {
  '--cat-hex'?: string;
  '--cat-rgb'?: string;
};

export function categoryCssVars(color: CategoryColor): CategoryCssVars {
  return { '--cat-hex': color.hex, '--cat-rgb': color.rgb };
}
