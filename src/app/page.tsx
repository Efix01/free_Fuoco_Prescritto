'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      // Check current session
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // User is logged in, go to Home (Segnalazione)
        router.replace('/report');
      } else {
        // User is not logged in
        // Check if we are handling an auth callback (e.g. from email link)
        // Since supabase client handles URL parsing automatically, we might just need to wait a tick or check event
        // But if getSession was null, likely we are anon.
        // However, if there's a hash or code, Supabase might need time to swap it.
        // Let's set up a listener to be sure.

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' || session) {
            router.replace('/report');
          } else if (event === 'SIGNED_OUT') {
            router.replace('/landing');
          }
        });

        // If after a short delay no session is found, and no hash in URL, go to landing
        // But for visual cleanliness, showing the splash longer is fine.
        // If we are strictly anon (no hash, no session), verify immediately.

        if (!window.location.hash && !window.location.search && !session) {
          router.replace('/landing');
        }

        // Safety timeout: if after 4 seconds we are still here (e.g. hash parsing failed), go to landing
        const timeout = setTimeout(() => {
          router.replace('/landing');
        }, 4000);

        return () => {
          subscription.unsubscribe();
          clearTimeout(timeout);
        };
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-800 text-white flex-col gap-4">
      <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      <p className="font-bold text-lg animate-pulse">Caricamento CFVA...</p>
    </div>
  );
}
