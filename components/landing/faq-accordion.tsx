'use client';

import { useMemo, useState } from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { Plus, Minus, MessageCircleQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';
import { faqCategories, type FaqItem } from '@/lib/faq';

export function FaqAccordion({
  items,
  showFilters = true,
  defaultOpenIndex = 0,
}: {
  items: FaqItem[];
  showFilters?: boolean;
  defaultOpenIndex?: number;
}) {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [openItem, setOpenItem] = useState<string>(
    items[defaultOpenIndex]?.question ?? '',
  );

  const filtered = useMemo(
    () =>
      items.filter(
        (item) => activeCategory === 'All' || item.category === activeCategory,
      ),
    [items, activeCategory],
  );

  const categories = useMemo(
    () => ['All', ...faqCategories.filter((c) => items.some((i) => i.category === c))],
    [items],
  );

  return (
    <div className="w-full">
      {showFilters && (
        <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                'rounded-full px-4 py-1.5 text-xs font-medium transition-all',
                activeCategory === category
                  ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20'
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
            No questions in this category yet.
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
                    ? 'border-teal-500/30 bg-foreground/[0.03] shadow-lg shadow-teal-500/5'
                    : 'border-foreground/5 bg-foreground/[0.02] hover:border-teal-500/25',
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
                          ? 'bg-teal-500 text-white'
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
