'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/landing/theme-switcher';
import { cn } from '@/lib/utils';

type NavLink = {
  label: string;
  href: string;
  section?: string;
};

const navLinks: NavLink[] = [
  { label: 'Home', href: '/', section: 'hero' },
  { label: 'Explore', href: '/#how-it-works', section: 'how-it-works' },
  { label: 'Compare', href: '/#features', section: 'features' },
  { label: 'Pricing', href: '/#cta', section: 'cta' },
  { label: 'Docs', href: '/docs' },
  { label: 'FAQ', href: '/faq' },
];

const HOME_SECTIONS = ['how-it-works', 'features', 'cta'];

function smoothScrollTo(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (pathname !== '/') {
      setActiveSection(null);
      return;
    }
    const sections = HOME_SECTIONS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 },
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  const isActive = (link: NavLink): boolean => {
    if (link.label === 'Home') {
      return pathname === '/';
    }
    if (link.href === '/docs') {
      return pathname === '/docs' || pathname.startsWith('/docs/');
    }
    if (link.href === '/faq') {
      return pathname === '/faq';
    }
    if (link.section && pathname === '/') {
      return activeSection === link.section;
    }
    return false;
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, link: NavLink) => {
    setMobileOpen(false);
    if (link.section) {
      if (pathname === '/') {
        e.preventDefault();
        smoothScrollTo(link.section);
      }
      return;
    }
    if (link.href === '/') {
      e.preventDefault();
      if (pathname === '/') {
        smoothScrollTo('hero');
      } else {
        window.scrollTo({ top: 0, behavior: 'auto' });
        window.location.href = '/';
      }
    }
  };

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled || mobileOpen
          ? 'glass border-b border-foreground/5 shadow-[0_8px_30px_rgba(0,0,0,0.08)]'
          : 'border-b border-transparent',
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-5">
          <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-500">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              Stack<span className="gradient-text">Pilot</span>
            </span>
          </Link>
          <div className="hidden md:block">
            <ThemeSwitcher />
          </div>
        </div>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleNavClick(e, link)}
              aria-current={isActive(link) ? 'page' : undefined}
              className={cn(
                'relative rounded-lg px-3 py-2 text-sm transition-colors',
                isActive(link)
                  ? 'font-medium text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {isActive(link) && (
                <span className="absolute inset-0 rounded-lg bg-foreground/5" aria-hidden="true" />
              )}
              <span className="relative">{link.label}</span>
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" className="text-sm text-muted-foreground hover:text-foreground">
            Login
          </Button>
          <Button className="bg-gradient-to-r from-violet-500 to-blue-500 text-sm text-white shadow-lg shadow-violet-500/20 transition-all hover:from-violet-600 hover:to-blue-600 hover:shadow-violet-500/30">
            Get Started
          </Button>
        </div>

        <button
          className="text-foreground md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="glass border-t border-foreground/5 md:hidden">
          <div className="flex flex-col gap-1 px-4 py-4 sm:px-6">
            <div className="mb-2 self-start">
              <ThemeSwitcher />
            </div>
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link)}
                aria-current={isActive(link) ? 'page' : undefined}
                className={cn(
                  'rounded-lg px-3 py-2.5 text-sm transition-colors',
                  isActive(link)
                    ? 'bg-foreground/5 font-medium text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-3 border-t border-foreground/5 pt-3">
              <Button variant="outline" className="border-foreground/10 text-foreground">
                Login
              </Button>
              <Button className="bg-gradient-to-r from-violet-500 to-blue-500 text-white">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
