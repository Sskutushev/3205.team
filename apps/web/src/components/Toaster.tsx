import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useToastStore } from '../store/toasts.js';

export function Toaster() {
  const { t } = useTranslation();
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <div aria-live="polite" className="toaster">
      {toasts.map((toast) => (
        <div
          className={`toast toast-${toast.variant}`}
          key={toast.id}
          role="status"
        >
          <span className="toast-icon">
            {toast.variant === 'success' ? (
              <CheckCircle2 size={18} strokeWidth={2.4} />
            ) : (
              <AlertCircle size={18} strokeWidth={2.4} />
            )}
          </span>
          <p className="toast-message">{t(toast.messageKey)}</p>
          <button
            aria-label={t('toast.dismiss')}
            className="toast-close"
            onClick={() => dismiss(toast.id)}
            type="button"
          >
            <X size={16} strokeWidth={2.4} />
          </button>
        </div>
      ))}
    </div>
  );
}
