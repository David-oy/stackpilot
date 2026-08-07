'use client';

import { useState } from 'react';
import { Check, Copy, Facebook, Linkedin, MessageCircle, Printer, X } from 'lucide-react';
import { toast } from 'sonner';
import { copyToClipboard } from '@/lib/stacks/export';

export function ShareActions({
  url,
  title,
  prompt,
}: {
  url: string;
  title: string;
  prompt: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(url);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 1500);
  };

  const text = encodeURIComponent(`${title} — built with Stack2Set`);
  const encodedUrl = encodeURIComponent(url);

  const handlePrint = () => {
    window.print();
  };

  const shareButtons = [
    {
      name: 'X',
      icon: X,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${text}`,
      label: 'Share on X',
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      label: 'Share on LinkedIn',
    },
    {
      name: 'Facebook',
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      label: 'Share on Facebook',
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      href: `https://wa.me/?text=${text}%20${encodedUrl}`,
      label: 'Share on WhatsApp',
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={handleCopy}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-blue-500 px-4 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? 'Copied!' : 'Copy link'}
      </button>
      <button
        onClick={handlePrint}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-foreground/5 bg-foreground/[0.02] px-4 text-sm text-muted-foreground transition-all hover:border-violet-500/20 hover:text-foreground"
      >
        <Printer className="h-4 w-4" /> Print
      </button>
      {shareButtons.map((button) => (
        <a
          key={button.name}
          href={button.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={button.label}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-foreground/5 bg-foreground/[0.02] text-muted-foreground transition-all hover:border-violet-500/20 hover:text-foreground"
        >
          <button.icon className="h-4 w-4" />
        </a>
      ))}
      <span className="sr-only">{prompt}</span>
    </div>
  );
}
