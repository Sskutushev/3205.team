import { JobStatus } from '@url-checker/shared';

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
      Cancel job
    </button>
  );
}
