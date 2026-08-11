'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFamilyStore } from '@/store/familyStore';
import { addChild, generatePairingCode } from '@/lib/child-service';
import { logParentAction } from '@/lib/parent-service';

export default function AddChildPage() {
  const router = useRouter();
  const { family, children, setChildren, setSelectedChildId } = useFamilyStore();
  
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [pairingCode, setPairingCode] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!family || !name.trim()) return;

    setSaving(true);
    try {
      const newChild = await addChild(family.id, name.trim());
      const code = await generatePairingCode(family.id, newChild.id);
      
      // Update global store
      setChildren([...children, newChild]);
      setSelectedChildId(newChild.id);
      
      // Audit log
      await logParentAction(family.id, 'CHILD_ADDED', `Added child profile for ${newChild.name}`);
      
      setPairingCode(code);
    } catch (err) {
      console.error(err);
      alert('Failed to add child.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto py-8">
      {/* Header */}
      <div>
        <Link href="/settings" className="text-sm text-text-muted hover:text-text-primary transition-colors inline-block mb-4">
          ← Back to Settings
        </Link>
        <p className="text-xs uppercase tracking-[0.3em] text-accent font-medium">Family Management</p>
        <h1 className="text-3xl font-bold text-text-primary mt-1">👶 Add Child</h1>
        <p className="mt-1 text-text-muted text-sm">Create a profile for your child to monitor their device usage.</p>
      </div>

      {!pairingCode ? (
        <form onSubmit={handleSubmit} className="rounded-3xl border border-border bg-bg-card p-6 md:p-8 space-y-6 shadow-xl shadow-black/50">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">Child's Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex"
              required
              className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-text-primary placeholder-slate-500 outline-none focus:border-accent"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <Link href="/settings" className="flex-1 text-center rounded-xl border border-border px-4 py-3 font-semibold text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-[2] rounded-xl bg-accent py-3 font-semibold text-bg-primary hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Creating…' : 'Create Profile'}
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-3xl border border-accent/30 bg-accent/5 p-8 text-center space-y-6 shadow-xl shadow-accent/10">
          <div className="w-20 h-20 mx-auto rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center text-4xl text-accent">
            🎉
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Child Added Successfully!</h2>
            <p className="mt-2 text-text-muted">
              Download the Guardian App on <strong>{name}</strong>'s device and enter this connection code.
            </p>
          </div>
          
          <div className="bg-bg-card border border-border rounded-2xl p-6">
            <p className="text-xs uppercase tracking-widest text-text-muted mb-2 font-semibold">Connection Code</p>
            <p className="text-5xl font-mono font-bold tracking-[0.2em] text-text-primary">
              {pairingCode}
            </p>
            <p className="text-xs text-text-muted mt-3">This code expires in 15 minutes.</p>
          </div>

          <div className="pt-4">
            <button
              onClick={() => router.push('/settings')}
              className="w-full rounded-xl bg-accent py-3 font-semibold text-bg-primary hover:bg-accent/90 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
