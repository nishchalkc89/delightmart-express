import { useEffect, useState } from 'react';

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

// Chrome offers "install" only once per page load, so the event is kept here for the App Settings page.
let deferred: InstallEvent | null = null;
const listeners = new Set<() => void>();

export function PwaRegister() {
  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); deferred = e as InstallEvent; listeners.forEach((l) => l()); };
    const onInstalled = () => { deferred = null; listeners.forEach((l) => l()); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    if ('serviceWorker' in navigator) {
      if (import.meta.env.DEV) {
        // A cached service worker would serve stale pages while developing.
        void navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => void r.unregister()));
      } else {
        navigator.serviceWorker.register('/sw.js').catch(() => undefined);
      }
    }
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled); };
  }, []);
  return null;
}

/** Whether the app can be installed on this device, whether it already runs installed, and a function to install it. */
export function useInstallApp() {
  const [, redraw] = useState(0);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const l = () => redraw((n) => n + 1);
    listeners.add(l);
    setInstalled(window.matchMedia('(display-mode: standalone)').matches);
    return () => { listeners.delete(l); };
  }, []);
  return {
    installed,
    canInstall: Boolean(deferred),
    install: async () => {
      if (!deferred) return false;
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      deferred = null;
      redraw((n) => n + 1);
      return outcome === 'accepted';
    },
  };
}
