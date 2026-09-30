import { Logo } from './logo';

/** Full-screen loading state: the Delight logo gently shrinks and grows back while a page loads. */
export function LogoLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="grid min-h-[70vh] w-full place-items-center bg-white/80 px-6">
      <div className="flex flex-col items-center">
        <div className="logo-breathe">
          <Logo className="h-20 w-auto lg:h-24" />
        </div>
        <span className="loader-bar mt-6 block h-1 w-40 overflow-hidden rounded-full bg-[#e3f5ec]"><span className="block h-full w-1/3 rounded-full bg-brand" /></span>
        <span className="mt-3 text-[14px] font-medium text-slate">{label}</span>
      </div>
    </div>
  );
}
