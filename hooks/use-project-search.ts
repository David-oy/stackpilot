'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { savePendingQuery } from '@/lib/auth/pending-query';

/**
 * Reusable search entry point shared by the home hero, the search page, and
 * the workspace.
 *
 * Authenticated users are sent to the dedicated search page. Guests get their
 * query persisted and are prompted to sign in via the auth modal; once signed
 * in the query is restored and the search runs automatically.
 */
export function useProjectSearch() {
  const router = useRouter();
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [attemptedQuery, setAttemptedQuery] = useState('');

  const handleSearch = useCallback(
    (raw: string) => {
      const query = raw.trim();
      if (!query) return;
      setAttemptedQuery(query);

      if (user) {
        router.push(`/search?q=${encodeURIComponent(query)}`);
      } else {
        savePendingQuery(query);
        setAuthOpen(true);
      }
    },
    [user, router],
  );

  return { handleSearch, authOpen, setAuthOpen, attemptedQuery };
}
