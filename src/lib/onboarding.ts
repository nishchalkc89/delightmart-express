export const ONBOARDED_KEY = 'delight-onboarded';

export function markOnboarded() {
  try { localStorage.setItem(ONBOARDED_KEY, '1'); } catch { /* storage unavailable */ }
}

/** Onboarding is shown once, only when the installed PWA is launched for the first time. */
export function shouldOnboard() {
  try {
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    return standalone && !localStorage.getItem(ONBOARDED_KEY);
  } catch {
    return false;
  }
}
