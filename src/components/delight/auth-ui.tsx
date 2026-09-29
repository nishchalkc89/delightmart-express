import { useRouter } from '@tanstack/react-router';
import { ChevronDown, ChevronLeft, Eye, EyeOff, type LucideIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Logo } from './logo';
import { StorePage } from './store-shell';

/** Full-screen phone layout on mobile; centred card under the store header on desktop. */
export function AuthShell({ children, back = true }: { children: ReactNode; back?: boolean }) {
  const router = useRouter();
  return (
    <StorePage mobile={false} hideMobileNav>
      <div className="min-h-screen bg-white lg:min-h-0 lg:bg-page lg:py-12">
        <div className="relative mx-auto w-full max-w-[440px] px-6 pb-10 pt-4 lg:rounded-3xl lg:border lg:border-line lg:bg-white lg:px-9 lg:pt-8 lg:shadow-[0_10px_40px_rgb(16_24_40/0.06)]">
          {back && (
            <button aria-label="Go back" onClick={() => router.history.back()} className="absolute left-4 top-5 p-1 lg:left-6 lg:top-8">
              <ChevronLeft className="size-7 text-ink" strokeWidth={1.8} />
            </button>
          )}
          {children}
        </div>
      </div>
    </StorePage>
  );
}

export function AuthLogo({ className = 'mt-6 h-[62px]' }: { className?: string }) {
  return <Logo variant="mobile" className={`mx-auto w-auto ${className}`} />;
}

export function NepalFlag() {
  return (
    <svg viewBox="0 0 20 24" className="h-6 w-5" aria-hidden>
      <path d="M1 1 L17 11 H7 L17 23 H1 Z" fill="#dc143c" stroke="#003893" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="6" cy="16.5" r="2" fill="#fff" />
      <path d="M4 7.5 a2.2 2.2 0 0 0 4 0 a2 1.4 0 0 1 -4 0z" fill="#fff" />
    </svg>
  );
}

export function PhoneField({ value, onChange, name = 'phone', label }: { value: string; onChange: (v: string) => void; name?: string; label?: string }) {
  return (
    <label className="flex h-[60px] items-center gap-3 rounded-xl border border-line bg-white px-4 focus-within:border-brand">
      <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-ink" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" /></svg>
      <span className="flex items-center gap-0.5"><NepalFlag /><ChevronDown className="size-3 text-ink" /></span>
      <span className="text-[16px] text-ink">+977</span>
      <span className="min-w-0 flex-1">
        {label && <span className="block text-[12px] text-slate">{label}</span>}
        <input name={name} inputMode="numeric" autoComplete="tel-national" value={value} onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ''))} maxLength={10} placeholder="98XXXXXXXX" className="w-full bg-transparent text-[16px] text-ink outline-none placeholder:text-slate" aria-label="Mobile number" />
      </span>
    </label>
  );
}

/** Bordered input with a leading icon and optional small floating label, as in the approved sign-up screen. */
export function IconField({ icon: Icon, label, type = 'text', name, value, onChange, placeholder, autoComplete, required = true }: { icon: LucideIcon; label?: string; type?: string; name: string; value: string; onChange: (v: string) => void; placeholder?: string; autoComplete?: string; required?: boolean }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <label className="flex h-[60px] items-center gap-3 rounded-xl border border-line bg-white px-4 focus-within:border-brand">
      <Icon className="size-5 shrink-0 text-ink" strokeWidth={1.7} />
      <span className="min-w-0 flex-1">
        {label && <span className="block text-[12px] text-slate">{label}</span>}
        <input required={required} name={name} type={isPassword && !show ? 'password' : isPassword ? 'text' : type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete} className="w-full bg-transparent text-[16px] text-ink outline-none placeholder:text-slate" aria-label={label ?? placeholder} />
      </span>
      {isPassword && (
        <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} className="text-ink">
          {show ? <Eye className="size-5" strokeWidth={1.7} /> : <EyeOff className="size-5" strokeWidth={1.7} />}
        </button>
      )}
    </label>
  );
}

export function Divider({ text }: { text: string }) {
  return (
    <div className="my-5 flex items-center gap-3 text-[14px] text-slate">
      <span className="h-px flex-1 bg-line" />{text}<span className="h-px flex-1 bg-line" />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-6" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A12 12 0 0 1 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="currentColor" aria-hidden>
      <path d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.8-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8s2 .8 3.4.8c1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.6-1-2.6-4.1zM13.9 5c.7-.9 1.2-2 1-3.2-1 0-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.5z" />
    </svg>
  );
}

export function SocialButtons({ onGoogle, onApple, disabled }: { onGoogle: () => void; onApple: () => void; disabled?: boolean }) {
  return (
    <div className="space-y-3">
      <button type="button" disabled={disabled} onClick={onGoogle} className="flex h-[54px] w-full items-center justify-center gap-4 rounded-xl border border-line bg-white text-[16px] font-medium text-navy hover:bg-page"><GoogleIcon /> Continue with Google</button>
      <button type="button" disabled={disabled} onClick={onApple} className="flex h-[54px] w-full items-center justify-center gap-4 rounded-xl border border-line bg-white text-[16px] font-medium text-navy hover:bg-page"><AppleIcon /> Continue with Apple</button>
    </div>
  );
}

export function GreenButton({ children, disabled, type = 'submit', onClick }: { children: ReactNode; disabled?: boolean; type?: 'submit' | 'button'; onClick?: () => void }) {
  return (
    <button type={type} disabled={disabled} onClick={onClick} className="flex h-[56px] w-full items-center justify-center rounded-xl bg-brand text-[19px] font-semibold text-white shadow-md shadow-brand/20 hover:bg-brand-dark disabled:opacity-60">
      {children}
    </button>
  );
}
