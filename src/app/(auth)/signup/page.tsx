import { AuthForm } from '@/components/auth/AuthForm';

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-black/30">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Guardian Web</p>
        <h1 className="mt-3 text-2xl font-semibold">Create Parent Account</h1>
        <p className="mt-2 text-sm text-slate-400">Create an account to manage your family from the web.</p>
        <AuthForm mode="signup" />
      </div>
    </div>
  );
}
