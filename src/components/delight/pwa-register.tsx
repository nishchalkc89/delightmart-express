import { useEffect } from 'react';

export function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    if (import.meta.env.DEV) {
      // A cached service worker would serve stale pages while developing.
      void navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => void r.unregister()));
      return;
    }
    navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  }, []);
  return null;
}
