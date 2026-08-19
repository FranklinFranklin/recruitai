'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RealtimeRefresher({ intervalMs = 3000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const intervalId = setInterval(() => {
      router.refresh(); // Soft refresh: triggers server components to re-run and patch the DOM without a full page reload
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [router, intervalMs]);

  return null; // Invisible component
}
