'use client';

import { useEffect, useState } from 'react';
import { useFamilyStore } from '@/store/familyStore';
import { getTasks, createTask, updateTaskStatus } from '@/lib/reward-task-service';
import { logParentAction } from '@/lib/parent-service';
import { getInstalledApps } from '@/lib/usage-service';
import { getRules } from '@/lib/rule-service';
import type { RewardTask, InstalledApp } from '@/types';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';

export default function RewardsPage() {
  const { selectedChildId, children, family } = useFamilyStore();
  const selectedChild = children.find((c) => c.id === selectedChildId);
  const { toast } = useToast();

  const [tasks, setTasks] = useState<RewardTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskMinutes, setTaskMinutes] = useState(15);
  const [taskAppId, setTaskAppId] = useState('');
  const [savingTask, setSavingTask] = useState(false);
  const [apps, setApps] = useState<InstalledApp[]>([]);

  const load = async () => {
    if (!selectedChildId) return;
    setLoading(true);
    try {
      const [t, a, r] = await Promise.all([
        getTasks(selectedChildId),
        getInstalledApps(selectedChildId),
        getRules(selectedChildId)
      ]);
      setTasks(t);
      
      const timeLimitRules = r.filter(rule => rule.rule_type === 'TIME_LIMIT');
      const timeLimitedApps = a.filter(app => 
        timeLimitRules.some(rule => rule.app_id === app.id || rule.category === app.category)
      );
      
      setApps(timeLimitedApps);
    } catch (err) { toast.error('Failed to load tasks'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [selectedChildId]);

  const handleSaveTask = async () => {
    if (!selectedChildId || !taskTitle) return;
    setSavingTask(true);
    try {
      await createTask({
        child_id: selectedChildId,
        title: taskTitle,
        description: taskDesc,
        reward_minutes: taskMinutes,
        app_id: taskAppId || undefined,
      });
      if (family) {
        await logParentAction(family.id, 'REWARD_TASK_CREATED', `Created a new task: ${taskTitle}`);
      }
      setShowTaskForm(false);
      setTaskTitle('');
      setTaskDesc('');
      setTaskMinutes(15);
      setTaskAppId('');
      await load();
      toast.success('Task created');
    } catch (err) { toast.error('Failed to save task'); }
    finally { setSavingTask(false); }
  };

  const handleUpdateStatus = async (task: RewardTask, status: 'pending' | 'completed' | 'cancelled') => {
    try {
      await updateTaskStatus(task.id, status);
      if (family) {
        await logParentAction(family.id, 'REWARD_TASK_UPDATED', `Updated task ${task.title} status to ${status}`);
      }
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status } : t));
      toast.success(`Task ${status}`);
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const awaitingTasks = tasks.filter(t => t.status === 'awaiting_approval');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-accent font-medium">Earn Extra Time</p>
        <h1 className="text-3xl font-bold text-text-primary mt-1">🎁 Rewards</h1>
        {selectedChild && (
          <p className="mt-1 text-text-muted text-sm">Assign tasks for {selectedChild.name} to earn bonus screen time.</p>
        )}
      </div>

      {!selectedChildId ? (
        <div className="rounded-2xl border border-dashed border-border bg-bg-card/60 p-10 text-center">
          <p className="text-3xl mb-2">👶</p>
          <p className="text-text-primary font-semibold">No child selected</p>
          <p className="text-text-muted text-sm mt-1">Select a child from the sidebar to manage rewards.</p>
        </div>
      ) : loading ? (
        <div className="space-y-6 mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowTaskForm(true)}
              className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-bg-primary hover:bg-accent/90 transition-all"
            >
              ➕ Add Task
            </button>
          </div>

          {/* Form */}
          {showTaskForm && (
            <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5 space-y-4">
              <p className="text-sm font-semibold text-accent">📝 New Task</p>
              <div>
                <label className="text-xs text-text-muted block mb-1">Title</label>
                <input
                  value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Do homework"
                  className="w-full rounded-xl border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder-slate-500 outline-none focus:border-accent/50"
                />
              </div>
              <div>
                <label className="text-xs text-text-muted block mb-1">Description (optional)</label>
                <input
                  value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Additional details..."
                  className="w-full rounded-xl border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder-slate-500 outline-none focus:border-accent/50"
                />
              </div>
              <div>
                <label className="text-xs text-text-muted block mb-1">Target App (optional)</label>
                <select
                  value={taskAppId} onChange={(e) => setTaskAppId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary outline-none focus:border-accent/50"
                >
                  <option value="">Any App</option>
                  {apps.map(app => (
                    <option key={app.id} value={app.id}>{app.app_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-text-muted block mb-1">Reward (minutes)</label>
                <div className="flex gap-2">
                  {[15, 30, 45, 60].map(mins => (
                    <button
                      key={mins}
                      onClick={() => setTaskMinutes(mins)}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-all ${
                        taskMinutes === mins
                          ? 'bg-accent/20 border border-accent/40 text-accent'
                          : 'bg-bg-elevated border border-border text-text-muted hover:text-text-primary'
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <button onClick={handleSaveTask} disabled={savingTask || !taskTitle}
                  className="flex-1 rounded-xl bg-accent py-2 text-sm font-semibold text-bg-primary hover:bg-accent disabled:opacity-50 transition-colors">
                  {savingTask ? 'Saving…' : 'Save Task'}
                </button>
                <button onClick={() => setShowTaskForm(false)}
                  className="rounded-xl border border-border px-4 py-2 text-sm text-text-muted hover:text-text-primary transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Awaiting Approval */}
          {awaitingTasks.length > 0 && (
            <div>
              <h2 className="text-xs uppercase tracking-wider text-accent mb-3 flex items-center gap-2">
                👀 Needs Approval <span className="rounded-full bg-accent/20 text-accent px-2 py-0.5">{awaitingTasks.length}</span>
              </h2>
              <div className="space-y-2">
                {awaitingTasks.map((t) => (
                  <div key={t.id} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-accent/30 bg-accent/5 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">{t.title}</p>
                      {t.description && <p className="text-xs text-text-muted mt-0.5">{t.description}</p>}
                      <p className="text-xs text-accent mt-1 font-semibold">Reward: {t.reward_minutes} min {t.installed_apps ? `for ${t.installed_apps.app_name}` : 'for any app'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdateStatus(t, 'completed')}
                        className="rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1.5 text-xs font-medium hover:bg-green-500/30 transition-colors">
                        Approve
                      </button>
                      <button onClick={() => handleUpdateStatus(t, 'pending')}
                        className="rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 text-xs font-medium hover:bg-red-500/20 transition-colors">
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Tasks */}
          <div>
            <h2 className="text-xs uppercase tracking-wider text-text-muted mb-3 flex items-center gap-2">
              ⏳ Pending Tasks <span className="rounded-full bg-bg-elevated px-2 py-0.5 text-text-muted">{pendingTasks.length}</span>
            </h2>
            {pendingTasks.length === 0 ? (
              <p className="text-center text-slate-600 text-sm py-6 rounded-2xl border border-dashed border-border">No pending tasks</p>
            ) : (
              <div className="space-y-2">
                {pendingTasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 rounded-2xl border border-border bg-bg-card px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">{t.title}</p>
                      {t.description && <p className="text-xs text-text-muted mt-0.5">{t.description}</p>}
                      <p className="text-xs text-violet-400 font-semibold mt-1">Reward: {t.reward_minutes} min {t.installed_apps ? `for ${t.installed_apps.app_name}` : 'for any app'}</p>
                    </div>
                    <button onClick={() => handleUpdateStatus(t, 'cancelled')}
                      className="text-xs text-text-muted hover:text-red-400 transition-colors">
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div>
              <h2 className="text-xs uppercase tracking-wider text-text-muted mb-3 flex items-center gap-2">
                ✅ Completed <span className="rounded-full bg-bg-elevated px-2 py-0.5 text-text-muted">{completedTasks.length}</span>
              </h2>
              <div className="space-y-2">
                {completedTasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 rounded-2xl border border-border/50 bg-bg-card/30 px-4 py-3 opacity-70">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary line-through">{t.title}</p>
                      <p className="text-xs text-text-muted mt-0.5">Granted {t.reward_minutes} min {t.installed_apps ? `for ${t.installed_apps.app_name}` : 'for any app'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </>
      )}
    </div>
  );
}
