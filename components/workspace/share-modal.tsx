'use client';

import { useState } from 'react';
import { Check, Copy, ExternalLink, Mail, MessageCircle, Linkedin, Facebook, X } from 'lucide-react';
import { toast } from 'sonner';
import { copyToClipboard } from '@/lib/stacks/export';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function encodeShareText(title: string, url: string): string {
  return encodeURIComponent(`${title} — built with StackPilot`);
}

export function ShareModal({
  open,
  onOpenChange,
  url,
  title,
  prompt,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

  const encodedUrl = encodeURIComponent(url);
  const text = encodeShareText(title, url);
  const summary = encodeURIComponent(prompt?.slice(0, 120) ?? '');

  const shareButtons = [
    {
      name: 'X',
      icon: X,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${text}`,
      className: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700',
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      className: 'bg-blue-600 text-white hover:bg-blue-700',
    },
    {
      name: 'Facebook',
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      className: 'bg-blue-700 text-white hover:bg-blue-800',
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      href: `https://wa.me/?text=${text}%20${encodedUrl}`,
      className: 'bg-emerald-600 text-white hover:bg-emerald-700',
    },
    {
      name: 'Email',
      icon: Mail,
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${summary}%0A%0A${encodedUrl}`,
      className: 'bg-foreground text-background hover:opacity-90',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Share your stack</DialogTitle>
          <DialogDescription>
            Anyone with this link can view your stack — no account needed.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Input readOnly value={url} className="flex-1 text-xs" />
          <Button
            onClick={handleCopy}
            size="sm"
            className="h-9 shrink-0 gap-1.5 bg-gradient-to-r from-violet-500 to-blue-500 text-xs text-white hover:from-violet-600 hover:to-blue-600"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {shareButtons.map((button) => (
            <a
              key={button.name}
              href={button.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-[10px] font-medium transition-all hover:-translate-y-0.5 ${button.className}`}
            >
              <button.icon className="h-4 w-4" />
              {button.name}
            </a>
          ))}
        </div>

        <div className="flex items-center justify-between rounded-xl border border-foreground/5 bg-foreground/[0.02] px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{title}</p>
            <p className="truncate text-xs text-muted-foreground">{prompt}</p>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-3 inline-flex shrink-0 items-center gap-1 rounded-lg border border-foreground/5 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-violet-500/20 hover:text-foreground"
          >
            <ExternalLink className="h-3 w-3" /> Open
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
