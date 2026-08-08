import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/lib/theme-provider';
import { AuthProvider } from '@/lib/auth/auth-context';
import { WorkspaceProvider } from '@/lib/workspaces/context';
import { StackProvider } from '@/lib/stack-context';
import { AnalysisProvider } from '@/lib/analysis-context';
import { FavoritesProvider } from '@/lib/favorites-context';
import { siteConfig } from '@/lib/site';
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({ subsets: ['latin'] });

const themeInitScript = `(function(){try{var e=localStorage.getItem('stack2set-theme');var m=window.matchMedia('(prefers-color-scheme: dark)');var isDark;if(e==='light'){isDark=false}else if(e==='dark'){isDark=true}else{isDark=!e||e==='system'?m.matches:false}var d=document.documentElement;d.classList.add(isDark?'dark':'light');d.style.colorScheme=isDark?'dark':'light'}catch(e){}})()`;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: siteConfig.authors,
  creator: siteConfig.creator,
  publisher: siteConfig.publisher,
  category: siteConfig.category,
  applicationName: siteConfig.name,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: siteConfig.openGraph.type,
    url: siteConfig.url,
    siteName: siteConfig.openGraph.siteName,
    title: siteConfig.title,
    description: siteConfig.description,
    locale: siteConfig.openGraph.locale,
    images: [{ url: '/og.svg', width: 1200, height: 630, alt: siteConfig.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.title,
    description: siteConfig.description,
    creator: siteConfig.twitterHandle,
    images: ['/og.svg'],
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: siteConfig.name,
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
    email: false,
  },
  viewport: 'width=device-width, initial-scale=1',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: siteConfig.themeColor.light },
    { media: '(prefers-color-scheme: dark)', color: siteConfig.themeColor.dark },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
          suppressHydrationWarning
        />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://generativelanguage.googleapis.com" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <WorkspaceProvider>
              <FavoritesProvider>
                <AnalysisProvider>
                  <StackProvider>{children}</StackProvider>
                </AnalysisProvider>
              </FavoritesProvider>
            </WorkspaceProvider>
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
