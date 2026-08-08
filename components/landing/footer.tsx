import { Github, Mail, Twitter, Sparkles } from 'lucide-react';
import { siteConfig } from '@/lib/site';

const footerLinks: Record<string, { label: string; href: string }[]> = {
  Product: [
    { label: 'Features', href: '/features' },
    { label: 'Explore', href: '/explore' },
    { label: 'Browse Providers', href: '/browse/providers' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Changelog', href: '/changelog' },
  ],
  Resources: [
    { label: 'Documentation', href: '/docs' },
    { label: 'API Reference', href: '/api-reference' },
    { label: 'Blog', href: '/blog' },
    { label: 'Community', href: '/community' },
    { label: 'Status', href: '/status' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
};

const socialLinks = [
  { icon: Github, href: 'https://github.com/David-oy/get.stack', label: 'GitHub' },
  { icon: Twitter, href: 'https://x.com/vijayyyyy_7', label: 'Twitter' },
  { icon: Mail, href: 'mailto:vijay.peddenti434@gmail.com', label: 'Email' },
];

export function Footer() {
  return (
    <footer className="relative border-t border-foreground/5 py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <a href="#" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold tracking-tight text-foreground">
                Stack<span className="gradient-text">2set</span>
              </span>
            </a>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Discover every technology, API, and service needed to build your next application.
            </p>
            <div className="mt-6 flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg glass glass-hover text-muted-foreground transition-colors hover:text-foreground"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
            <p className="mt-3 text-[11px] font-medium tracking-wide text-muted-foreground/60">
              v{siteConfig.version}
            </p>
          </div>

          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-sm font-semibold text-foreground">{heading}</h4>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-foreground/5 pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Stack2Set. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built for developers, by developers with LOVE!.
          </p>
        </div>
      </div>
    </footer>
  );
}
