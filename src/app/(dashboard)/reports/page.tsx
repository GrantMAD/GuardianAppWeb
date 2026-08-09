export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="mt-2 text-slate-400">Review usage insights and weekly summaries.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold">Weekly focus time</h2>
          <p className="mt-2 text-3xl font-semibold">18.4 hrs</p>
          <p className="mt-2 text-sm text-slate-400">Up 7% from last week.</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold">Most restricted app</h2>
          <p className="mt-2 text-3xl font-semibold">YouTube</p>
          <p className="mt-2 text-sm text-slate-400">Blocked for 5 days this week.</p>
        </div>
      </div>
    </div>
  );
}
