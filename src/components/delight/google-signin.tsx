import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/services/supabase';

// "Sign in with Google" using Google's own button (Google Identity Services).
// Google then shows the shop's website (and, after Google brand verification, "Delight Shopping Mart"
// with its logo) instead of the database address. The Google sign-in is handed to Supabase with
// signInWithIdToken, protected by a one-time nonce.
//
// Needs VITE_GOOGLE_CLIENT_ID (the Google Cloud "Web application" OAuth Client ID; it is public).
// Without it, or if Google's script is blocked, the older redirect sign-in button is shown instead.

const CLIENT_ID = (import.meta.env['VITE_GOOGLE_CLIENT_ID'] as string | undefined)?.trim() || '';

type GoogleId = {
  accounts: { id: {
    initialize: (o: Record<string, unknown>) => void;
    renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
  } };
};
declare global { interface Window { google?: GoogleId } }

let scriptPromise: Promise<void> | null = null;
function loadScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => { scriptPromise = null; reject(new Error('Google sign-in could not load')); };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

async function makeNonce(): Promise<[raw: string, hashed: string]> {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const raw = btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, '');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  const hashed = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return [raw, hashed];
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.3 12 2.3 6.6 2.3 2.3 6.6 2.3 12s4.3 9.7 9.7 9.7c5.6 0 9.3-3.9 9.3-9.5 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}

/** Google sign-in for the login and sign-up pages. `onSignedIn` runs after a successful sign-in. */
export function GoogleSignIn({ onSignedIn, redirectTo, disabled = false }: { onSignedIn: () => void; redirectTo: string; disabled?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'google' | 'fallback'>(CLIENT_ID ? 'google' : 'fallback');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (mode !== 'google') return;
    let cancelled = false;
    void (async () => {
      try {
        await loadScript();
        const [raw, hashed] = await makeNonce();
        if (cancelled || !box.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          nonce: hashed,
          ux_mode: 'popup',
          context: 'signin',
          itp_support: true,
          callback: async (res: { credential?: string }) => {
            if (!res.credential) return;
            setBusy(true);
            const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: res.credential, nonce: raw });
            setBusy(false);
            if (error) toast.error(/provider is not enabled|not enabled/i.test(error.message) ? 'Google sign-in is not enabled yet. Please use email.' : error.message);
            else { toast.success('Signed in with Google'); onSignedIn(); }
          },
        });
        window.google.accounts.id.renderButton(box.current, {
          type: 'standard', theme: 'outline', size: 'large', text: 'continue_with', shape: 'rectangular', logo_alignment: 'center',
          width: Math.min(400, Math.max(240, box.current.offsetWidth)),
        });
      } catch {
        if (!cancelled) setMode('fallback');
      }
    })();
    return () => { cancelled = true; };
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  async function redirectSignIn() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
    if (error) { toast.error(error.message.includes('provider is not enabled') ? 'Google sign-in is not enabled yet. Please use email.' : error.message); setBusy(false); }
  }

  if (mode === 'fallback') {
    return (
      <button type="button" disabled={disabled || busy} onClick={() => void redirectSignIn()} className="flex h-[54px] w-full items-center justify-center gap-4 rounded-xl border border-line bg-white text-[16px] font-medium text-navy hover:bg-page disabled:opacity-60">
        <GoogleIcon /> Continue with Google
      </button>
    );
  }
  return (
    <div className={`flex min-h-[44px] w-full justify-center ${disabled || busy ? 'pointer-events-none opacity-60' : ''}`}>
      <div ref={box} className="w-full max-w-[400px]" aria-label="Continue with Google" />
    </div>
  );
}
