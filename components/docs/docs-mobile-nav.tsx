'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { docGroups } from '@/lib/docs';

export function DocsMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="sticky top-16 z-40 border-b border-foreground/5 bg-background/80 backdrop-blur-md lg:hidden">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <span className="text-sm font-medium text-foreground">Documentation</span>
        <button
          onClick={() => setOpen(!open)}
          aria-label="Toggle documentation menu"
          aria-expanded={open}
          className="flex h-9 w-9 items-center justify-center rounded-lg glass text-foreground"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <nav aria-label="Documentation" className="space-y-6 border-t border-foreground/5 px-4 py-4 sm:px-6">
          {docGroups.map((group) => (
            <div key={group.title}>
              <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.title}
              </h3>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const href = `/docs/${item.slug}`;
                  const active = pathname === href;
                  return (
                    <li key={item.slug}>
                      <Link
                        href={href}
                        onClick={() => setOpen(false)}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'block rounded-lg px-3 py-2 text-sm transition-colors',
                          active
                            ? 'bg-foreground/5 font-medium text-foreground'
                            : 'text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {item.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      )}
    </div>
  );
}
