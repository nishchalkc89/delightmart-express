import { asset } from '@/lib/assets';

type Variant = 'default' | 'mobile' | 'admin' | 'footer';

const sources: Record<Variant, string> = {
  default: 'logo',
  mobile: 'logo-mobile',
  admin: 'logo-admin',
  footer: 'logo-footer',
};

export function Logo({ className = 'h-14 w-auto', variant = 'default' }: { className?: string; variant?: Variant }) {
  return <img src={asset(sources[variant])} alt="Delight Shopping Mart Pvt. Ltd." className={className} />;
}
