import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '@/services/supabase';

export type PaymentMethod = 'COD' | 'ESEWA' | 'KHALTI' | 'CARD';
export type DeliveryDetails = { recipientName: string; phone: string; addressLine: string; city: string; province: string; instructions: string; label?: string | undefined; addressId?: string | undefined };

const initial: DeliveryDetails = { recipientName: '', phone: '', addressLine: '', city: 'Tulsipur', province: 'Lumbini Province', instructions: '' };

type CouponResult = { ok: boolean; message: string };
type CheckoutValue = {
  details: DeliveryDetails;
  setDetails: (v: DeliveryDetails) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (v: PaymentMethod) => void;
  coupon: string;
  setCoupon: (v: string) => void;
  discount: number;
  /** Validates the code against active coupons. The order function re-checks it on the server. */
  applyCoupon: (subtotal: number) => Promise<CouponResult>;
  reset: () => void;
};

const CheckoutContext = createContext<CheckoutValue | undefined>(undefined);
const KEY = 'delight-checkout';

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [details, setDetails] = useState(initial);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) {
        const v = JSON.parse(saved) as { details?: DeliveryDetails; paymentMethod?: PaymentMethod };
        if (v.details) setDetails(v.details);
        if (v.paymentMethod) setPaymentMethod(v.paymentMethod);
      }
    } catch { /* storage unavailable */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify({ details, paymentMethod })); } catch { /* storage unavailable */ }
  }, [details, paymentMethod]);

  const value = useMemo<CheckoutValue>(() => ({
    details, setDetails, paymentMethod, setPaymentMethod, coupon,
    setCoupon: (v) => { setCoupon(v); setDiscount(0); },
    discount,
    applyCoupon: async (subtotal) => {
      const code = coupon.trim().toUpperCase();
      if (!code) return { ok: false, message: 'Enter a promo code' };
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return { ok: false, message: 'Sign in to use promo codes' };
      const { data, error } = await supabase.from('coupons').select('code,discount_type,discount_value,min_order,usage_limit,used_count,starts_at,ends_at').ilike('code', code).eq('status', 'ACTIVE').maybeSingle();
      if (error || !data) { setDiscount(0); return { ok: false, message: 'This promo code is not valid' }; }
      const now = Date.now();
      if ((data.starts_at && new Date(data.starts_at).getTime() > now) || (data.ends_at && new Date(data.ends_at).getTime() < now)) { setDiscount(0); return { ok: false, message: 'This promo code has expired' }; }
      if (data.usage_limit !== null && data.used_count >= data.usage_limit) { setDiscount(0); return { ok: false, message: 'This promo code has reached its limit' }; }
      if (subtotal < Number(data.min_order)) { setDiscount(0); return { ok: false, message: `Add items worth NPR ${Number(data.min_order).toLocaleString('en-US')} to use this code` }; }
      const amount = data.discount_type === 'PERCENTAGE' ? Math.round((subtotal * Number(data.discount_value)) / 100) : Number(data.discount_value);
      setDiscount(Math.min(amount, subtotal));
      return { ok: true, message: `${data.code} applied — you save NPR ${Math.min(amount, subtotal).toLocaleString('en-US')}` };
    },
    reset: () => {
      setDetails(initial); setPaymentMethod('COD'); setCoupon(''); setDiscount(0);
      try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
    },
  }), [details, paymentMethod, coupon, discount]);

  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>;
}

export function useCheckout() {
  const value = useContext(CheckoutContext);
  if (!value) throw new Error('useCheckout requires CheckoutProvider');
  return value;
}
