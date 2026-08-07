'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, Sparkles, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/landing/theme-switcher';
import { useAuth } from '@/lib/auth/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type NavLink = {
  label: string;
  href: string;
  /** Pattern used to determine the active state. A trailing "/*" matches the base path and all nested routes. */
  pattern: string;
};

const navLinks: NavLink[] = [
  { label: 'Home', href: '/', pattern: '/' },
  { label: 'Explore', href: '/explore', pattern: '/explore' },
  { label: 'Browse', href: '/browse/providers', pattern: '/browse/providers' },
  { label: 'Pricing', href: '/pricing', pattern: '/pricing' },
];

function matchesPath(pathname: string, pattern: string): boolean {
  if (pattern.endsWith('/*')) {
    const base = pattern.slice(0, -1);
    return pathname === base || pathname.startsWith(base + '/');
  }
  return pathname === pattern;
}

export function Navbar() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeLabel = navLinks.find((link) => matchesPath(pathname, link.pattern))?.label ?? null;

  const displayName =
    user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? 'Account';

  const avatar = (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-xs font-bold text-white">
      {displayName.charAt(0).toUpperCase()}
    </span>
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (link: NavLink): boolean => activeLabel === link.label;

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
              Stack<span className="gradient-text">2set</span>
            </span>
          </Link>
          <div className="hidden md:block">
            <ThemeSwitcher />
          </div>
        </div>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
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
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {!loading && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Account menu"
                className="flex items-center gap-2 rounded-full border border-foreground/5 p-1 pr-2 transition-colors hover:border-violet-500/20"
              >
                {avatar}
                <span className="max-w-[120px] truncate text-sm text-foreground">
                  {displayName}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account" className="gap-2">
                    <UserRound className="h-4 w-4" /> Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/workspace" className="gap-2">
                    <Sparkles className="h-4 w-4" /> Workspace
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost" className="text-sm text-muted-foreground hover:text-foreground">
                <Link href="/login">Login</Link>
              </Button>
              <Button
                asChild
                className="bg-gradient-to-r from-violet-500 to-blue-500 text-sm text-white shadow-lg shadow-violet-500/20 transition-all hover:from-violet-600 hover:to-blue-600 hover:shadow-violet-500/30"
              >
                <Link href="/signup">Get Started</Link>
              </Button>
            </>
          )}
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
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                aria-current={isActive(link) ? 'page' : undefined}
                className={cn(
                  'rounded-lg px-3 py-2.5 text-sm transition-colors',
                  isActive(link)
                    ? 'bg-foreground/5 font-medium text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-3 border-t border-foreground/5 pt-3">
              {!loading && user ? (
                <>
                  <div className="flex items-center gap-2 px-1">
                    {avatar}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Button asChild variant="outline" className="border-foreground/10 text-foreground">
                    <Link href="/account">
                      <UserRound className="h-4 w-4" /> Account
                    </Link>
                  </Button>
                  <Button asChild className="bg-gradient-to-r from-violet-500 to-blue-500 text-white">
                    <Link href="/workspace">
                      <Sparkles className="h-4 w-4" /> Workspace
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="outline" className="border-foreground/10 text-foreground">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild className="bg-gradient-to-r from-violet-500 to-blue-500 text-white">
                    <Link href="/signup">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
