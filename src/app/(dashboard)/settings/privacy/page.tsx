import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/settings" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
        ← Back to Settings
      </Link>
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 space-y-4 text-slate-300">
        <h1 className="text-2xl font-bold text-white">Privacy Policy</h1>
        <p className="text-xs text-slate-500">Last updated: August 2026</p>
        <p className="text-sm leading-relaxed">
          Guardian takes family privacy seriously. App usage logs and device restrictions are encrypted and only accessible by authorized family accounts. We do not sell or share family usage data with third parties.
        </p>
      </div>
    </div>
  );
}
