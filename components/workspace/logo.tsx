import { cn } from '@/lib/utils';

const GRADIENTS = [
  'from-violet-500 to-purple-500',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-pink-500 to-rose-500',
  'from-sky-500 to-indigo-500',
  'from-fuchsia-500 to-pink-500',
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function providerGradient(name: string): string {
  return GRADIENTS[hashString(name) % GRADIENTS.length];
}

export function ProviderLogo({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br font-bold text-white shadow-lg',
        providerGradient(name),
        className,
      )}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
