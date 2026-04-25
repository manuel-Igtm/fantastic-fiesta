import { FormEvent, useMemo, useState } from 'react';

import { useAuth } from '../context/auth-context';
import { ApiError, SaveSabiApi } from '../lib/api';
import { Connection, TransactionItem } from '../types';
import { DataTable } from '../components/ui/data-table';
import { EmptyState } from '../components/ui/empty-state';
import { StatusCard } from '../components/ui/status-card';

type ConnectionFormState = {
  providerType: 'bank' | 'mpesa' | 'airtel' | 'equitel' | 'manual' | 'crypto';
  accountName: string;
  providerAccountRef: string;
  accountMask: string;
};

const initialConnectionForm: ConnectionFormState = {
  providerType: 'bank',
  accountName: '',
  providerAccountRef: '',
  accountMask: ''
};

export function WalletsPage() {
  const { accessToken } = useAuth();
  const apiClient = useMemo(() => new SaveSabiApi(() => accessToken), [accessToken]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState<ConnectionFormState>(initialConnectionForm);

  const load = async () => {
    try {
      setLoading(true);
      const [connectionsResponse, transactionsResponse] = await Promise.all([
        apiClient.listConnections(),
        apiClient.listTransactions()
      ]);
      setConnections(connectionsResponse);
      setTransactions(transactionsResponse);
      setError(null);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load wallets data';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConnection = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await apiClient.callbackConnection({
        providerType: formState.providerType,
        providerAccountRef: formState.providerAccountRef || `manual-${Date.now()}`,
        accountName: formState.accountName,
        accountMask: formState.accountMask || undefined
      });
      setFormState(initialConnectionForm);
      await load();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Unable to connect account at this time.';
      setError(message);
    }
  };

  const handleDeleteConnection = async (connectionId: string) => {
    try {
      await apiClient.deleteConnection(connectionId);
      await load();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to remove connection';
      setError(message);
    }
  };

  if (!accessToken) {
    return (
      <section className="page-section">
        <header className="section-header">
          <h1>Wallets</h1>
        </header>
        <EmptyState title="Sign in required" body="Authenticate first to connect and view wallets." />
      </section>
    );
  }

  return (
    <section className="page-section">
      <header className="section-header">
        <h1>Wallets</h1>
        <p>Connect bank and mobile money sources, then monitor incoming transactions.</p>
      </header>

      {error ? <p className="error-banner">{error}</p> : null}

      <div className="grid-two">
        <StatusCard
          title="Active Connections"
          subtitle="Sources currently linked to your Save Sabi profile."
          value={String(connections.length)}
        />
        <StatusCard
          title="Latest Transactions"
          subtitle="Recent feed entries pulled from linked accounts."
          value={String(transactions.length)}
        />
      </div>

      <div className="panel">
        <h2>Connect a Source</h2>
        <form className="form-grid" onSubmit={handleCreateConnection}>
          <label>
            Provider
            <select
              value={formState.providerType}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  providerType: event.target.value as ConnectionFormState['providerType']
                }))
              }
            >
              <option value="bank">Bank</option>
              <option value="mpesa">M-Pesa</option>
              <option value="airtel">Airtel Money</option>
              <option value="equitel">Equitel</option>
              <option value="manual">Manual</option>
              <option value="crypto">Crypto</option>
            </select>
          </label>
          <label>
            Account Name
            <input
              value={formState.accountName}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  accountName: event.target.value
                }))
              }
              required
            />
          </label>
          <label>
            Provider Ref
            <input
              value={formState.providerAccountRef}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  providerAccountRef: event.target.value
                }))
              }
            />
          </label>
          <label>
            Account Mask
            <input
              value={formState.accountMask}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  accountMask: event.target.value
                }))
              }
              placeholder="****1234"
            />
          </label>
          <button type="submit" className="primary-button">
            Add Connection
          </button>
        </form>
      </div>

      <div className="panel">
        <h2>Connected Sources</h2>
        {loading ? (
          <p>Loading connections...</p>
        ) : connections.length === 0 ? (
          <EmptyState title="No sources connected" body="Link your first wallet to start syncing transactions." />
        ) : (
          <DataTable
            title="Connected accounts"
            columns={[
              { key: 'provider', title: 'Provider', render: (row) => row.providerType.toUpperCase() },
              { key: 'name', title: 'Account', render: (row) => row.accountName },
              { key: 'mask', title: 'Mask', render: (row) => row.accountMask ?? '-' },
              { key: 'status', title: 'Status', render: (row) => (row.isActive ? 'Active' : 'Inactive') },
              {
                key: 'actions',
                title: 'Actions',
                render: (row) => (
                  <button
                    className="text-button"
                    onClick={() => void handleDeleteConnection(row.id)}
                    type="button"
                  >
                    Remove
                  </button>
                )
              }
            ]}
            rows={connections}
          />
        )}
      </div>

      <div className="panel">
        <h2>Transactions Feed</h2>
        {loading ? (
          <p>Loading transactions...</p>
        ) : transactions.length === 0 ? (
          <EmptyState title="No transactions yet" body="Once wallets sync, transactions will appear here." />
        ) : (
          <DataTable
            title="Recent transactions"
            columns={[
              { key: 'date', title: 'Date', render: (row) => new Date(row.occurredAt).toLocaleDateString() },
              { key: 'direction', title: 'Direction', render: (row) => row.direction },
              { key: 'amount', title: 'Amount', render: (row) => `${row.currency} ${Number(row.amount).toFixed(2)}` },
              { key: 'merchant', title: 'Merchant', render: (row) => row.merchant ?? '-' },
              { key: 'category', title: 'Category', render: (row) => row.category?.name ?? 'Uncategorized' }
            ]}
            rows={transactions.slice(0, 20)}
          />
        )}
      </div>
    </section>
  );
}
