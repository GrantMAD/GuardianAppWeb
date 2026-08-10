import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/settings" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors">
        ← Back to Settings
      </Link>
      <div className="rounded-2xl border border-border bg-bg-card p-8 space-y-4 text-text-primary">
        <h1 className="text-2xl font-bold text-text-primary">Terms of Service</h1>
        <p className="text-xs text-text-muted">Last updated: August 2026</p>
        <p className="text-sm leading-relaxed">
          By using Guardian Web, you agree to configure restrictions responsibly for devices owned or managed within your family unit.
        </p>
      </div>
    </div>
  );
}
