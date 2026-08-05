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
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type Category = {
  id: string;
  name: string;
  icon: LucideIcon;
  providers: number;
  description: string;
  gradient: string;
  iconColor: string;
  recommended: string;
};

export const categories: Category[] = [
  {
    id: 'authentication',
    name: 'Authentication',
    icon: ShieldCheck,
    providers: 12,
    description: 'OAuth, magic links, biometrics, and session management for secure user login.',
    gradient: 'from-amber-500/20 to-orange-500/20',
    iconColor: 'text-amber-300',
    recommended: 'Clerk',
  },
  {
    id: 'database',
    name: 'Database',
    icon: Database,
    providers: 18,
    description: 'SQL, NoSQL, vector, and real-time databases to store and query your data.',
    gradient: 'from-emerald-500/20 to-teal-500/20',
    iconColor: 'text-emerald-300',
    recommended: 'PostgreSQL',
  },
  {
    id: 'storage',
    name: 'Storage',
    icon: HardDrive,
    providers: 9,
    description: 'File and object storage solutions for images, videos, and user uploads.',
    gradient: 'from-pink-500/20 to-rose-500/20',
    iconColor: 'text-pink-300',
    recommended: 'Cloudinary',
  },
  {
    id: 'video-apis',
    name: 'Video APIs',
    icon: Video,
    providers: 7,
    description: 'Video streaming, transcoding, live streaming, and player SDKs.',
    gradient: 'from-violet-500/20 to-purple-500/20',
    iconColor: 'text-violet-300',
    recommended: 'Mux',
  },
  {
    id: 'cdn',
    name: 'CDN',
    icon: Globe,
    providers: 8,
    description: 'Global content delivery networks for low-latency asset distribution.',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    iconColor: 'text-blue-300',
    recommended: 'Cloudflare',
  },
  {
    id: 'email',
    name: 'Email',
    icon: Mail,
    providers: 11,
    description: 'Transactional and marketing email APIs with templates and deliverability.',
    gradient: 'from-indigo-500/20 to-blue-500/20',
    iconColor: 'text-indigo-300',
    recommended: 'Resend',
  },
  {
    id: 'notifications',
    name: 'Notifications',
    icon: Bell,
    providers: 6,
    description: 'Push notifications, in-app messaging, and multi-channel alert systems.',
    gradient: 'from-fuchsia-500/20 to-pink-500/20',
    iconColor: 'text-fuchsia-300',
    recommended: 'OneSignal',
  },
  {
    id: 'analytics',
    name: 'Analytics',
    icon: BarChart3,
    providers: 10,
    description: 'Product analytics, event tracking, and user behavior insights.',
    gradient: 'from-cyan-500/20 to-sky-500/20',
    iconColor: 'text-cyan-300',
    recommended: 'PostHog',
  },
  {
    id: 'hosting',
    name: 'Hosting',
    icon: Cloud,
    providers: 14,
    description: 'Deploy and scale your frontend, backend, and serverless functions globally.',
    gradient: 'from-violet-500/20 to-blue-500/20',
    iconColor: 'text-violet-300',
    recommended: 'Vercel',
  },
];

export const fallbackCategory: Category = {
  id: 'technology',
  name: 'Technology',
  icon: Layers,
  providers: 0,
  description: '',
  gradient: 'from-slate-500/20 to-zinc-500/20',
  iconColor: 'text-slate-300',
  recommended: '',
};

export function getCategoryMeta(id: string): Category {
  return categories.find((c) => c.id === id) ?? fallbackCategory;
}

export const loadingSteps = [
  'Understanding your project...',
  'Identifying required technologies...',
  'Finding the best providers...',
  'Building your stack...',
];
