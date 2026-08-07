'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Layers,
  Plus,
  LayoutGrid,
  Boxes,
  Bookmark,
  History,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
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

const SIDEBAR_WIDTH_EXPANDED = 260;
const SIDEBAR_WIDTH_COLLAPSED = 72;
const SIDEBAR_KEY = 'stack2set:sidebar-collapsed';

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

/**
 * One shared navigation list used by both the desktop sidebar and the mobile
 * drawer. `collapsed` hides labels (desktop collapsed mode); `onNavigate`
 * fires on every link click so the drawer can close itself.
 */
function WorkspaceNavItems({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const { pathname, hash } = useRouteState();

  return (
    <div className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const active = isItemActive(item, pathname, hash);
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={itemHref(item)}
            title={item.label}
            aria-current={active ? 'page' : undefined}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg py-2 text-sm transition-colors ${
              collapsed ? 'justify-center px-0' : 'px-3'
            } ${
              active
                ? 'bg-gradient-to-r from-violet-500/15 to-blue-500/15 font-medium text-foreground ring-1 ring-violet-500/20'
                : 'text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground'
            }`}
          >
            <Icon
              className={`h-4 w-4 shrink-0 ${active ? 'text-violet-300' : 'text-muted-foreground'}`}
            />
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        );
      })}
    </div>
  );
}

function BrandMark({ showLabel }: { showLabel: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 shadow-lg shadow-violet-500/20">
        <Sparkles className="h-4 w-4 text-white" />
      </div>
      <AnimatePresence initial={false}>
        {showLabel && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="whitespace-nowrap text-sm font-semibold text-foreground"
          >
            Stack2Set
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(SIDEBAR_KEY) === 'collapsed');
    } catch {
      // ignore storage errors
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_KEY, next ? 'collapsed' : 'expanded');
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  // Esc closes the drawer + body scroll lock while open.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [drawerOpen]);

  return (
    <div className="min-h-screen">
      {/* Mobile / tablet top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-foreground/5 bg-background/80 px-4 py-3 backdrop-blur-md lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
          aria-expanded={drawerOpen}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-foreground/10 text-foreground transition-colors hover:bg-foreground/[0.04]"
        >
          <Menu className="h-5 w-5" />
        </button>
        <BrandMark showLabel />
        <div className="w-9" aria-hidden="true" />
      </div>

      <div className="mx-auto flex max-w-[1440px]">
        {/* Desktop collapsible sidebar */}
        <aside className="sticky top-0 hidden h-screen shrink-0 lg:block">
          <motion.nav
            animate={{ width: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="flex h-full flex-col overflow-hidden border-r border-foreground/5 bg-background"
          >
            <div
              className={`flex h-16 items-center ${
                collapsed ? 'justify-center px-3' : 'justify-between px-4'
              }`}
            >
              <BrandMark showLabel={!collapsed} />
              <button
                type="button"
                onClick={toggleCollapsed}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-foreground/10 text-muted-foreground transition-colors hover:border-violet-500/20 hover:text-foreground ${
                  collapsed ? 'absolute' : ''
                }`}
              >
                {collapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-3 pb-6 pt-2">
              <div>
                <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                  {collapsed ? '' : 'Workspace'}
                </p>
                <WorkspaceNavItems collapsed={collapsed} />
              </div>
            </div>
          </motion.nav>
        </aside>

        {/* Main content — resizes automatically with the sidebar width */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>

      {/* Mobile / tablet slide-out drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              key="drawer-overlay"
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeDrawer}
            />
            <motion.aside
              key="drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Workspace navigation"
              className="fixed left-0 top-0 z-50 flex h-full w-[280px] flex-col border-r border-foreground/5 bg-background shadow-2xl lg:hidden"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.28, ease: 'easeInOut' }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0.5, right: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.x < -70 || info.velocity.x < -500) closeDrawer();
              }}
            >
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-foreground/5 px-4">
                <BrandMark showLabel />
                <button
                  type="button"
                  onClick={closeDrawer}
                  aria-label="Close navigation"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-foreground/10 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto px-3 pb-8 pt-3">
                <div>
                  <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                    Workspace
                  </p>
                  <WorkspaceNavItems onNavigate={closeDrawer} />
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
