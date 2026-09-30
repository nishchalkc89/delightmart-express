import { createFileRoute } from '@tanstack/react-router';
import { Bell, CircleCheck, Download, Share, Smartphone, SquarePlus, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { InfoPage } from '@/components/delight/info-page';
import { useInstallApp } from '@/components/delight/pwa-register';
import { asset } from '@/lib/assets';

export const Route = createFileRoute('/app')({
  head: () => ({ meta: [{ title: 'Get the Delight App — Delight Shopping Mart' }, { name: 'description', content: 'Install the Delight Shopping Mart app on your Android phone or iPhone.' }] }),
  component: Page,
});

function Page() {
  const app = useInstallApp();
  async function install() {
    if (await app.install()) toast.success('Delight app installed — find it on your home screen');
  }
  return (
    <InfoPage title="Get the Delight App" intro="Shop faster from your home screen. No app store needed — it installs straight from this website and takes almost no space.">
      <div className="flex flex-col items-center gap-5 rounded-2xl bg-[#eef7f2] p-5 sm:flex-row">
        <img src={asset('app-phone')} alt="" className="h-[150px] w-auto" />
        <div className="flex-1">
          <ul className="space-y-2 text-[15px] text-navy">
            <li className="flex items-center gap-2"><Zap className="size-5 fill-brand text-brand" /> Opens instantly, full screen</li>
            <li className="flex items-center gap-2"><Bell className="size-5 text-brand" /> Order updates and offers</li>
            <li className="flex items-center gap-2"><Smartphone className="size-5 text-brand" /> Works on Android and iPhone</li>
          </ul>
          {app.installed ? (
            <p className="mt-4 flex items-center gap-2 font-semibold text-brand"><CircleCheck className="size-5" /> You are already using the app.</p>
          ) : app.canInstall ? (
            <button onClick={() => void install()} className="mt-4 inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-6 text-[16px] font-bold text-white"><Download className="size-5" /> Install the app</button>
          ) : (
            <p className="mt-4 text-[14px] text-slate">Follow the steps below for your phone.</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-line p-4">
          <h2>Android (Chrome)</h2>
          <ol className="ml-5 list-decimal space-y-1 text-[14.5px]">
            <li>Open this website in Chrome.</li>
            <li>Tap the <b>⋮</b> menu at the top right.</li>
            <li>Tap <b>Install app</b> (or <b>Add to Home screen</b>).</li>
            <li>Open Delight from your home screen.</li>
          </ol>
        </section>
        <section className="rounded-2xl border border-line p-4">
          <h2>iPhone (Safari)</h2>
          <ol className="ml-5 list-decimal space-y-1 text-[14.5px]">
            <li>Open this website in Safari.</li>
            <li>Tap the <Share className="inline size-4 align-[-2px]" /> <b>Share</b> button.</li>
            <li>Tap <SquarePlus className="inline size-4 align-[-2px]" /> <b>Add to Home Screen</b>, then <b>Add</b>.</li>
            <li>Open Delight from your home screen.</li>
          </ol>
        </section>
      </div>
    </InfoPage>
  );
}
