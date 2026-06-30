import { JobStatus } from '@url-checker/shared';

const bootstrapStatuses = [JobStatus.pending, JobStatus.inProgress];

export function App() {
  return (
    <main>
      <h1>URL Checker</h1>
      <p>Monorepo bootstrap is ready.</p>
      <p>{bootstrapStatuses.length} contract statuses imported from shared.</p>
    </main>
  );
}
