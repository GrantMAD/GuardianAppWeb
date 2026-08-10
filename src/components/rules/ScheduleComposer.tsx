'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createScheduleEntry } from '@/lib/dashboard-service';

interface ChildOption {
  id: string;
  name: string;
}

interface ScheduleComposerProps {
  children: ChildOption[];
}

const dayOptions = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 0 },
];

export function ScheduleComposer({ children }: ScheduleComposerProps) {
  const router = useRouter();
  const [childId, setChildId] = useState(children[0]?.id ?? '');
  const [name, setName] = useState('Bedtime block');
  const [startTime, setStartTime] = useState('20:00');
  const [endTime, setEndTime] = useState('07:00');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function toggleDay(day: number) {
    setDaysOfWeek((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day].sort((a, b) => a - b),
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (!childId) {
        throw new Error('Select a child first.');
      }

      await createScheduleEntry({
        childId,
        name,
        startTime,
        endTime,
        daysOfWeek,
        scope: 'all',
        blockType: 'block',
        isActive: true,
      });

      setSuccess('Schedule created and is ready to use.');
      setName('Bedtime block');
      setStartTime('20:00');
      setEndTime('07:00');
      setDaysOfWeek([1, 2, 3, 4, 5]);
      router.refresh();
    } catch {
      setError('Unable to save the schedule right now.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-bg-card p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Create a schedule</h2>
          <p className="mt-1 text-sm text-text-muted">Set recurring quiet hours or homework windows.</p>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm text-text-muted">Child</span>
          <select value={childId} onChange={(event) => setChildId(event.target.value)} className="w-full rounded-xl border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary">
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-text-muted">Schedule name</span>
          <input value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-xl border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary" />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm text-text-muted">Start time</span>
            <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="w-full rounded-xl border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-text-muted">End time</span>
            <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="w-full rounded-xl border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary" />
          </label>
        </div>

        <div>
          <p className="mb-2 text-sm text-text-muted">Repeat on</p>
          <div className="flex flex-wrap gap-2">
            {dayOptions.map((day) => {
              const active = daysOfWeek.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`rounded-full px-3 py-1 text-sm ${active ? 'bg-accent text-bg-primary' : 'border border-border text-text-primary'}`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>

        <button type="submit" disabled={saving} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg-primary disabled:cursor-not-allowed disabled:opacity-70">
          {saving ? 'Saving…' : 'Save schedule'}
        </button>
      </div>

      {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}
      {success ? <p className="mt-4 text-sm text-emerald-400">{success}</p> : null}
    </form>
  );
}
