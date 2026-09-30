import { createContext, useContext, type ReactNode } from 'react';
import { supabase } from './supabase';
import { fetchBranches, type Branch } from '@/lib/branch';

/**
 * Which store the admin is looking at.
 *   'all'  – every store the account may see (Super Admin only)
 *   an id  – one store, e.g. 'tulsipur'
 * The database enforces the same limits (row level security); this only decides what to ask for.
 */
export type AdminScope = 'all' | string;

export type StaffAccess = { isSuper: boolean; role: string | null; branchIds: string[] };

export type AdminScopeValue = {
  branches: Branch[];
  /** Stores this account may see. */
  allowed: Branch[];
  isSuper: boolean;
  /** Main staff role, e.g. 'SUPER_ADMIN' or 'MANAGER'. */
  role: string | null;
  scope: AdminScope;
  setScope: (s: AdminScope) => void;
  /** The store whose stock is shown and edited ('all' has no single store: stock is read-only there). */
  stockBranch: string | null;
  label: string;
};

// The current scope for the data loaders (set by the admin shell before pages load data).
let current: { scope: AdminScope; allowed: string[] } = { scope: 'all', allowed: [] };
export const adminScope = () => current;
export function setAdminScopeValue(scope: AdminScope, allowed: string[]) {
  current = { scope, allowed };
}
/** Store ids to ask for: the chosen store, or every allowed store. */
export const scopeBranchIds = () => (current.scope === 'all' ? current.allowed : [current.scope]);

const KEY = 'delight-admin-scope';
export function savedScope(): AdminScope | null {
  try { return localStorage.getItem(KEY); } catch { return null; }
}
export function saveScope(s: AdminScope) {
  try { localStorage.setItem(KEY, s); } catch { /* storage unavailable */ }
}

export async function fetchStaffAccess(userId: string): Promise<StaffAccess> {
  const [{ data: roles }, { data: stores }] = await Promise.all([
    supabase.from('user_roles').select('role').eq('user_id', userId),
    supabase.from('staff_branches').select('branch_id').eq('user_id', userId),
  ]);
  const staff = (roles ?? []).map((r) => r.role).filter((r) => r !== 'CUSTOMER');
  const isSuper = staff.includes('SUPER_ADMIN');
  return { isSuper, role: isSuper ? 'SUPER_ADMIN' : staff[0] ?? null, branchIds: (stores ?? []).map((s) => s.branch_id) };
}

export { fetchBranches };

export const AdminScopeContext = createContext<AdminScopeValue | undefined>(undefined);
export function AdminScopeProvider({ value, children }: { value: AdminScopeValue; children: ReactNode }) {
  return <AdminScopeContext.Provider value={value}>{children}</AdminScopeContext.Provider>;
}
export function useAdminScope(): AdminScopeValue {
  const v = useContext(AdminScopeContext);
  if (!v) throw new Error('useAdminScope requires the admin shell');
  return v;
}
