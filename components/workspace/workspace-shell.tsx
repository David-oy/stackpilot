'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bookmark,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Github,
  History,
  Layers,
  LayoutGrid,
  Mail,
  Menu,
  Plus,
  Sparkles,
  Twitter,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { WorkspaceSwitcher } from './workspace-switcher';
import { siteConfig } from '@/lib/site';

const DESKTOP_QUERY = '(min-width: 1024px)';

const SOCIAL_LINKS = [
  { icon: Github, href: siteConfig.github, label: 'GitHub' },
  { icon: Twitter, href: 'https://x.com/vijayyyyy_7', label: 'Twitter' },
  { icon: Mail, href: 'mailto:vijay.peddenti434@gmail.com', label: 'Email' },
];

function subscribeToDesktop(callback: () => void) {
  const mql = window.matchMedia(DESKTOP_QUERY);
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getDesktopSnapshot() {
  return window.matchMedia(DESKTOP_QUERY).matches;
}

/** Mobile-first default so SSR and first client paint never mix controls. */
function getDesktopServerSnapshot() {
  return false;
}

function useIsDesktop() {
  return useSyncExternalStore(subscribeToDesktop, getDesktopSnapshot, getDesktopServerSnapshot);
}

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
  {
    href: '/workspace/saved-stacks',
    label: 'Saved Stacks',
    icon: Bookmark,
    routes: ['/workspace/saved-stacks'],
  },
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
 *  - Current Stack: exactly `/workspace`.
 *  - Saved Stacks: `/workspace/saved-stacks` and its sub-routes.
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
  const [search, setSearch] = useState('');

  useEffect(() => {
    const sync = () => {
      setHash(window.location.hash);
      setSearch(window.location.search);
    };
    sync();
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('popstate', sync);
    };
  }, [pathname]);

  return { pathname, hash, search };
}

/**
 * True while browsing the provider list through a category: pathname is
 * `/browse/providers` and a `category` search param is present. In that mode
 * the sidebar highlights "Browse Categories" instead of "Browse Providers".
 */
function isCategoryBrowseActive(pathname: string, search: string): boolean {
  if (pathname !== '/browse/providers') return false;
  const category = new URLSearchParams(search).get('category');
  return Boolean(category) && category !== '' && category !== 'all';
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
  const { pathname, hash, search } = useRouteState();

  return (
    <div className="space-y-1">
      {NAV_ITEMS.map((item) => {
        let active = isItemActive(item, pathname, hash);
        const categoryBrowseActive = isCategoryBrowseActive(pathname, search);
        if (categoryBrowseActive) {
          if (item.href === '/browse/categories') active = true;
          if (item.href === '/browse/providers') active = false;
        }
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
                ? 'bg-gradient-to-r from-teal-500/15 to-cyan-500/15 font-medium text-foreground ring-1 ring-teal-500/20'
                : 'text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground'
            }`}
          >
            <Icon
              className={`h-4 w-4 shrink-0 ${active ? 'text-teal-300' : 'text-muted-foreground'}`}
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
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-500 shadow-lg shadow-teal-500/20">
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

/**
 * Bottom of the sidebar: social links (GitHub / X) with the app version
 * underneath.
 */
function SidebarFooter({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className={`shrink-0 border-t border-foreground/5 px-3 pb-4 pt-3`}>
      <div
        className={`flex gap-2 ${collapsed ? 'flex-col items-center' : 'items-center justify-center'}`}
      >
        {SOCIAL_LINKS.map((social) => (
          <a
            key={social.label}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.label}
            title={social.label}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-foreground/10 text-muted-foreground transition-colors hover:border-teal-500/25 hover:text-foreground"
          >
            <social.icon className="h-4 w-4" />
          </a>
        ))}
      </div>
      <p
        className={`text-center text-[10px] font-medium tracking-wide text-muted-foreground/50 ${
          collapsed ? 'mt-2' : 'mt-2.5'
        }`}
      >
        v{siteConfig.version}
      </p>
    </div>
  );
}

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const isDesktop = useIsDesktop();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(SIDEBAR_KEY) === 'collapsed');
    } catch {
      // ignore storage errors
    }
  }, []);

  // Desktop and tablet/mobile never mix: crossing into desktop closes the
  // drawer (its state is meaningless there) and vice-versa.
  useEffect(() => {
    if (isDesktop) setDrawerOpen(false);
  }, [isDesktop]);

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
    if (!drawerOpen || isDesktop) return;
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
  }, [drawerOpen, isDesktop]);

  return (
    <div className="min-h-screen">
      {/* Tablet / mobile: header shows ONLY the hamburger control. */}
      {!isDesktop && (
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-foreground/5 bg-background/80 px-4 py-3 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            aria-expanded={drawerOpen}
            aria-haspopup="dialog"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-foreground/10 text-foreground transition-colors hover:bg-foreground/[0.04]"
          >
            <Menu className="h-5 w-5" />
          </button>
          <BrandMark showLabel />
          <div className="w-9" aria-hidden="true" />
        </div>
      )}

      <div className="mx-auto flex max-w-[1440px]">
        {/* Desktop (>=1024px): permanent sidebar with ONLY the collapse/expand
            control. Never mounts on tablet/mobile, so it can never coexist
            with the hamburger. */}
        {isDesktop && (
          <aside className="sticky top-0 h-screen shrink-0">
            <motion.nav
              animate={{ width: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED }}
              transition={{ duration: 0.28, ease: 'easeInOut' }}
              className="flex h-full flex-col overflow-hidden border-r border-foreground/5 bg-background"
            >
              <div
                className={
                  collapsed
                    ? 'flex h-16 shrink-0 flex-col items-center justify-center gap-1.5 px-3'
                    : 'flex h-16 shrink-0 items-center justify-between px-4'
                }
              >
                <BrandMark showLabel={!collapsed} />
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  className={`flex shrink-0 items-center justify-center rounded-lg border border-foreground/10 text-muted-foreground transition-colors hover:border-teal-500/25 hover:text-foreground ${
                    collapsed ? 'h-6 w-6' : 'h-8 w-8'
                  }`}
                >
                  {collapsed ? (
                    <ChevronRight className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto px-3 pb-6 pt-2">
                <WorkspaceSwitcher collapsed={collapsed} />
                <div>
                  <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                    {collapsed ? '' : 'Workspace'}
                  </p>
                  <WorkspaceNavItems collapsed={collapsed} />
                </div>
              </div>
              <SidebarFooter collapsed={collapsed} />
            </motion.nav>
          </aside>
        )}

        {/* Main content — resizes automatically with the sidebar width */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>

      {/* Tablet / mobile: slide-out drawer with ONLY the X close control.
          Never mounts on desktop. */}
      {!isDesktop && (
        <AnimatePresence>
          {drawerOpen && (
            <motion.div
              key="drawer-overlay"
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeDrawer}
            />
          )}
          {drawerOpen && (
            <motion.aside
              key="drawer"
              id="workspace-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Workspace navigation"
              className="fixed left-0 top-0 z-50 flex h-full w-[280px] flex-col border-r border-foreground/5 bg-background shadow-2xl"
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
              <div className="flex-1 space-y-5 overflow-y-auto px-3 pb-8 pt-3">
                <WorkspaceSwitcher />
                <div>
                  <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                    Workspace
                  </p>
                  <WorkspaceNavItems onNavigate={closeDrawer} />
                </div>
              </div>
              <SidebarFooter />
            </motion.aside>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
