'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Layers,
  Plus,
  LayoutGrid,
  Boxes,
  Bookmark,
  History,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type NavItem = {
  href: string;
  hash?: string;
  label: string;
  icon: LucideIcon;
  /** Matches only exact routes that this item should highlight. */
  routes?: string[];
};

const NAV_ITEMS: NavItem[] = [
  { href: '/workspace', label: 'Current Stack', icon: Layers },
  { href: '/workspace/new-build', label: 'New Build', icon: Plus },
  { href: '/browse/categories', label: 'Browse Categories', icon: LayoutGrid },
  {
    href: '/browse/providers',
    label: 'Browse Providers',
    icon: Boxes,
    routes: ['/browse/providers'],
  },
  { href: '/workspace', hash: '#saved-stacks', label: 'Saved Stacks', icon: Bookmark },
  { href: '/workspace/history', label: 'History', icon: History },
];

function itemHref(item: NavItem): string {
  return item.hash ? `${item.href}${item.hash}` : item.href;
}

/**
 * Active state is derived purely from the router (pathname + hash) — never from
 * local UI state. Rules:
 *  - Current Stack: exactly `/workspace` without the saved-stacks hash.
 *  - Saved Stacks: exactly `/workspace` with hash `#saved-stacks`.
 *  - New Build / History / Browse Categories: exact path match.
 *  - Browse Providers: `/browse/providers` and its detail routes.
 */
function isItemActive(item: NavItem, pathname: string, hash: string): boolean {
  if (item.hash) {
    return pathname === item.href && hash === item.hash;
  }
  if (item.routes) {
    return item.routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  }
  return pathname === item.href;
}

function useRouteState() {
  const pathname = usePathname();
  const [hash, setHash] = useState('');

  useEffect(() => {
    const sync = () => setHash(window.location.hash);
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  return { pathname, hash };
}

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const { pathname, hash } = useRouteState();

  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-6 py-8">
      <aside className="hidden w-56 shrink-0 lg:block">
        <nav aria-label="Workspace" className="sticky top-24 space-y-1">
          <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Workspace
          </p>
          {NAV_ITEMS.map((item) => {
            const active = isItemActive(item, pathname, hash);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={itemHref(item)}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-gradient-to-r from-violet-500/15 to-blue-500/15 font-medium text-foreground ring-1 ring-violet-500/20'
                    : 'text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-violet-300' : 'text-muted-foreground'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function WorkspaceNavBar() {
  const { pathname, hash } = useRouteState();

  return (
    <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl glass p-1.5 lg:hidden">
      {NAV_ITEMS.map((item) => {
        const active = isItemActive(item, pathname, hash);
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={itemHref(item)}
            aria-current={active ? 'page' : undefined}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs transition-colors ${
              active
                ? 'bg-gradient-to-r from-violet-500/15 to-blue-500/15 font-medium text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
