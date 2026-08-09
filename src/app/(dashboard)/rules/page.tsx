import { RuleCard } from '@/components/rules/RuleCard';
import { ScheduleComposer } from '@/components/rules/ScheduleComposer';
import { getDashboardData } from '@/lib/dashboard-service';

export default async function RulesPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Rules</h1>
        <p className="mt-2 text-slate-400">Manage app blocking, time limits, and schedules from the web dashboard.</p>
      </div>

      <ScheduleComposer children={data.children.map((child) => ({ id: child.id, name: child.name }))} />

      <div className="grid gap-4">
        {data.rules.map((rule) => (
          <RuleCard key={rule.id} rule={rule} />
        ))}
      </div>
    </div>
  );
}
