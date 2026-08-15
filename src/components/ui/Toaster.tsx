'use client';

import { useToast } from '@/hooks/useToast';
import type { Toast, ToastType } from '@/hooks/useToast';

const STYLES: Record<ToastType, { border: string; icon: string; iconBg: string; bar: string }> = {
  success: {
    border: 'border-l-emerald-400',
    icon: '✓',
    iconBg: 'bg-emerald-400/15 text-emerald-400',
    bar:  'bg-emerald-400',
  },
  error: {
    border: 'border-l-red-400',
    icon: '✕',
    iconBg: 'bg-red-400/15 text-red-400',
    bar:  'bg-red-400',
  },
  info: {
    border: 'border-l-accent',
    icon: 'ℹ',
    iconBg: 'bg-accent/15 text-accent',
    bar:  'bg-accent',
  },
};

function ToastCard({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const s = STYLES[toast.type];
  return (
    <div
      className={`
        relative flex items-start gap-3 w-80 rounded-2xl border border-border border-l-4
        bg-bg-card/95 backdrop-blur-xl shadow-xl px-4 py-3
        animate-[toast-slide-in_0.25s_ease-out]
        ${s.border}
      `}
      role="alert"
    >
      {/* Icon */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${s.iconBg}`}>
        {s.icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-sm font-semibold text-text-primary leading-snug">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-text-muted mt-0.5 leading-snug">{toast.message}</p>
        )}
      </div>

      {/* Close */}
      <button
        onClick={onClose}
        className="text-text-muted hover:text-text-primary transition-colors text-lg leading-none mt-0.5 flex-shrink-0"
        aria-label="Dismiss"
      >
        ×
      </button>

      {/* Progress bar — drains over 4 s via CSS animation */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl overflow-hidden">
        <div
          className={`h-full ${s.bar} animate-[toast-drain_4s_linear_forwards]`}
          style={{ transformOrigin: 'left' }}
        />
      </div>
    </div>
  );
}

export function Toaster() {
  const { toasts, removeToast } = useToast();

  return (
    <>
      {/* Keyframe injection */}
      <style>{`
        @keyframes toast-slide-in {
          from { opacity: 0; transform: translateX(1.5rem); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes toast-drain {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>

      <div
        aria-live="polite"
        className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastCard toast={t} onClose={() => removeToast(t.id)} />
          </div>
        ))}
      </div>
    </>
  );
}
