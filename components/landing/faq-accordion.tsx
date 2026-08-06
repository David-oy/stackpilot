'use client';

import { useMemo, useState } from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { Search, Plus, Minus, MessageCircleQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';
import { faqCategories, type FaqItem } from '@/lib/faq';

export function FaqAccordion({
  items,
  showSearch = true,
  showFilters = true,
  defaultOpenIndex = 0,
}: {
  items: FaqItem[];
  showSearch?: boolean;
  showFilters?: boolean;
  defaultOpenIndex?: number;
}) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [openItem, setOpenItem] = useState<string>(
    items[defaultOpenIndex]?.question ?? '',
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      const matchesQuery =
        q.length === 0 ||
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [items, query, activeCategory]);

  const categories = useMemo(
    () => ['All', ...faqCategories.filter((c) => items.some((i) => i.category === c))],
    [items],
  );

  return (
    <div className="w-full">
      {showSearch && (
        <div className="mx-auto mb-6 max-w-md">
          <div className="group relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search questions..."
              aria-label="Search questions"
              className="w-full rounded-xl glass py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
          </div>
        </div>
      )}

      {showFilters && (
        <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                'rounded-full px-4 py-1.5 text-xs font-medium transition-all',
                activeCategory === category
                  ? 'bg-gradient-to-r from-violet-500 to-blue-500 text-white shadow-md shadow-violet-500/20'
                  : 'glass glass-hover text-muted-foreground hover:text-foreground',
              )}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="glass mx-auto max-w-md rounded-2xl p-10 text-center">
          <MessageCircleQuestion className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">
            No questions match your search. Try a different keyword.
          </p>
        </div>
      ) : (
        <AccordionPrimitive.Root
          type="single"
          collapsible
          value={openItem}
          onValueChange={(value) => setOpenItem(value)}
          className="mx-auto max-w-3xl space-y-3"
        >
          {filtered.map((item) => {
            const isOpen = openItem === item.question;
            return (
              <AccordionPrimitive.Item
                key={item.question}
                value={item.question}
                className={cn(
                  'overflow-hidden rounded-2xl border transition-all duration-300',
                  isOpen
                    ? 'border-violet-500/30 bg-foreground/[0.03] shadow-lg shadow-violet-500/5'
                    : 'border-foreground/5 bg-foreground/[0.02] hover:border-violet-500/20',
                )}
              >
                <AccordionPrimitive.Header>
                  <AccordionPrimitive.Trigger
                    aria-label={item.question}
                    className="group flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
                  >
                    <span className="text-sm font-medium text-foreground sm:text-base">
                      {item.question}
                    </span>
                    <span
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300',
                        isOpen
                          ? 'bg-gradient-to-r from-violet-500 to-blue-500 text-white'
                          : 'bg-foreground/5 text-muted-foreground group-hover:bg-foreground/10',
                      )}
                    >
                      {isOpen ? (
                        <Minus className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
                      )}
                    </span>
                  </AccordionPrimitive.Trigger>
                </AccordionPrimitive.Header>
                <AccordionPrimitive.Content className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                  <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground sm:px-6">
                    {item.answer}
                  </p>
                </AccordionPrimitive.Content>
              </AccordionPrimitive.Item>
            );
          })}
        </AccordionPrimitive.Root>
      )}
    </div>
  );
}
