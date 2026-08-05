import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/lib/theme-provider';
import { StackProvider } from '@/lib/stack-context';

const inter = Inter({ subsets: ['latin'] });

const themeInitScript = `(function(){try{var e=localStorage.getItem('stackpilot-theme');var m=window.matchMedia('(prefers-color-scheme: dark)');var isDark;if(e==='light'){isDark=false}else if(e==='dark'){isDark=true}else{isDark=!e||e==='system'?m.matches:false}var d=document.documentElement;d.classList.add(isDark?'dark':'light');d.style.colorScheme=isDark?'dark':'light'}catch(e){}})()`;

export const metadata: Metadata = {
  title: 'StackPilot — Discover every technology to build your next project',
  description:
    'StackPilot helps developers discover all the technologies they need to build a project — APIs, databases, authentication providers, storage, AI models, hosting, payments, and more.',
  openGraph: {
    title: 'StackPilot — Discover every technology to build your next project',
    description:
      'Describe your project. Let AI identify the required technology categories. Choose providers and build your tech stack.',
    images: [{ url: 'https://bolt.new/static/og_default.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: [{ url: 'https://bolt.new/static/og_default.png' }],
  },
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
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <StackProvider>{children}</StackProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
