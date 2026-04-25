import { EmptyState } from '../components/ui/empty-state';

export function VaultPage() {
  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <h1>Vault</h1>
          <p>Secure storage for sensitive financial files and references.</p>
        </div>
      </header>
      <section className="panel">
        <EmptyState
          title="Vault integration is scaffolded"
          body="Secure upload/download and client-side hardening controls will be completed in the security implementation phase."
        />
      </section>
    </section>
  );
}
