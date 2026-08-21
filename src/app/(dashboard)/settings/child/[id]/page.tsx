'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFamilyStore } from '@/store/familyStore';
import { updateChild, uploadChildAvatar, generatePairingCode } from '@/lib/child-service';
import { useToast } from '@/hooks/useToast';

export default function ChildDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { family, children, setChildren } = useFamilyStore();
  const { toast } = useToast();
  const child = children.find((c) => c.id === id);

  const [name, setName] = useState(child?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [pin, setPin] = useState('');
  const [pinSaving, setPinSaving] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (child) setName(child.name);
  }, [child]);

  if (!child || !family) return null;

  const handleSaveName = async () => {
    if (!name.trim() || name === child.name) return;
    setSaving(true);
    try {
      const updated = await updateChild(child.id, { name: name.trim() });
      setChildren(children.map((c) => c.id === child.id ? updated : c));
    } catch (err) { toast.error('Failed to save name'); }
    finally { setSaving(false); }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const updated = await uploadChildAvatar(child.id, file);
      setChildren(children.map((c) => c.id === child.id ? updated : c));
    } catch (err) {
      toast.error('Failed to upload avatar');
    }
  };

  const handleGenerateCode = async () => {
    setGenerating(true);
    try {
      const code = await generatePairingCode(family.id, child.id);
      setPairingCode(code);
    } catch (err) { toast.error('Failed to generate pairing code'); }
    finally { setGenerating(false); }
  };

  const handleSetPin = async () => {
    if (!pin || pin.length !== 4 || isNaN(Number(pin))) {
      toast.error('PIN must be exactly 4 digits');
      return;
    }
    setPinSaving(true);
    try {
      const msgUint8 = new TextEncoder().encode(pin);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const pinHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const updated = await updateChild(child.id, { emergency_pin_hash: pinHash });
      setChildren(children.map((c) => c.id === child.id ? updated : c));
      setPin('');
      toast.success('Emergency PIN updated');
    } catch (err) {
      toast.error('Failed to save PIN');
    } finally {
      setPinSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 space-y-6">
      <Link href="/settings" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors">
        ← Back to Settings
      </Link>

      <div className="rounded-2xl border border-border bg-bg-card overflow-hidden">
        {/* Profile Header */}
        <div className="p-8 flex flex-col items-center border-b border-border/60 text-center">
          <div className="relative group mb-4">
            <div className="w-24 h-24 rounded-full bg-bg-elevated border-4 border-slate-900 shadow-xl flex items-center justify-center text-3xl font-bold text-text-muted overflow-hidden">
              {child.avatar_url
                ? <img src={child.avatar_url} alt={child.name} className="w-full h-full object-cover" loading="lazy" />
                : child.name.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-xs font-semibold text-text-primary"
            >
              📷 Edit
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
          </div>
          
          <div className="flex items-center justify-center gap-2 max-w-full px-8">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleSaveName}
              className="bg-transparent text-2xl font-bold text-text-primary text-center w-full outline-none focus:border-b focus:border-accent transition-all border-b border-transparent placeholder-slate-500"
              placeholder="Child Name"
            />
          </div>
          {saving && <p className="text-xs text-accent mt-2">Saving…</p>}
        </div>

        {/* Device Status & Pairing */}
        <div className="p-8 space-y-6">
          <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">📱 Device Status</h2>
          
          {child.device_id ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-xl">✅</div>
                <div>
                  <p className="text-sm font-bold text-emerald-400">Device Linked</p>
                  <p className="text-xs text-text-muted mt-1">{child.device_name ?? 'Unknown Device'} • {child.os_type ?? 'Android'}</p>
                  {child.last_seen_at && (
                    <p className="text-xs text-text-muted mt-0.5">Last seen: {new Date(child.last_seen_at).toLocaleString()}</p>
                  )}
                </div>
              </div>

              {/* Re-pair section */}
              <div className="rounded-xl border border-border bg-bg-elevated/50 p-4">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">📲 Re-pair Device</p>
                <p className="text-xs text-text-muted mb-3">
                  Need to set up the child app again? Generate a new pairing code below.
                </p>
                {pairingCode ? (
                  <div className="bg-bg-card border border-border rounded-xl p-4 text-center">
                    <p className="text-xs text-text-muted mb-1 uppercase tracking-widest font-semibold">Pairing Code</p>
                    <p className="text-3xl font-mono font-bold tracking-widest text-text-primary mb-1">{pairingCode}</p>
                    <p className="text-xs text-amber-400">Enter this on the child's device · Expires in 24 hours</p>
                  </div>
                ) : (
                  <button
                    onClick={handleGenerateCode}
                    disabled={generating}
                    className="rounded-xl border border-accent/40 bg-accent/10 py-2 px-5 text-sm font-semibold text-accent hover:bg-accent/20 transition-colors disabled:opacity-50"
                  >
                    {generating ? 'Generating…' : '🔁 Generate New Code'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 text-center">
              <div className="text-3xl mb-3">📱</div>
              <p className="text-base font-bold text-amber-400">No Device Linked</p>
              <p className="text-sm text-text-muted mt-1 mb-5">Install Guardian on your child's device and enter a pairing code to link it.</p>
              
              {pairingCode ? (
                <div className="bg-bg-card border border-border rounded-xl p-4 inline-block">
                  <p className="text-xs text-text-muted mb-2 uppercase tracking-widest font-semibold">Pairing Code</p>
                  <p className="text-4xl font-mono font-bold tracking-widest text-text-primary mb-2">{pairingCode}</p>
                  <p className="text-xs text-amber-400">Expires in 24 hours</p>
                </div>
              ) : (
                <button
                  onClick={handleGenerateCode}
                  disabled={generating}
                  className="rounded-xl bg-amber-500 py-2.5 px-6 text-sm font-bold text-bg-primary hover:bg-amber-400 transition-colors disabled:opacity-50 inline-block"
                >
                  {generating ? 'Generating…' : 'Generate Code'}
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Emergency PIN */}
        <div className="p-8 border-t border-border/60">
          <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-1">🚨 Emergency Override PIN</h2>
          <p className="text-xs text-text-muted mb-1">Set a 4-digit PIN that your child can use to temporarily suspend restrictions in an emergency.</p>
          <p className="text-xs text-text-muted/80 mb-4 italic">Note: For security, your PIN is securely hashed. We cannot show it to you after it is saved. If you forget it, simply enter a new one below.</p>
          
          <div className="flex items-center gap-3">
            <div className="relative flex items-center">
              <input
                type={showPin ? "text" : "password"}
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="0000"
                className="bg-bg-elevated border border-border rounded-xl pl-4 pr-10 py-2.5 text-text-primary text-center tracking-[0.5em] w-36 focus:border-accent outline-none"
              />
              <button
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 text-lg opacity-60 hover:opacity-100"
                title={showPin ? "Hide PIN" : "Show PIN"}
              >
                {showPin ? '🙈' : '👁️'}
              </button>
            </div>
            <button
              onClick={handleSetPin}
              disabled={pinSaving || pin.length !== 4}
              className="rounded-xl bg-accent py-2.5 px-6 text-sm font-bold text-white hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:bg-bg-elevated disabled:text-text-muted"
            >
              {pinSaving ? 'Saving…' : 'Save PIN'}
            </button>
            {child.emergency_pin_hash && (
              <span className="text-xs font-semibold text-emerald-400">✅ Configured</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
