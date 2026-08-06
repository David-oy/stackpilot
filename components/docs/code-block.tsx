'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

const KEYWORDS =
  /\b(const|let|var|function|return|if|else|for|while|async|await|import|export|from|default|new|class|extends|type|interface|enum|throw|try|catch|switch|case|break|continue|typeof|of|in|do|get|set|null|undefined|true|false|this|yield|static)\b/;

const TOKEN_REGEX =
  /(\/\*[\s\S]*?\*\/|\/\/.*$|#.*$|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\\n]|\\.)*`|\b\d+(?:\.\d+)?\b)/g;

function tokenizeLine(line: string, index: number): ReactNode {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  TOKEN_REGEX.lastIndex = 0;
  while ((match = TOKEN_REGEX.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(renderPlain(line.slice(lastIndex, match.index)));
    }
    const token = match[0];
    const cls = tokenClass(token);
    parts.push(
      <span key={`${index}-${match.index}`} className={cls}>
        {token}
      </span>,
    );
    lastIndex = match.index + token.length;
    if (token.length === 0) break;
  }

  if (lastIndex < line.length) {
    parts.push(renderPlain(line.slice(lastIndex)));
  }
  return parts;
}

function renderPlain(text: string): ReactNode {
  const keywordMatches = text.match(new RegExp(KEYWORDS.source, 'g'));
  if (!keywordMatches) return text;

  const parts: ReactNode[] = [];
  let lastIndex = 0;
  const global = new RegExp(KEYWORDS.source, 'g');
  let match: RegExpExecArray | null;
  while ((match = global.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push(
      <span key={`kw-${match.index}`} className="tk-keyword">
        {match[0]}
      </span>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

function tokenClass(token: string): string {
  if (token.startsWith('//') || token.startsWith('/*') || token.startsWith('#')) {
    return 'tk-comment';
  }
  if (
    token.startsWith('"') ||
    token.startsWith("'") ||
    token.startsWith('`')
  ) {
    return 'tk-string';
  }
  if (/^\d/.test(token)) return 'tk-number';
  return '';
}

export function CodeBlock({
  code,
  language,
  className,
}: {
  code: string;
  language: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — ignore
    }
  };

  return (
    <div className={cn('group/code relative my-4 overflow-hidden rounded-2xl border border-foreground/10 bg-[#0b0b12]', className)}>
      <div className="flex items-center justify-between border-b border-foreground/10 px-4 py-2">
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {language}
        </span>
        <button
          onClick={handleCopy}
          aria-label="Copy code"
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-[#d6deeb]">
        <code>
          {code.split('\n').map((line, i) => (
            <span key={i}>
              {tokenizeLine(line, i)}
              {i < code.split('\n').length - 1 ? '\n' : null}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
