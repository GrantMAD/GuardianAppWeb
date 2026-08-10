'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { createFamily, addChild } from '@/lib/child-service';
import { useFamilyStore } from '@/store/familyStore';

export default function OnboardingPage() {
  const router = useRouter();
  const { setFamily, setChildren, setSelectedChildId } = useFamilyStore();
  
  const [step, setStep] = useState(1);
  const [familyName, setFamilyName] = useState('');
  const [childName, setChildName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill family name from auth metadata
  useEffect(() => {
    supabase?.auth.getUser().then(({ data }) => {
      if (data.user?.user_metadata?.family_name) {
        setFamilyName(data.user.user_metadata.family_name);
      }
    });
  }, []);

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyName.trim()) return;
    
    setLoading(true);
    setError('');
    try {
      const fam = await createFamily(familyName.trim());
      // After creating, we mark onboarding as completed locally first, 
      // but actually the DB trigger usually handles this, or we just trust the return.
      // Wait, in `createFamily` it returns the family.
      // But onboarding means we should update `has_completed_onboarding = true`.
      // Let's do that.
      await supabase!.from('families').update({ has_completed_onboarding: true }).eq('id', fam.id);
      
      setFamily({ ...fam, has_completed_onboarding: true });
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to setup family');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    setLoading(true);
    setError('');
    try {
      if (childName.trim()) {
        const { family } = useFamilyStore.getState();
        if (family) {
          const child = await addChild(family.id, childName.trim());
          setChildren([child]);
          setSelectedChildId(child.id);
        }
      }
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to add child');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-6 text-text-primary relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent/20 text-accent mb-4 text-2xl shadow-[0_0_30px_rgba(6,182,212,0.3)]">
            ✨
          </div>
          <h1 className="text-3xl font-bold">Welcome to Guardian</h1>
          <p className="text-text-muted mt-2">Let's set up your family account.</p>
        </div>

        <div className="rounded-2xl border border-border bg-bg-card/80 backdrop-blur-xl p-8 shadow-2xl">
          {/* Progress indicators */}
          <div className="flex gap-2 mb-8">
            <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-accent' : 'bg-bg-elevated'}`} />
            <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-accent' : 'bg-bg-elevated'}`} />
          </div>

          {step === 1 ? (
            <form onSubmit={handleCreateFamily} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Family Name</label>
                <input
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="e.g. The Smiths"
                  disabled={loading}
                  className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3.5 text-text-primary placeholder-slate-500 outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                  autoFocus
                />
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <button
                type="submit"
                disabled={loading || !familyName.trim()}
                className="w-full rounded-xl bg-accent py-3.5 text-sm font-bold text-bg-primary hover:bg-accent disabled:opacity-50 transition-colors shadow-lg shadow-accent/20"
              >
                {loading ? 'Continuing…' : 'Continue'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleFinish} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">First Child's Name (Optional)</label>
                <p className="text-xs text-text-muted mb-4">You can add your child now, or do it later from the dashboard settings.</p>
                <input
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="e.g. Alex"
                  disabled={loading}
                  className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3.5 text-text-primary placeholder-slate-500 outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                  autoFocus
                />
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleFinish()}
                  disabled={loading}
                  className="flex-1 rounded-xl border border-border py-3.5 text-sm font-semibold text-text-primary hover:text-text-primary hover:border-text-muted transition-colors disabled:opacity-50"
                >
                  Skip for now
                </button>
                <button
                  type="submit"
                  disabled={loading || !childName.trim()}
                  className="flex-1 rounded-xl bg-accent py-3.5 text-sm font-bold text-bg-primary hover:bg-accent disabled:opacity-50 transition-colors shadow-lg shadow-accent/20"
                >
                  {loading ? 'Finishing…' : 'Finish Setup'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
