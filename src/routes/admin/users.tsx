import { createFileRoute } from '@tanstack/react-router';
import { ChevronRight, Clock, Ellipsis, FileText, Pencil, Settings, Shield, UserPlus, UserRound, Users, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { Avatar, Badge, Card, Checkbox, DataBadge, FiltersButton, IconBtn, PageHeader, Pagination, Panel, PanelTitle, PrimaryAction, SearchBox, SelectBox, StatCard, Status, Table, Tabs, Td, Tr, WithPanel, type BadgeTone } from '@/components/delight/admin-ui';
import { people } from '@/components/delight/admin-data';
import { Select } from '@/components/delight/admin-forms';
import { fmtDate, useAdminData } from '@/services/admin';
import { fetchUsersWithRoles, setProfileStatus, setUserRole, type StaffRow } from '@/services/admin-actions';
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

const roleTone: Record<string, BadgeTone> = { 'Super Admin': 'purple', Manager: 'blue', 'Delivery Partner': 'green', Staff: 'amber' };
const users = [
  [people.nishchal, 'Nishchal Kc', 'Super Admin', 'Super Admin', 'nishchal@example.com', 'Active', '01 Jan 2025'],
  [people.ramesh, 'Ramesh D.', 'Delivery Partner', 'Delivery Partner', 'ramesh@example.com', 'Active', '12 Jan 2025'],
  [people.kiran, 'Suman K.', 'Store Manager', 'Manager', 'suman@example.com', 'Active', '15 Jan 2025'],
  [people.aarati, 'Aarati KC', 'Support Staff', 'Staff', 'aarati@example.com', 'Active', '18 Jan 2025'],
  [people.bikash, 'Bikash Oli', 'Delivery Partner', 'Delivery Partner', 'bikash@example.com', 'Active', '20 Jan 2025'],
  [people.sita, 'Sita Sharma', 'Customer Support', 'Staff', 'sita@example.com', 'Active', '22 Jan 2025'],
  [null, 'Prabin Chaudhary', 'Inventory Staff', 'Staff', 'prabin@example.com', 'Inactive', '25 Jan 2025'],
  [people.anjali, 'Anjali Gurung', 'Marketing', 'Staff', 'anjali@example.com', 'Active', '28 Jan 2025'],
  [null, 'Dipesh Rana', 'Accountant', 'Staff', 'dipesh@example.com', 'Active', '30 Jan 2025'],
  [people.dipesh, 'Kiran Nepali', 'Warehouse Staff', 'Staff', 'kiran@example.com', 'Inactive', '02 Feb 2025'],
] as const;
const dist = [{ n: 'Super Admin', v: 6, c: '#8b5cf6' }, { n: 'Manager', v: 3, c: '#2f80ed' }, { n: 'Delivery Partner', v: 8, c: '#0a8a5b' }, { n: 'Staff', v: 7, c: '#f59f0b' }];
const recent = [[people.kiran, 'Kiran Nepali', '02 Feb 2025', 'Staff'], [people.anjali, 'Anjali Gurung', '28 Jan 2025', 'Staff'], [null, 'Dipesh Rana', '25 Jan 2025', 'Staff'], [people.sita, 'Sita Sharma', '22 Jan 2025', 'Staff'], [people.bikash, 'Bikash Oli', '20 Jan 2025', 'Delivery Partner']] as const;

function Page() {
  const { rows: live_rows, setRows, live, loading } = useAdminData<StaffRow>(fetchUsersWithRoles, []);
  const [tab, setTab] = useState(0);
  const [query, setQuery] = useState('');
  const tabFilters: Array<(u: StaffRow) => boolean> = [() => true, (u) => ['SUPER_ADMIN', 'MANAGER'].includes(mainRole(u)), (u) => mainRole(u) === 'DELIVERY_STAFF', (u) => ['ORDER_STAFF', 'INVENTORY_STAFF'].includes(mainRole(u)), (u) => mainRole(u) === 'CUSTOMER'];
  const shown = live_rows.filter((u) => tabFilters[tab]!(u) && `${u.name} ${u.email} ${u.phone}`.toLowerCase().includes(query.toLowerCase()));
  const n = (i: number) => live_rows.filter(tabFilters[i]!).length;
  const liveDist = [{ n: 'Super Admin', v: live_rows.filter((u) => mainRole(u) === 'SUPER_ADMIN').length, c: '#8b5cf6' }, { n: 'Manager', v: live_rows.filter((u) => mainRole(u) === 'MANAGER').length, c: '#2f80ed' }, { n: 'Delivery Partner', v: n(2), c: '#0a8a5b' }, { n: 'Staff', v: n(3), c: '#f59f0b' }, { n: 'Customer', v: n(4), c: '#cbd5e1' }];

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
      <PageHeader title="Users & Roles" subtitle="Manage team members, assign roles and control access permissions." badge={<DataBadge live={live} loading={loading} />} actions={<PrimaryAction icon={UserPlus} onClick={() => toast.info('Ask the team member to create an account on the store, then choose their role here.')}>Add New User</PrimaryAction>} />
      <WithPanel
        main={
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard icon={Users} tone="green" label="Total Users" value={live ? String(live_rows.length) : '24'} delta={live ? undefined : '+9%'} />
              <StatCard icon={UserRound} tone="blue" label="Active Users" value={live ? String(live_rows.filter((u) => u.status.toUpperCase() === 'ACTIVE').length) : '20'} delta={live ? undefined : '+11%'} filled={false} />
              <StatCard icon={Clock} tone="amber" label="Inactive Users" value={live ? String(live_rows.filter((u) => u.status.toUpperCase() !== 'ACTIVE').length) : '4'} delta={live ? undefined : '-20%'} dir="down" filled={false} />
              <StatCard icon={Shield} tone="purple" label="Admin Users" value={live ? String(n(1)) : '6'} delta={live ? undefined : '+0%'} />
            </div>
            <Card className="mt-4">
              <Tabs items={['All Users', 'Admins', 'Delivery Partners', 'Staff', 'Customers'].map((t, i) => `${t} (${live ? n(i) : ['24', '6', '8', '7', '3'][i]})`)} active={tab} onChange={setTab} />
              <div className="flex items-center gap-3 px-4 py-4">
                <SearchBox placeholder="Search users by name, email or phone..." value={query} onChange={setQuery} className="w-[330px]" />
                <SelectBox label="All Roles" className="ml-auto w-[162px]" />
                <SelectBox label="All Status" className="w-[148px]" />
                <span className="ml-8"><FiltersButton /></span>
              </div>
              <Table head={[<Checkbox key="c" />, '#', 'User', 'Role', 'Email / Phone', 'Status', 'Joined Date', 'Actions']}>
                {live ? shown.map((u, i) => {
                  const role = mainRole(u);
                  return (
                    <Tr key={u.id}>
                      <Td><Checkbox /></Td>
                      <Td>{i + 1}</Td>
                      <Td><span className="flex items-center gap-3"><Avatar src={u.avatar ?? undefined} name={u.name} /><span className="leading-tight"><span className="block whitespace-nowrap">{u.name}</span><span className="text-[12.5px] text-slate">{u.phone}</span></span></span></Td>
                      <Td><span className="block w-[150px]"><Select value={role} onChange={(v) => void changeRole(u, v as Role)}>{order.map((r) => <option key={r} value={r}>{roleNames[r]}</option>)}</Select></span></Td>
                      <Td>{u.email}</Td>
                      <Td><Status value={u.status.toUpperCase() === 'ACTIVE' ? 'Active' : 'Inactive'} /></Td>
                      <Td className="whitespace-nowrap text-slate">{fmtDate(u.joined)}</Td>
                      <Td><span className="flex gap-2"><Badge tone={toneOf(role)}>{roleNames[role]}</Badge><IconBtn icon={Ellipsis} label={u.status.toUpperCase() === 'ACTIVE' ? 'Deactivate' : 'Activate'} onClick={() => void toggleActive(u)} /></span></Td>
                    </Tr>
                  );
                }) : users.map(([p, name, title, role, email, st, joined], i) => (
                  <Tr key={name}>
                    <Td><Checkbox /></Td>
                    <Td>{i + 1}</Td>
                    <Td><span className="flex items-center gap-3"><Avatar src={p?.avatar} name={name} /><span className="leading-tight"><span className="block whitespace-nowrap">{name}</span><span className="text-[12.5px] text-slate">{title}</span></span></span></Td>
                    <Td><Badge tone={roleTone[role]!}>{role}</Badge></Td>
                    <Td>{email}</Td>
                    <Td><Status value={st} /></Td>
                    <Td className="whitespace-nowrap text-slate">{joined}</Td>
                    <Td><span className="flex gap-2"><IconBtn icon={Pencil} label="Edit" /><IconBtn icon={Ellipsis} label="More" /></span></Td>
                  </Tr>
                ))}
              </Table>
              <Pagination text={`Showing 1–${live ? shown.length : 10} of ${live ? live_rows.length : 24} users`} pages={live ? [1] : [1, 2, 3]} />
            </Card>
          </>
        }
        panel={
          <div className="space-y-4">
            <Panel>
              <PanelTitle>Role Distribution</PanelTitle>
              <div className="flex items-center gap-4">
                <div className="relative size-[140px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={live ? liveDist.filter((d) => d.v) : dist} dataKey="v" innerRadius={48} outerRadius={68} startAngle={90} endAngle={-270} stroke="none">{(live ? liveDist.filter((d) => d.v) : dist).map((d) => <Cell key={d.n} fill={d.c} />)}</Pie></PieChart></ResponsiveContainer>
                  <span className="absolute inset-0 grid place-content-center text-center"><b className="text-[22px] font-extrabold text-navy">{live ? live_rows.length : 24}</b><span className="text-[12.5px] text-slate">Users</span></span>
                </div>
                <ul className="flex-1 space-y-3 text-[13px]">{(live ? liveDist : dist).map((d) => <li key={d.n} className="flex items-center gap-2"><span className="size-3 rounded-full" style={{ background: d.c }} /><span className="flex-1 text-navy">{d.n}</span><span className="text-navy">{d.v}</span></li>)}</ul>
              </div>
            </Panel>
            <Panel>
              <PanelTitle link="View All">Recent Registrations</PanelTitle>
              <ul className="space-y-3">
                {(live ? live_rows.slice(0, 5).map((u) => [{ avatar: u.avatar ?? undefined }, u.name, fmtDate(u.joined), roleNames[mainRole(u)]] as const) : recent).map(([p, name, d, role]) => (
                  <li key={name} className="flex items-center gap-3">
                    <Avatar src={p?.avatar} name={name} size="size-10" />
                    <span className="flex-1 leading-tight"><span className="block text-[14px] text-navy">{name}</span><span className="text-[12.5px] text-slate">{d}</span></span>
                    <Badge tone={roleTone[role] ?? 'gray'}>{role}</Badge>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel>
              <PanelTitle>Quick Actions</PanelTitle>
              {([[UsersRound, 'Add New User'], [Shield, 'Manage Roles'], [Settings, 'Permission Settings'], [FileText, 'View Activity Logs']] as const).map(([Icon, label]) => (
                <button key={label} className="mb-2.5 flex h-12 w-full items-center gap-4 rounded-lg border border-line px-4 text-[14px] text-navy last:mb-0"><Icon className="size-5" />{label}<ChevronRight className="ml-auto size-4" /></button>
              ))}
            </Panel>
          </div>
        }
      />
    </div>
  );
}
