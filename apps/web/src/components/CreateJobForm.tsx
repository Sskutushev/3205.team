import { Play, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '../i18n/I18nProvider.js';

type CreateJobFormProps = {
  disabled: boolean;
  onSubmit: (rawInput: string) => Promise<void>;
};

const SAMPLE_URLS = [
  'https://example.com',
  'https://developer.mozilla.org',
].join('\n');

export function CreateJobForm({ disabled, onSubmit }: CreateJobFormProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState(SAMPLE_URLS);

  return (
    <section className="panel create-panel">
      <div className="panel-header">
        <p className="eyebrow">
          <Plus size={13} strokeWidth={2.6} />
          {t('create.eyebrow')}
        </p>
        <h2>{t('create.title')}</h2>
      </div>
      <form
        className="create-form"
        onSubmit={async (event) => {
          event.preventDefault();
          await onSubmit(value);
        }}
      >
        <label className="field">
          <span>{t('create.label')}</span>
          <textarea
            name="urls"
            onChange={(event) => setValue(event.target.value)}
            placeholder={t('create.placeholder')}
            spellCheck={false}
            value={value}
          />
        </label>
        <p className="field-hint">{t('create.hint')}</p>
        <button className="primary-button" disabled={disabled} type="submit">
          <Play size={16} strokeWidth={2.6} />
          {disabled ? t('create.submitting') : t('create.submit')}
        </button>
      </form>
    </section>
  );
}
