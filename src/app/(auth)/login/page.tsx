import { AuthForm } from '@/components/auth/AuthForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4 text-text-primary">
      <div className="w-full max-w-md rounded-2xl border border-border bg-bg-card p-8 shadow-2xl shadow-black/30">
        <p className="text-sm uppercase tracking-[0.3em] text-accent">Guardian Web</p>
        <h1 className="mt-3 text-2xl font-semibold">Parent Sign In</h1>
        <p className="mt-2 text-sm text-text-muted">Sign in to your GuardianApp parent account.</p>
        <AuthForm mode="login" />
      </div>
    </div>
  );
}
