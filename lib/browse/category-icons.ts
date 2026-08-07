import {
  Activity,
  BarChart3,
  Bell,
  BrainCircuit,
  Cloud,
  CloudCog,
  Container,
  CreditCard,
  Database,
  FileText,
  FlaskConical,
  GitBranch,
  Globe,
  HardDrive,
  Languages,
  Layout,
  Mail,
  Map,
  MessageCircle,
  Mic,
  Rocket,
  ScanText,
  ScrollText,
  Search,
  Server,
  Settings,
  ShieldCheck,
  Sparkles,
  Video,
  Zap,
  Layers,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  layout: Layout,
  server: Server,
  'shield-check': ShieldCheck,
  database: Database,
  cloud: Cloud,
  'cloud-cog': CloudCog,
  'hard-drive': HardDrive,
  'credit-card': CreditCard,
  mail: Mail,
  'bar-chart-3': BarChart3,
  'brain-circuit': BrainCircuit,
  sparkles: Sparkles,
  search: Search,
  zap: Zap,
  activity: Activity,
  'scroll-text': ScrollText,
  'file-text': FileText,
  rocket: Rocket,
  map: Map,
  'scan-text': ScanText,
  languages: Languages,
  mic: Mic,
  'message-circle': MessageCircle,
  bell: Bell,
  'flask-conical': FlaskConical,
  settings: Settings,
  container: Container,
  'git-branch': GitBranch,
  video: Video,
  globe: Globe,
};

export function categoryIcon(name?: string | null): LucideIcon {
  return CATEGORY_ICONS[name ?? ''] ?? Layers;
}

export const CATEGORY_GRADIENTS = [
  'from-sky-500/20 to-blue-500/20',
  'from-violet-500/20 to-purple-500/20',
  'from-emerald-500/20 to-teal-500/20',
  'from-amber-500/20 to-orange-500/20',
  'from-rose-500/20 to-pink-500/20',
  'from-cyan-500/20 to-sky-500/20',
  'from-fuchsia-500/20 to-pink-500/20',
  'from-indigo-500/20 to-violet-500/20',
];

export const CATEGORY_ICON_COLORS = [
  'text-sky-300',
  'text-violet-300',
  'text-emerald-300',
  'text-amber-300',
  'text-rose-300',
  'text-cyan-300',
  'text-fuchsia-300',
  'text-indigo-300',
];

export function categoryVisual(index: number): { gradient: string; iconColor: string } {
  return {
    gradient: CATEGORY_GRADIENTS[index % CATEGORY_GRADIENTS.length],
    iconColor: CATEGORY_ICON_COLORS[index % CATEGORY_ICON_COLORS.length],
  };
}
