import { Check } from 'lucide-react';

const steps = ['Cart', 'Checkout', 'Review', 'Payment'];

export function CheckoutSteps({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <div className="mx-auto flex max-w-[640px] items-start px-2">
      {steps.map((s, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <div key={s} className="relative flex flex-1 flex-col items-center">
            {i > 0 && <span className={`absolute top-[17px] h-0.5 ${n <= current ? 'bg-brand' : 'bg-line'}`} style={{ left: 'calc(-50% + 26px)', right: 'calc(50% + 26px)' }} />}
            <span className={`z-10 grid size-9 place-items-center rounded-full text-[15px] font-bold ${done || active ? 'bg-brand text-white' : 'bg-[#eef1f4] text-slate'}`}>
              {done ? <Check className="size-5" strokeWidth={3} /> : n}
            </span>
            <span className={`mt-1.5 text-[13px] lg:text-[14px] ${done || active ? 'font-medium text-brand' : 'text-slate'}`}>{s}</span>
          </div>
        );
      })}
    </div>
  );
}
