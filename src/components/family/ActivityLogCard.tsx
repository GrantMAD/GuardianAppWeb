'use client';

const entries = [
  { title: 'Blocked YouTube', detail: 'Applied at 8:30 PM' },
  { title: 'Approved extra time', detail: 'For Minecraft — 20 minutes' },
  { title: 'Saved bedtime schedule', detail: 'Applied to both children' },
];

export function ActivityLogCard() {
  return (
    <div className="rounded-2xl border border-border bg-bg-card p-6">
      <h2 className="text-lg font-semibold">Parent activity log</h2>
      <p className="mt-2 text-sm text-text-muted">Recent actions taken from the parent dashboard.</p>

      <div className="mt-4 space-y-3">
        {entries.map((entry) => (
          <div key={entry.title} className="rounded-xl border border-border bg-bg-elevated/60 p-3">
            <p className="font-medium">{entry.title}</p>
            <p className="mt-1 text-sm text-text-muted">{entry.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
