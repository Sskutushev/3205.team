import { useState } from 'react';

type CreateJobFormProps = {
  disabled: boolean;
  onSubmit: (rawInput: string) => Promise<void>;
};

const SAMPLE_URLS = [
  'https://example.com',
  'https://developer.mozilla.org',
].join('\n');

export function CreateJobForm({ disabled, onSubmit }: CreateJobFormProps) {
  const [value, setValue] = useState(SAMPLE_URLS);

  return (
    <section className="panel panel-accent">
      <div className="panel-header">
        <p className="eyebrow">Create Job</p>
        <h2>Queue a new URL health scan</h2>
      </div>
      <form
        className="stack-lg"
        onSubmit={async (event) => {
          event.preventDefault();
          await onSubmit(value);
        }}
      >
        <label className="field">
          <span>One URL per line</span>
          <textarea
            name="urls"
            onChange={(event) => setValue(event.target.value)}
            placeholder="https://example.com"
            rows={8}
            value={value}
          />
        </label>
        <button className="primary-button" disabled={disabled} type="submit">
          {disabled ? 'Submitting...' : 'Run checks'}
        </button>
      </form>
    </section>
  );
}
