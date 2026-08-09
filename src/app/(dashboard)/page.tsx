import { RequestsPanel } from '@/components/requests/RequestsPanel';
import { getDashboardData } from '@/lib/dashboard-service';

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Family overview</p>
          <h1 className="text-3xl font-semibold">Parent Dashboard</h1>
          <p className="mt-2 text-slate-400">Monitor usage, manage restrictions, and stay on top of your family.</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
          Active child: <span className="font-semibold text-white">{data.children[0]?.name ?? 'Family'}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {data.usageSummary.map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold">{item.value}</p>
            <p className="mt-2 text-sm text-cyan-400">{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold">Weekly usage</h2>
          <p className="text-sm text-slate-400">A quick view of recent screen-time patterns.</p>
          <div className="mt-6 flex items-end gap-3">
            {data.weeklyUsage.map((entry) => (
              <div key={entry.day} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-t-xl bg-cyan-500/70" style={{ height: `${Math.max(36, entry.minutes / 3)}px` }} />
                <span className="text-sm text-slate-400">{entry.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold">Top apps today</h2>
          <ul className="mt-4 space-y-3">
            {data.topApps.map((app) => (
              <li key={app.name} className="flex items-center justify-between rounded-xl bg-slate-800/70 px-3 py-3">
                <div>
                  <p className="font-medium">{app.name}</p>
                  <p className="text-sm text-slate-400">{app.category}</p>
                </div>
                <span className="text-sm text-cyan-300">{app.minutes}m</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold">Recent activity</h2>
          <div className="mt-4 space-y-3">
            {data.activityLog.map((entry) => (
              <div key={entry.title} className="rounded-xl border border-slate-800 bg-slate-800/60 p-3">
                <p className="font-medium">{entry.title}</p>
                <p className="mt-1 text-sm text-slate-400">{entry.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <RequestsPanel requests={data.requests} />
      </div>
    </div>
  );
}
