'use client';

import { useRef, useState, useEffect } from 'react';
import { Monitor, Sun, Moon, type LucideIcon } from 'lucide-react';
import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/lib/utils';

type ThemeValue = 'system' | 'light' | 'dark';

const themeOptions: { value: ThemeValue; label: string; icon: LucideIcon }[] = [
  { value: 'system', label: 'System theme', icon: Monitor },
  { value: 'light', label: 'Light theme', icon: Sun },
  { value: 'dark', label: 'Dark theme', icon: Moon },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => setMounted(true), []);

  const activeIndex = Math.max(
    0,
    themeOptions.findIndex((option) => option.value === theme),
  );

  const handleSelect = (value: ThemeValue) => setTheme(value);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex =
      (activeIndex + direction + themeOptions.length) % themeOptions.length;
    setTheme(themeOptions[nextIndex].value);
    buttonRefs.current[nextIndex]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label="Color theme"
      onKeyDown={handleKeyDown}
      className="relative grid grid-cols-3 items-center rounded-full border border-foreground/10 bg-foreground/[0.04] p-1 shadow-sm backdrop-blur-md"
    >
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 z-0 w-[calc((100%_-_0.5rem)/3)] rounded-full bg-white/80 shadow-md ring-1 ring-black/5 transition-transform duration-300 ease-out dark:bg-white/15 dark:shadow-black/20 dark:ring-white/10"
        style={{ transform: `translateX(${mounted ? activeIndex : 0}00%)` }}
      />
      {themeOptions.map((option, index) => {
        const selected = mounted && activeIndex === index;
        return (
          <button
            key={option.value}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.label}
            title={option.label}
            onClick={() => handleSelect(option.value)}
            className={cn(
              'relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
              selected
                ? 'text-teal-600 dark:text-white'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <option.icon
              className={cn(
                'h-4 w-4 transition-transform duration-300',
                selected && 'scale-110',
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
