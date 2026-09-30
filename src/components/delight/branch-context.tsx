import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { Check, ChevronDown, Clock, MapPin, Store } from 'lucide-react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { currentBranchId, fetchBranches, FALLBACK_BRANCHES, hasChosenBranch, hoursText, writeBranchCookie, type Branch } from '@/lib/branch';
import { supabase } from '@/services/supabase';
import { useAuth } from './auth-context';

type BranchValue = {
  branches: Branch[];
  /** The store the shopper is buying from. */
  branch: Branch;
  /** Stores that take online orders right now. */
  open: Branch[];
  setBranch: (id: string, opts?: { quiet?: boolean }) => void;
  /** Opens the store picker. */
  choose: () => void;
};

const BranchContext = createContext<BranchValue | undefined>(undefined);
export const branchesQuery = { queryKey: ['branches'], queryFn: fetchBranches, staleTime: 5 * 60_000 } as const;

export function BranchProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: branches = FALLBACK_BRANCHES } = useQuery(branchesQuery);
  const [id, setId] = useState(currentBranchId);
  const [picker, setPicker] = useState(false);
  const asked = useRef(false);

  const open = useMemo(() => branches.filter((b) => b.acceptingOrders), [branches]);
  const branch = branches.find((b) => b.id === id) ?? branches[0] ?? FALLBACK_BRANCHES[0]!;

  const setBranch = useCallback((next: string, opts: { quiet?: boolean } = {}) => {
    const target = branches.find((b) => b.id === next);
    if (!target) return;
    writeBranchCookie(next);
    if (next === id) return;
    setId(next);
    if (user) void supabase.from('profiles').update({ preferred_branch_id: next }).eq('id', user.id);
    // Stock and prices differ per store: reload everything the pages show.
    void queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'branches' });
    void router.invalidate();
    if (!opts.quiet) toast.success(`Shopping from ${target.city} store`, { description: 'Stock and delivery now follow this store.' });
  }, [branches, id, user, queryClient, router]);

  // A signed-in customer's saved store wins on a device that has not chosen one.
  useEffect(() => {
    if (!user || hasChosenBranch()) return;
    void supabase.from('profiles').select('preferred_branch_id').eq('id', user.id).maybeSingle().then(({ data }) => {
      if (data?.preferred_branch_id && data.preferred_branch_id !== id) setBranch(data.preferred_branch_id, { quiet: true });
    });
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // A store that stopped taking online orders: move to one that does.
  useEffect(() => {
    if (branch.acceptingOrders || !open.length || branches === FALLBACK_BRANCHES) return;
    setBranch(open[0]!.id, { quiet: true });
  }, [branch.acceptingOrders, open, branches, setBranch]);

  // First visit: ask which store, but only when there is a real choice.
  useEffect(() => {
    if (asked.current || hasChosenBranch() || open.length < 2) return;
    asked.current = true;
    const t = setTimeout(() => setPicker(true), 800);
    return () => clearTimeout(t);
  }, [open.length]);

  const value = useMemo(() => ({ branches, branch, open, setBranch, choose: () => setPicker(true) }), [branches, branch, open, setBranch]);
  return (
    <BranchContext.Provider value={value}>
      {children}
      <StorePicker open={picker} onOpenChange={setPicker} />
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const v = useContext(BranchContext);
  if (!v) throw new Error('useBranch requires BranchProvider');
  return v;
}

/** Sheet listing the stores; closed stores are shown as "opening soon". */
function StorePicker({ open: isOpen, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { branches, branch, setBranch } = useBranch();
  const isMobile = useIsMobile();
  const pick = (b: Branch) => {
    if (!b.acceptingOrders) return;
    setBranch(b.id);
    onOpenChange(false);
  };
  return (
    <Sheet open={isOpen} onOpenChange={(v) => { if (!v) writeBranchCookie(branch.id); onOpenChange(v); }}>
      <SheetContent side={isMobile ? 'bottom' : 'right'} className={`overflow-y-auto p-5 ${isMobile ? 'max-h-[88vh] rounded-t-2xl' : 'w-[420px] sm:max-w-[420px]'}`}>
        <SheetTitle className="flex items-center gap-2 text-[19px] font-extrabold text-navy"><Store className="size-5 text-brand" /> Choose your store</SheetTitle>
        <SheetDescription className="mt-1 text-[14px] leading-6 text-slate">
          Products, stock and delivery come from the store you choose. You can order from either store; delivering to the other store’s town costs a little extra.
        </SheetDescription>
        <div className="mt-4 space-y-2.5">
          {branches.map((b) => {
            const on = b.id === branch.id;
            return (
              <button key={b.id} type="button" onClick={() => pick(b)} disabled={!b.acceptingOrders} aria-pressed={on}
                className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${on ? 'border-brand bg-[#effaf4]' : 'border-line bg-white hover:border-brand/40'} disabled:cursor-not-allowed disabled:opacity-60`}>
                <span className={`grid size-11 shrink-0 place-items-center rounded-full ${on ? 'bg-brand text-white' : 'bg-[#eef8f3] text-brand'}`}><MapPin className="size-5" /></span>
                <span className="min-w-0 flex-1">
                  <b className="block text-[16px] font-bold text-navy">{b.city} store</b>
                  <span className="block text-[13px] leading-5 text-slate">{b.address}</span>
                  {b.acceptingOrders ? (
                    <span className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[12.5px] font-medium text-brand">
                      {hoursText(b) && <span className="flex items-center gap-1"><Clock className="size-3.5" />{hoursText(b)}</span>}
                      <span>{b.deliveryFee ? `Delivery NPR ${b.deliveryFee}` : 'Free delivery in ' + b.city}</span>
                    </span>
                  ) : <span className="mt-1.5 inline-block rounded-full bg-[#fff4df] px-2.5 py-0.5 text-[12px] font-semibold text-[#9a6200]">Online orders opening soon</span>}
                </span>
                {on && <Check className="size-5 shrink-0 text-brand" />}
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Header button showing the current store; opens the picker. */
export function StoreButton({ className = '', compact = false }: { className?: string; compact?: boolean }) {
  const { branch, choose } = useBranch();
  return (
    <button type="button" onClick={choose} aria-label={`Shopping from ${branch.city} store. Change store`} className={`flex min-w-0 items-center gap-1 whitespace-nowrap font-medium text-ink ${className}`}>
      <MapPin className="size-[18px] shrink-0 fill-ink text-white" />
      <span className="max-w-[140px] truncate">{compact ? branch.city : `${branch.city} store`}</span>
      <ChevronDown className="size-4 shrink-0 text-brand" />
    </button>
  );
}
