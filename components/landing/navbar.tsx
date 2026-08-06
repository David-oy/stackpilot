'use client';

import { useState, useEffect } from 'react';
import { Menu, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/landing/theme-switcher';

const navLinks = [
  { label: 'Features', href: '/#features' },
  { label: 'Explore', href: '/#how-it-works' },
  { label: 'Compare', href: '/#features' },
  { label: 'Pricing', href: '/#cta' },
  { label: 'Docs', href: '/docs' },
  { label: 'FAQ', href: '/faq' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass border-b border-foreground/5' : 'border-b border-transparent'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-3 sm:gap-5">
          <a href="#" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-500">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              Stack<span className="gradient-text">Pilot</span>
            </span>
          </a>
          <div className="hidden md:block">
            <ThemeSwitcher />
          </div>
        </div>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" className="text-sm text-muted-foreground hover:text-foreground">
            Login
          </Button>
          <Button className="bg-gradient-to-r from-violet-500 to-blue-500 text-sm text-white hover:from-violet-600 hover:to-blue-600">
            Get Started
          </Button>
        </div>

        <button
          className="text-foreground md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="glass border-t border-foreground/5 md:hidden">
          <div className="flex flex-col gap-4 px-6 py-6">
            <div className="self-start">
              <ThemeSwitcher />
            </div>
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-2">
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
