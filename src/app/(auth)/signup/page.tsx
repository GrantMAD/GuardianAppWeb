import { AuthForm } from '@/components/auth/AuthForm';

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4 text-text-primary">
      <div className="w-full max-w-md rounded-2xl border border-border bg-bg-card p-8 shadow-2xl shadow-black/30">
        <p className="text-sm uppercase tracking-[0.3em] text-accent">Guardian Web</p>
        <h1 className="mt-3 text-2xl font-semibold">Create Parent Account</h1>
        <p className="mt-2 text-sm text-text-muted">Create an account to manage your family from the web.</p>
        <AuthForm mode="signup" />
      </div>
    </div>
  );
}
