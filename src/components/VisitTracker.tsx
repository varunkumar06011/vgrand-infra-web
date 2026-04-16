'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const trackVisit = async () => {
      // Small delay to ensure it's not a quick bounce or pre-render
      const timer = setTimeout(async () => {
        try {
          // Check session storage to avoid double counting in one session
          const sessionKey = `vgrand_visited_${pathname}`;
          if (sessionStorage.getItem(sessionKey)) return;

          await fetch('/api/visits/track', {
            method: 'POST',
            body: JSON.stringify({
              page_path: pathname,
              session_id: crypto.randomUUID()
            }),
            headers: { 'Content-Type': 'application/json' }
          });
          
          sessionStorage.setItem(sessionKey, 'true');
        } catch (e) {
          // Fail silently in production
        }
      }, 2000);

      return () => clearTimeout(timer);
    };

    trackVisit();
  }, [pathname]);

  return null;
}
