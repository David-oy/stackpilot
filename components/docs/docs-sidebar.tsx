'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { docGroups } from '@/lib/docs';

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-16 hidden max-h-[calc(100vh-4rem)] w-64 shrink-0 flex-col overflow-y-auto border-r border-foreground/5 px-4 py-8 lg:flex">
      <nav aria-label="Documentation" className="space-y-8">
        {docGroups.map((group) => (
          <div key={group.title}>
            <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'block rounded-lg px-3 py-2 text-sm transition-colors',
                        active
                          ? 'bg-foreground/5 font-medium text-foreground'
                          : 'text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground',
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
    </aside>
  );
}
