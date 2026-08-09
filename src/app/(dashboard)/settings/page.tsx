import { ActivityLogCard } from '@/components/family/ActivityLogCard';
import { PairingCard } from '@/components/family/PairingCard';
import { getDashboardData } from '@/lib/dashboard-service';

export default async function SettingsPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-2 text-slate-400">Manage family preferences and child profiles.</p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold">Children</h2>
        <div className="mt-4 space-y-3">
          {data.children.map((child) => (
            <div key={child.id} className="rounded-xl border border-slate-800 bg-slate-800/60 p-3">
              <p className="font-medium">{child.name}</p>
              <p className="text-sm text-slate-400">{child.age} • {child.device}</p>
            </div>
          ))}
        </div>
      </div>

      <PairingCard defaultCode={data.pairingCode} />
      <ActivityLogCard />
    </div>
  );
}
