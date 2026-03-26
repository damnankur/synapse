import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X, Coins } from 'lucide-react';
import { Toast, ToastVariant } from '../types';

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const variantConfig: Record<
  ToastVariant,
  { icon: React.ReactNode; bg: string; border: string; iconColor: string; titleColor: string }
> = {
  success: {
    icon: <CheckCircle2 size={18} />,
    bg: 'bg-white',
    border: 'border-l-4 border-l-[#17A2B8]',
    iconColor: 'text-[#17A2B8]',
    titleColor: 'text-[#003D7A]',
  },
  error: {
    icon: <XCircle size={18} />,
    bg: 'bg-white',
    border: 'border-l-4 border-l-red-500',
    iconColor: 'text-red-500',
    titleColor: 'text-red-700',
  },
  info: {
    icon: <Info size={18} />,
    bg: 'bg-white',
    border: 'border-l-4 border-l-[#003D7A]',
    iconColor: 'text-[#003D7A]',
    titleColor: 'text-[#003D7A]',
  },
  warning: {
    icon: <AlertTriangle size={18} />,
    bg: 'bg-white',
    border: 'border-l-4 border-l-amber-500',
    iconColor: 'text-amber-500',
    titleColor: 'text-amber-700',
  },
};

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  const cfg = variantConfig[toast.variant];

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-xl shadow-xl ${cfg.bg} ${cfg.border}
        transition-all duration-300 ease-out max-w-sm w-full
        ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}
      `}
      style={{ minWidth: 300 }}
    >
      <span className={`mt-0.5 flex-shrink-0 ${cfg.iconColor}`}>{cfg.icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${cfg.titleColor}`}>{toast.title}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{toast.message}</p>
        {toast.tokenDelta !== undefined && (
          <div
            className={`
              mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold
              ${toast.tokenDelta > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}
            `}
          >
            <Coins size={11} />
            <span>
              {toast.tokenDelta > 0 ? `+${toast.tokenDelta}` : toast.tokenDelta} tokens
            </span>
          </div>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
