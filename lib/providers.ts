import type { LucideIcon } from 'lucide-react';

export type Provider = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  freeTier: boolean;
  openSource: boolean;
  paid: boolean;
  beginnerFriendly: boolean;
  popular: boolean;
  logoColor: string;
  logoText: string;
};

export type CategoryProviders = {
  categoryId: string;
  providers: Provider[];
};

export const providersByCategory: Record<string, Provider[]> = {
  authentication: [
    { id: 'clerk', name: 'Clerk', description: 'Drop-in auth components and pre-built UI for React, Next.js, and more.', tags: ['OAuth', 'Pre-built UI', 'Session Management'], freeTier: true, openSource: false, paid: true, beginnerFriendly: true, popular: true, logoColor: 'from-violet-500 to-purple-500', logoText: 'C' },
    { id: 'auth0', name: 'Auth0', description: 'Enterprise-grade identity platform with SSO, MFA, and social login.', tags: ['OAuth', 'SSO', 'MFA'], freeTier: true, openSource: false, paid: true, beginnerFriendly: false, popular: true, logoColor: 'from-orange-500 to-red-500', logoText: 'A' },
    { id: 'supabase-auth', name: 'Supabase Auth', description: 'Open-source auth with row-level security, built on PostgreSQL.', tags: ['OAuth', 'Open Source', 'RLS'], freeTier: true, openSource: true, paid: true, beginnerFriendly: true, popular: true, logoColor: 'from-emerald-500 to-teal-500', logoText: 'S' },
    { id: 'nextauth', name: 'NextAuth.js', description: 'Flexible auth library for Next.js with 70+ built-in providers.', tags: ['OAuth', 'Open Source', 'JWT'], freeTier: true, openSource: true, paid: false, beginnerFriendly: true, popular: true, logoColor: 'from-blue-500 to-cyan-500', logoText: 'N' },
    { id: 'firebase-auth', name: 'Firebase Auth', description: 'Google-backed authentication with phone, email, and social login.', tags: ['OAuth', 'Phone Auth', 'Google'], freeTier: true, openSource: false, paid: true, beginnerFriendly: true, popular: true, logoColor: 'from-amber-500 to-orange-500', logoText: 'F' },
    { id: 'lucia', name: 'Lucia', description: 'Lightweight, type-safe auth library with full control over sessions.', tags: ['Open Source', 'Sessions', 'TypeScript'], freeTier: true, openSource: true, paid: false, beginnerFriendly: false, popular: false, logoColor: 'from-pink-500 to-rose-500', logoText: 'L' },
  ],
  database: [
    { id: 'postgresql', name: 'PostgreSQL', description: 'Powerful open-source relational database with JSON support and extensions.', tags: ['SQL', 'Relational', 'ACID'], freeTier: true, openSource: true, paid: false, beginnerFriendly: false, popular: true, logoColor: 'from-blue-500 to-indigo-500', logoText: 'P' },
    { id: 'mongodb', name: 'MongoDB', description: 'Document-based NoSQL database built for developers and scaling.', tags: ['NoSQL', 'Document', 'Scalable'], freeTier: true, openSource: true, paid: true, beginnerFriendly: true, popular: true, logoColor: 'from-emerald-500 to-green-500', logoText: 'M' },
    { id: 'supabase-db', name: 'Supabase', description: 'Postgres database with realtime, auth, and storage in one platform.', tags: ['SQL', 'Postgres', 'Realtime'], freeTier: true, openSource: true, paid: true, beginnerFriendly: true, popular: true, logoColor: 'from-emerald-500 to-teal-500', logoText: 'S' },
    { id: 'neon', name: 'Neon', description: 'Serverless Postgres with branching, instant scaling, and copy-on-write.', tags: ['SQL', 'Serverless', 'Postgres'], freeTier: true, openSource: true, paid: true, beginnerFriendly: true, popular: true, logoColor: 'from-cyan-500 to-blue-500', logoText: 'N' },
    { id: 'planetscale', name: 'PlanetScale', description: 'MySQL-compatible serverless database with Git-like branching.', tags: ['SQL', 'Serverless', 'MySQL'], freeTier: false, openSource: false, paid: true, beginnerFriendly: true, popular: true, logoColor: 'from-violet-500 to-fuchsia-500', logoText: 'P' },
    { id: 'firebase-db', name: 'Firebase Firestore', description: 'NoSQL document database with realtime sync and offline support.', tags: ['NoSQL', 'Realtime', 'Serverless'], freeTier: true, openSource: false, paid: true, beginnerFriendly: true, popular: true, logoColor: 'from-amber-500 to-orange-500', logoText: 'F' },
  ],
  storage: [
    { id: 'cloudinary', name: 'Cloudinary', description: 'Media management with on-the-fly image and video transformations.', tags: ['Images', 'Video', 'CDN'], freeTier: true, openSource: false, paid: true, beginnerFriendly: true, popular: true, logoColor: 'from-blue-500 to-cyan-500', logoText: 'C' },
    { id: 's3', name: 'AWS S3', description: 'Industry-standard object storage with unmatched scale and durability.', tags: ['Object Storage', 'Scalable', 'AWS'], freeTier: true, openSource: false, paid: true, beginnerFriendly: false, popular: true, logoColor: 'from-amber-500 to-yellow-500', logoText: 'S' },
    { id: 'supabase-storage', name: 'Supabase Storage', description: 'S3-compatible storage with image resizing and RLS policies.', tags: ['S3-Compatible', 'RLS', 'Images'], freeTier: true, openSource: true, paid: true, beginnerFriendly: true, popular: true, logoColor: 'from-emerald-500 to-teal-500', logoText: 'S' },
    { id: 'uploadthing', name: 'UploadThing', description: 'Type-safe file uploads for Next.js with zero infrastructure.', tags: ['File Upload', 'TypeScript', 'Next.js'], freeTier: true, openSource: false, paid: true, beginnerFriendly: true, popular: false, logoColor: 'from-violet-500 to-purple-500', logoText: 'U' },
    { id: 'backblaze', name: 'Backblaze B2', description: 'Affordable S3-compatible cloud storage at a fraction of the cost.', tags: ['S3-Compatible', 'Affordable'], freeTier: true, openSource: false, paid: true, beginnerFriendly: true, popular: false, logoColor: 'from-red-500 to-rose-500', logoText: 'B' },
  ],
  'video-apis': [
    { id: 'mux', name: 'Mux', description: 'Video API for streaming, encoding, and analytics with a player SDK.', tags: ['Streaming', 'Encoding', 'Player'], freeTier: false, openSource: false, paid: true, beginnerFriendly: true, popular: true, logoColor: 'from-pink-500 to-rose-500', logoText: 'M' },
    { id: 'cloudflare-stream', name: 'Cloudflare Stream', description: 'End-to-end video streaming with encoding and global delivery built-in.', tags: ['Streaming', 'CDN', 'Encoding'], freeTier: false, openSource: false, paid: true, beginnerFriendly: true, popular: true, logoColor: 'from-orange-500 to-amber-500', logoText: 'C' },
    { id: 'api-video', name: 'api.video', description: 'Developer-first video API for live streaming and on-demand hosting.', tags: ['Live Streaming', 'VOD', 'SDK'], freeTier: true, openSource: false, paid: true, beginnerFriendly: true, popular: false, logoColor: 'from-violet-500 to-indigo-500', logoText: 'A' },
    { id: 'youtube-embed', name: 'YouTube IFrame API', description: 'Embed and control YouTube videos with a lightweight player API.', tags: ['Embed', 'Free', 'Player'], freeTier: true, openSource: false, paid: false, beginnerFriendly: true, popular: true, logoColor: 'from-red-500 to-rose-500', logoText: 'Y' },
  ],
  cdn: [
    { id: 'cloudflare', name: 'Cloudflare', description: 'Global CDN with edge computing, DDoS protection, and caching.', tags: ['Edge', 'DDoS Protection', 'Caching'], freeTier: true, openSource: false, paid: true, beginnerFriendly: true, popular: true, logoColor: 'from-orange-500 to-amber-500', logoText: 'C' },
    { id: 'vercel-cdn', name: 'Vercel Edge Network', description: 'Edge CDN built into Vercel with instant cache invalidation.', tags: ['Edge', 'Next.js', 'Caching'], freeTier: true, openSource: false, paid: true, beginnerFriendly: true, popular: true, logoColor: 'from-zinc-400 to-zinc-600', logoText: 'V' },
    { id: 'fastly', name: 'Fastly', description: 'Real-time CDN with programmable edge and image optimization.', tags: ['Edge', 'Realtime', 'Image Opt'], freeTier: false, openSource: false, paid: true, beginnerFriendly: false, popular: false, logoColor: 'from-red-500 to-rose-500', logoText: 'F' },
    { id: 'bunny', name: 'Bunny CDN', description: 'Affordable, high-performance CDN with per-GB pricing.', tags: ['Affordable', 'Caching', 'Per-GB'], freeTier: false, openSource: false, paid: true, beginnerFriendly: true, popular: false, logoColor: 'from-cyan-500 to-blue-500', logoText: 'B' },
  ],
  email: [
    { id: 'resend', name: 'Resend', description: 'Modern email API for developers with React templates and analytics.', tags: ['React Email', 'API', 'Analytics'], freeTier: true, openSource: false, paid: true, beginnerFriendly: true, popular: true, logoColor: 'from-zinc-400 to-zinc-600', logoText: 'R' },
    { id: 'sendgrid', name: 'SendGrid', description: 'Email delivery and marketing platform with templates and tracking.', tags: ['Marketing', 'Transactional', 'Templates'], freeTier: true, openSource: false, paid: true, beginnerFriendly: true, popular: true, logoColor: 'from-blue-500 to-cyan-500', logoText: 'S' },
    { id: 'postmark', name: 'Postmark', description: 'Reliable transactional email with fast delivery and detailed stats.', tags: ['Transactional', 'Fast', 'Reliable'], freeTier: false, openSource: false, paid: true, beginnerFriendly: true, popular: false, logoColor: 'from-amber-500 to-orange-500', logoText: 'P' },
    { id: 'mailgun', name: 'Mailgun', description: 'Powerful email API with validation, routing, and analytics.', tags: ['API', 'Validation', 'Routing'], freeTier: false, openSource: false, paid: true, beginnerFriendly: false, popular: true, logoColor: 'from-red-500 to-pink-500', logoText: 'M' },
  ],
  notifications: [
    { id: 'onesignal', name: 'OneSignal', description: 'Multi-channel push notifications, email, and SMS in one API.', tags: ['Push', 'SMS', 'Email'], freeTier: true, openSource: false, paid: true, beginnerFriendly: true, popular: true, logoColor: 'from-red-500 to-rose-500', logoText: 'O' },
    { id: 'firebase-fcm', name: 'Firebase Cloud Messaging', description: 'Free cross-platform push notifications from Google Firebase.', tags: ['Push', 'Free', 'Cross-platform'], freeTier: true, openSource: false, paid: false, beginnerFriendly: true, popular: true, logoColor: 'from-amber-500 to-orange-500', logoText: 'F' },
    { id: 'novu', name: 'Novu', description: 'Open-source notification infrastructure for multi-channel messaging.', tags: ['Open Source', 'Multi-channel', 'In-app'], freeTier: true, openSource: true, paid: true, beginnerFriendly: true, popular: false, logoColor: 'from-violet-500 to-fuchsia-500', logoText: 'N' },
    { id: 'pusher-beams', name: 'Pusher Beams', description: 'Managed push notifications with simple SDKs and delivery tracking.', tags: ['Push', 'SDK', 'Managed'], freeTier: true, openSource: false, paid: true, beginnerFriendly: true, popular: false, logoColor: 'from-pink-500 to-rose-500', logoText: 'P' },
  ],
  analytics: [
    { id: 'posthog', name: 'PostHog', description: 'Open-source product analytics with events, funnels, and feature flags.', tags: ['Open Source', 'Funnels', 'Feature Flags'], freeTier: true, openSource: true, paid: true, beginnerFriendly: true, popular: true, logoColor: 'from-blue-500 to-indigo-500', logoText: 'P' },
    { id: 'mixpanel', name: 'Mixpanel', description: 'Event-based product analytics with powerful segmentation and retention.', tags: ['Events', 'Segmentation', 'Retention'], freeTier: true, openSource: false, paid: true, beginnerFriendly: true, popular: true, logoColor: 'from-violet-500 to-purple-500', logoText: 'M' },
    { id: 'amplitude', name: 'Amplitude', description: 'Product analytics with behavioral cohorts and A/B testing.', tags: ['Cohorts', 'A/B Testing', 'Events'], freeTier: true, openSource: false, paid: true, beginnerFriendly: false, popular: true, logoColor: 'from-blue-500 to-cyan-500', logoText: 'A' },
    { id: 'plausible', name: 'Plausible', description: 'Lightweight, privacy-friendly analytics with no cookies.', tags: ['Privacy', 'Lightweight', 'Open Source'], freeTier: false, openSource: true, paid: true, beginnerFriendly: true, popular: true, logoColor: 'from-emerald-500 to-teal-500', logoText: 'P' },
  ],
  hosting: [
    { id: 'vercel', name: 'Vercel', description: 'Frontend cloud built for Next.js with edge functions and previews.', tags: ['Next.js', 'Edge', 'Serverless'], freeTier: true, openSource: false, paid: true, beginnerFriendly: true, popular: true, logoColor: 'from-zinc-400 to-zinc-600', logoText: 'V' },
    { id: 'netlify', name: 'Netlify', description: 'All-in-one platform for deploying static and serverless sites.', tags: ['Static', 'Serverless', 'CI/CD'], freeTier: true, openSource: false, paid: true, beginnerFriendly: true, popular: true, logoColor: 'from-cyan-500 to-teal-500', logoText: 'N' },
    { id: 'railway', name: 'Railway', description: 'Deploy apps and databases with zero config and instant provisioning.', tags: ['Full-stack', 'Zero Config', 'DB Hosting'], freeTier: true, openSource: false, paid: true, beginnerFriendly: true, popular: true, logoColor: 'from-violet-500 to-indigo-500', logoText: 'R' },
    { id: 'fly', name: 'Fly.io', description: 'Run full-stack apps and databases close to users globally.', tags: ['Full-stack', 'Global', 'Docker'], freeTier: true, openSource: false, paid: true, beginnerFriendly: false, popular: true, logoColor: 'from-violet-500 to-fuchsia-500', logoText: 'F' },
    { id: 'render', name: 'Render', description: 'Unified cloud for web services, background workers, and databases.', tags: ['Full-stack', 'Docker', 'DB Hosting'], freeTier: true, openSource: false, paid: true, beginnerFriendly: true, popular: true, logoColor: 'from-violet-500 to-purple-500', logoText: 'R' },
  ],
};
