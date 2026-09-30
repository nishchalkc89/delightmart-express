import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Mail, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Card, IconBtn, OutlineAction, PageHeader, SearchBox, StatCard, Table, Td, Tr } from '@/components/delight/admin-ui';
import { fmtDate } from '@/services/admin';
import { supabase } from '@/services/supabase';

export const Route = createFileRoute('/admin/subscribers')({
  head: () => ({ meta: [{ title: 'Newsletter Subscribers — Delight Admin' }, { name: 'description', content: 'People who subscribed to Delight offers.' }] }),
  component: Page,
});

type Subscriber = { id: string; email: string; source: string; status: string; created_at: string };

function Page() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['admin-subscribers'],
    queryFn: async () => {
      const { data: rows, error: e } = await supabase.from('newsletter_subscribers').select('id,email,source,status,created_at').order('created_at', { ascending: false }).limit(5000);
      if (e) throw e;
      return rows as Subscriber[];
    },
  });
  const rows = data.filter((s) => s.email.includes(query.toLowerCase().trim()));
  const active = data.filter((s) => s.status === 'SUBSCRIBED');
  const thisMonth = data.filter((s) => new Date(s.created_at).getMonth() === new Date().getMonth() && new Date(s.created_at).getFullYear() === new Date().getFullYear());

  function exportCsv() {
    const csv = ['Email,Source,Status,Subscribed on', ...active.map((s) => `${s.email},${s.source},${s.status},${fmtDate(s.created_at)}`)].join('\r\n');
    const url = URL.createObjectURL(new Blob(['﻿', csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = 'delight-newsletter-subscribers.csv'; a.click(); URL.revokeObjectURL(url);
  }
  async function remove(s: Subscriber) {
    if (!window.confirm(`Remove ${s.email} from the newsletter list?`)) return;
    const { error: e } = await supabase.from('newsletter_subscribers').delete().eq('id', s.id);
    if (e) { toast.error(e.message); return; }
    toast.success('Removed');
    void queryClient.invalidateQueries({ queryKey: ['admin-subscribers'] });
  }

  return (
    <div>
      <PageHeader title="Newsletter Subscribers" subtitle="Emails collected from the Subscribe boxes on the website and app." actions={<OutlineAction icon={Download} onClick={exportCsv}>Export CSV</OutlineAction>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard compact icon={Mail} tone="green" label="Subscribers" value={String(active.length)} />
        <StatCard compact icon={Mail} tone="green" label="New this month" value={String(thisMonth.length)} />
      </div>
      <Card className="mt-4">
        <div className="p-4"><SearchBox placeholder="Search by email..." value={query} onChange={setQuery} className="w-[300px]" /></div>
        {error ? (
          <p className="px-5 pb-6 text-[14px] text-slate">The subscribers list isn’t set up in the database yet. Run the migration <b>20260930090000_shopper_features.sql</b> in Supabase → SQL Editor.</p>
        ) : (
          <Table head={['Email', 'Source', 'Status', 'Subscribed on', '']}>
            {isLoading && <Tr><Td>Loading…</Td></Tr>}
            {rows.map((s) => (
              <Tr key={s.id}>
                <Td>{s.email}</Td>
                <Td className="capitalize text-slate">{s.source}</Td>
                <Td>{s.status === 'SUBSCRIBED' ? 'Subscribed' : 'Unsubscribed'}</Td>
                <Td className="text-slate">{fmtDate(s.created_at)}</Td>
                <Td><IconBtn icon={Trash2} label="Remove" tone="danger" onClick={() => void remove(s)} /></Td>
              </Tr>
            ))}
            {!isLoading && !rows.length && <Tr><Td className="text-slate">No subscribers yet.</Td></Tr>}
          </Table>
        )}
      </Card>
    </div>
  );
}
