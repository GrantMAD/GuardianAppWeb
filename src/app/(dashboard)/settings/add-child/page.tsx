'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFamilyStore } from '@/store/familyStore';
import { addChild } from '@/lib/child-service';

export default function AddChildPage() {
  const router = useRouter();
  const { family, children, setChildren, setSelectedChildId } = useFamilyStore();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!family) {
      setError('Family not found');
      return;
    }
    if (!name.trim()) return;

    setLoading(true);
    setError('');
    try {
      const newChild = await addChild(family.id, name.trim());
      setChildren([...children, newChild]);
      setSelectedChildId(newChild.id);
      router.push(`/settings/child/${newChild.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to add child');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-12">
      <Link href="/settings" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-8">
        ← Back to Settings
      </Link>

      <div className="rounded-2xl border border-border bg-bg-card p-8 shadow-xl shadow-black/50">
        <h1 className="text-2xl font-bold text-text-primary">Add a Child Profile</h1>
        <p className="mt-2 text-sm text-text-muted mb-8">
          Create a profile for your child. You'll be able to pair their device in the next step.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Child's Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex"
              disabled={loading}
              className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-text-primary placeholder-slate-500 outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all disabled:opacity-50"
              autoFocus
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full rounded-xl bg-accent py-3.5 text-sm font-bold text-bg-primary hover:bg-accent disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating…' : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
