import { Ban } from 'lucide-react';
import { JobStatus } from '@url-checker/shared';
import { useTranslation } from '../i18n/I18nProvider.js';

type CancelButtonProps = {
  disabled: boolean;
  status: JobStatus;
  onCancel: () => Promise<void>;
};

export function CancelButton({
  disabled,
  status,
  onCancel,
}: CancelButtonProps) {
  const { t } = useTranslation();
  const canCancel =
    status === JobStatus.pending || status === JobStatus.inProgress;

  if (!canCancel) {
    return null;
  }

  return (
    <button
      className="secondary-button"
      disabled={disabled}
      onClick={() => void onCancel()}
      type="button"
    >
      <Ban size={15} strokeWidth={2.4} />
      {disabled ? t('details.cancelling') : t('details.cancel')}
    </button>
  );
}
