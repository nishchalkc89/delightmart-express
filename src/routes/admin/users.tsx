import { createFileRoute } from '@tanstack/react-router';
import { ChevronRight, Clock, Ellipsis, FileText, Pencil, Settings, Shield, UserPlus, UserRound, Users, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { Avatar, Badge, Card, Checkbox, FiltersButton, IconBtn, PageHeader, Pagination, Panel, PanelTitle, PrimaryAction, SearchBox, SelectBox, StatCard, Status, Table, Tabs, Td, Tr, WithPanel, type BadgeTone } from '@/components/delight/admin-ui';
import { people } from '@/components/delight/admin-data';

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
  const [tab, setTab] = useState(0);
  return (
    <div>
      <PageHeader title="Users & Roles" subtitle="Manage team members, assign roles and control access permissions." actions={<PrimaryAction icon={UserPlus}>Add New User</PrimaryAction>} />
      <WithPanel
        main={
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard icon={Users} tone="green" label="Total Users" value="24" delta="+9%" />
              <StatCard icon={UserRound} tone="blue" label="Active Users" value="20" delta="+11%" filled={false} />
              <StatCard icon={Clock} tone="amber" label="Inactive Users" value="4" delta="-20%" dir="down" filled={false} />
              <StatCard icon={Shield} tone="purple" label="Admin Users" value="6" delta="+0%" />
            </div>
            <Card className="mt-4">
              <Tabs items={['All Users (24)', 'Admins (6)', 'Delivery Partners (8)', 'Staff (7)', 'Customers (3)']} active={tab} onChange={setTab} />
              <div className="flex items-center gap-3 px-4 py-4">
                <SearchBox placeholder="Search users by name, email or phone..." className="w-[330px]" />
                <SelectBox label="All Roles" className="ml-auto w-[162px]" />
                <SelectBox label="All Status" className="w-[148px]" />
                <span className="ml-8"><FiltersButton /></span>
              </div>
              <Table head={[<Checkbox key="c" />, '#', 'User', 'Role', 'Email / Phone', 'Status', 'Joined Date', 'Actions']}>
                {users.map(([p, name, title, role, email, st, joined], i) => (
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
              <Pagination text="Showing 1–10 of 24 users" pages={[1, 2, 3]} />
            </Card>
          </>
        }
        panel={
          <div className="space-y-4">
            <Panel>
              <PanelTitle>Role Distribution</PanelTitle>
              <div className="flex items-center gap-4">
                <div className="relative size-[140px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={dist} dataKey="v" innerRadius={48} outerRadius={68} startAngle={90} endAngle={-270} stroke="none">{dist.map((d) => <Cell key={d.n} fill={d.c} />)}</Pie></PieChart></ResponsiveContainer>
                  <span className="absolute inset-0 grid place-content-center text-center"><b className="text-[22px] font-extrabold text-navy">24</b><span className="text-[12.5px] text-slate">Users</span></span>
                </div>
                <ul className="flex-1 space-y-3 text-[13px]">{dist.map((d) => <li key={d.n} className="flex items-center gap-2"><span className="size-3 rounded-full" style={{ background: d.c }} /><span className="flex-1 text-navy">{d.n}</span><span className="text-navy">{d.v}</span></li>)}</ul>
              </div>
            </Panel>
            <Panel>
              <PanelTitle link="View All">Recent Registrations</PanelTitle>
              <ul className="space-y-3">
                {recent.map(([p, name, d, role]) => (
                  <li key={name} className="flex items-center gap-3">
                    <Avatar src={p?.avatar} name={name} size="size-10" />
                    <span className="flex-1 leading-tight"><span className="block text-[14px] text-navy">{name}</span><span className="text-[12.5px] text-slate">{d}</span></span>
                    <Badge tone={roleTone[role]!}>{role}</Badge>
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
