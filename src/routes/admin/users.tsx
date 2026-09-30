import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ChevronRight, Clock, Power, Settings, Shield, UserPlus, UserRound, Users, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { Avatar, Badge, Card, DataBadge, FilterSelect, IconBtn, PageHeader, Pagination, Panel, PanelTitle, PrimaryAction, SearchBox, StatCard, Status, Table, Tabs, Td, Tr, usePaged, WithPanel, type BadgeTone } from '@/components/delight/admin-ui';
import { Select } from '@/components/delight/admin-forms';
import { fmtDate, useAdminData } from '@/services/admin';
import { fetchUsersWithRoles, setProfileStatus, setStaffStores, setUserRole, type StaffRow } from '@/services/admin-actions';
import { useAdminScope } from '@/services/admin-scope';
import { toast } from 'sonner';

type Role = StaffRow['roles'][number];
const roleNames: Record<Role, string> = { SUPER_ADMIN: 'Super Admin', MANAGER: 'Manager', ORDER_STAFF: 'Order Staff', INVENTORY_STAFF: 'Inventory Staff', DELIVERY_STAFF: 'Delivery Partner', CUSTOMER: 'Customer' };
const order: Role[] = ['SUPER_ADMIN', 'MANAGER', 'ORDER_STAFF', 'INVENTORY_STAFF', 'DELIVERY_STAFF', 'CUSTOMER'];
const mainRole = (u: StaffRow): Role => order.find((r) => u.roles.includes(r)) ?? 'CUSTOMER';
const toneOf = (r: Role): BadgeTone => (r === 'SUPER_ADMIN' ? 'purple' : r === 'MANAGER' ? 'blue' : r === 'DELIVERY_STAFF' ? 'green' : r === 'CUSTOMER' ? 'gray' : 'amber');

export const Route = createFileRoute('/admin/users')({
  head: () => ({ meta: [{ title: 'Users & Roles — Delight Admin' }, { name: 'description', content: 'Manage team members and access permissions.' }, { property: 'og:title', content: 'Users & Roles — Delight Admin' }, { property: 'og:description', content: 'Role management.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

function Page() {
  const { rows: live_rows, setRows, live, loading } = useAdminData<StaffRow>(fetchUsersWithRoles);
  const [tab, setTab] = useState(0);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [roleF, setRoleF] = useState('all');
  const [statusF, setStatusF] = useState('all');
  const tabFilters: Array<(u: StaffRow) => boolean> = [() => true, (u) => ['SUPER_ADMIN', 'MANAGER'].includes(mainRole(u)), (u) => mainRole(u) === 'DELIVERY_STAFF', (u) => ['ORDER_STAFF', 'INVENTORY_STAFF'].includes(mainRole(u)), (u) => mainRole(u) === 'CUSTOMER'];
  const active = (u: StaffRow) => u.status.toUpperCase() === 'ACTIVE';
  const shown = live_rows.filter((u) => tabFilters[tab]!(u) && `${u.name} ${u.email} ${u.phone}`.toLowerCase().includes(query.toLowerCase())
    && (roleF === 'all' || mainRole(u) === roleF) && (statusF === 'all' || (statusF === 'active') === active(u)));
  const pg = usePaged(shown, 20);
  function invite() {
    const link = `${window.location.origin}/signup`;
    void navigator.clipboard?.writeText(link).catch(() => undefined);
    toast.success('Sign-up link copied', { description: `Send ${link} to the new team member. Once they sign up they appear here, and you pick their role in the Role column.`, duration: 9000 });
  }
  const n = (i: number) => live_rows.filter(tabFilters[i]!).length;
  const liveDist = [{ n: 'Super Admin', v: live_rows.filter((u) => mainRole(u) === 'SUPER_ADMIN').length, c: '#8b5cf6' }, { n: 'Manager', v: live_rows.filter((u) => mainRole(u) === 'MANAGER').length, c: '#2f80ed' }, { n: 'Delivery Partner', v: n(2), c: '#0a8a5b' }, { n: 'Staff', v: n(3), c: '#f59f0b' }, { n: 'Customer', v: n(4), c: '#cbd5e1' }];

  const { branches, isSuper } = useAdminScope();
  const storeValue = (u: StaffRow) => (u.stores.length > 1 ? 'both' : u.stores[0] ?? '');
  async function changeStores(u: StaffRow, v: string) {
    const ids = v === 'both' ? branches.map((b) => b.id) : v ? [v] : [];
    try {
      await setStaffStores(u.id, ids);
      setRows((list) => list.map((x) => (x.id === u.id ? { ...x, stores: ids } : x)));
      toast.success(ids.length ? `${u.name} now works for ${ids.map((id) => branches.find((b) => b.id === id)?.city ?? id).join(' & ')}` : `${u.name} is not linked to a store`);
    } catch (e) { toast.error(e instanceof Error ? (e.message.includes('row-level') ? 'Only the owner (Super Admin) can assign stores' : e.message) : 'Could not change the store'); }
  }
  async function changeRole(u: StaffRow, role: Role) {
    try {
      await setUserRole(u.id, role);
      setRows((list) => list.map((x) => (x.id === u.id ? { ...x, roles: role === 'CUSTOMER' ? ['CUSTOMER'] : ['CUSTOMER', role] } : x)));
      toast.success(`${u.name} is now ${roleNames[role]}`);
    } catch (e) { toast.error(e instanceof Error ? (e.message.includes('row-level') ? 'Only a Super Admin can change roles' : e.message) : 'Could not change the role'); }
  }
  async function toggleActive(u: StaffRow) {
    const active = u.status.toUpperCase() !== 'ACTIVE';
    try {
      await setProfileStatus(u.id, active);
      setRows((list) => list.map((x) => (x.id === u.id ? { ...x, status: active ? 'ACTIVE' : 'INACTIVE' } : x)));
      toast.success(`${u.name} ${active ? 'activated' : 'deactivated'}`);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not update'); }
  }
  return (
    <div>
      <PageHeader title="Users & Roles" subtitle="Manage team members, assign roles and control access permissions." badge={<DataBadge live={live} loading={loading} />} actions={<PrimaryAction icon={UserPlus} onClick={invite}>Add New User</PrimaryAction>} />
      <WithPanel
        main={
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard icon={Users} tone="green" label="Total Users" value={String(live_rows.length)} />
              <StatCard icon={UserRound} tone="blue" label="Active Users" value={String(live_rows.filter((u) => u.status.toUpperCase() === 'ACTIVE').length)} filled={false} />
              <StatCard icon={Clock} tone="amber" label="Inactive Users" value={String(live_rows.filter((u) => u.status.toUpperCase() !== 'ACTIVE').length)} dir="down" filled={false} />
              <StatCard icon={Shield} tone="purple" label="Admin Users" value={String(n(1))} />
            </div>
            <Card className="mt-4">
              <Tabs items={['All Users', 'Admins', 'Delivery Partners', 'Staff', 'Customers'].map((t, i) => `${t} (${n(i)})`)} active={tab} onChange={(i) => { setTab(i); pg.reset(); }} />
              <div className="flex items-center gap-3 px-4 py-4">
                <SearchBox placeholder="Search users by name, email or phone..." value={query} onChange={setQuery} className="w-[330px]" />
                <FilterSelect label="Role" value={roleF} onChange={(v) => { setRoleF(v); pg.reset(); }} options={[['all', 'All Roles'], ...order.map((r): [string, string] => [r, roleNames[r]])]} className="ml-auto w-[170px]" />
                <FilterSelect label="Status" value={statusF} onChange={(v) => { setStatusF(v); pg.reset(); }} options={[['all', 'All Status'], ['active', 'Active'], ['inactive', 'Inactive']]} className="w-[140px]" />
              </div>
              <Table head={['#', 'User', 'Role', 'Store', 'Email / Phone', 'Status', 'Joined Date', 'Actions']}>
                {pg.shown.map((u, i) => {
                  const role = mainRole(u);
                  return (
                    <Tr key={u.id}>
                      <Td>{pg.from + i}</Td>
                      <Td><span className="flex items-center gap-3"><Avatar src={u.avatar ?? undefined} name={u.name} /><span className="leading-tight"><span className="block whitespace-nowrap">{u.name}</span><span className="text-[12.5px] text-slate">{u.phone}</span></span></span></Td>
                      <Td><span className="block w-[150px]"><Select value={role} onChange={(v) => void changeRole(u, v as Role)}>{order.map((r) => <option key={r} value={r}>{roleNames[r]}</option>)}</Select></span></Td>
                      <Td>{role === 'CUSTOMER' ? <span className="text-slate">—</span> : role === 'SUPER_ADMIN' ? <span className="whitespace-nowrap text-[13px] text-slate">All stores</span> : isSuper ? (
                        <span className="block w-[140px]"><Select value={storeValue(u)} onChange={(v) => void changeStores(u, v)}><option value="">No store</option>{branches.map((b) => <option key={b.id} value={b.id}>{b.city}</option>)}{branches.length > 1 && <option value="both">Both stores</option>}</Select></span>
                      ) : <span className="whitespace-nowrap text-[13px]">{u.stores.map((id) => branches.find((b) => b.id === id)?.city ?? id).join(' & ') || 'No store'}</span>}</Td>
                      <Td>{u.email}</Td>
                      <Td><Status value={u.status.toUpperCase() === 'ACTIVE' ? 'Active' : 'Inactive'} /></Td>
                      <Td className="whitespace-nowrap text-slate">{fmtDate(u.joined)}</Td>
                      <Td><span className="flex gap-2"><Badge tone={toneOf(role)}>{roleNames[role]}</Badge><IconBtn icon={Power} tone={active(u) ? 'danger' : 'default'} label={active(u) ? 'Deactivate user' : 'Activate user'} onClick={() => void toggleActive(u)} /></span></Td>
                    </Tr>
                  );
                })}
              </Table>
              {!shown.length && <p className="px-5 py-10 text-center text-[14px] text-slate">{loading ? 'Loading users…' : 'No users match these filters.'}</p>}
              <Pagination text={`Showing ${pg.from}-${pg.to} of ${pg.total} users`} current={pg.page} pageCount={pg.pageCount} onPage={pg.setPage} />
            </Card>
          </>
        }
        panel={
          <div className="space-y-4">
            <Panel>
              <PanelTitle>Role Distribution</PanelTitle>
              <div className="flex items-center gap-4">
                <div className="relative size-[140px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={liveDist.filter((d) => d.v)} dataKey="v" innerRadius={48} outerRadius={68} startAngle={90} endAngle={-270} stroke="none">{(liveDist.filter((d) => d.v)).map((d) => <Cell key={d.n} fill={d.c} />)}</Pie></PieChart></ResponsiveContainer>
                  <span className="absolute inset-0 grid place-content-center text-center"><b className="text-[22px] font-extrabold text-navy">{live_rows.length}</b><span className="text-[12.5px] text-slate">Users</span></span>
                </div>
                <ul className="flex-1 space-y-3 text-[13px]">{(liveDist).map((d) => <li key={d.n} className="flex items-center gap-2"><span className="size-3 rounded-full" style={{ background: d.c }} /><span className="flex-1 text-navy">{d.n}</span><span className="text-navy">{d.v}</span></li>)}</ul>
              </div>
            </Panel>
            <Panel>
              <PanelTitle link={{ label: 'View All', to: '/admin/customers' }}>Recent Registrations</PanelTitle>
              <ul className="space-y-3">
                {(live_rows.slice(0, 5).map((u) => [{ avatar: u.avatar ?? undefined }, u.name, fmtDate(u.joined), mainRole(u)] as const)).map(([p, name, d, role]) => (
                  <li key={name} className="flex items-center gap-3">
                    <Avatar src={p?.avatar} name={name} size="size-10" />
                    <span className="flex-1 leading-tight"><span className="block text-[14px] text-navy">{name}</span><span className="text-[12.5px] text-slate">{d}</span></span>
                    <Badge tone={toneOf(role)}>{roleNames[role]}</Badge>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel>
              <PanelTitle>Quick Actions</PanelTitle>
              {([[UsersRound, 'Add New User', invite], [Shield, 'Show Admins', () => { setTab(1); pg.reset(); }], [UserRound, 'Show Delivery Partners', () => { setTab(2); pg.reset(); }], [Settings, 'Store Settings', () => void navigate({ to: '/admin/settings' })]] as const).map(([Icon, label, go]) => (
                <button key={label} onClick={go} className="mb-2.5 flex h-12 w-full items-center gap-4 rounded-lg border border-line px-4 text-[14px] text-navy last:mb-0 hover:bg-page"><Icon className="size-5" />{label}<ChevronRight className="ml-auto size-4" /></button>
              ))}
            </Panel>
          </div>
        }
      />
    </div>
  );
}
