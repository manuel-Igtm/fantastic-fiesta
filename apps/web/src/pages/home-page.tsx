import { useCallback } from 'react';

import { useAuth } from '../context/auth-context';
import { SaveSabiApi } from '../lib/api';
import { useQuery } from '../lib/query';
import { EmptyState } from '../components/ui/empty-state';
import { StatusCard } from '../components/ui/status-card';
import { DataTable } from '../components/ui/data-table';
import type { AlertItem, Goal, TransactionSummary } from '../types';

export function HomePage() {
  const { accessToken } = useAuth();

  const loadSummary = useCallback(async () => {
    if (!accessToken) {
      return null;
    }
    return new SaveSabiApi(() => accessToken).transactionSummary();
  }, [accessToken]);

  const loadGoals = useCallback(async () => {
    if (!accessToken) {
      return [] as Goal[];
    }
    return new SaveSabiApi(() => accessToken).listGoals();
  }, [accessToken]);

  const loadAlerts = useCallback(async () => {
    if (!accessToken) {
      return [] as AlertItem[];
    }
    return new SaveSabiApi(() => accessToken).listAlerts();
  }, [accessToken]);

  const txSummary = useQuery<TransactionSummary | null>(loadSummary);
  const goals = useQuery<Goal[]>(loadGoals);
  const alerts = useQuery<AlertItem[]>(loadAlerts);

  const completedGoals = goals.data?.filter((goal) => goal.status === 'completed').length ?? 0;

  return (
    <section className="stack">
      <header className="section-header">
        <h1>Home Dashboard</h1>
        <p>Track key momentum indicators across spending, goals, and risk alerts.</p>
      </header>

      <div className="grid cards-grid">
        <StatusCard
          title="Net Cash Flow (30d)"
          value={
            txSummary.data ? `${txSummary.data.netCashFlow.toLocaleString()} ${txSummary.data.window.to}` : '-'
          }
          subtitle="Inflow minus outflow from recent window"
        />
        <StatusCard
          title="Hara Hachi Bu Ratio"
          value={txSummary.data ? `${(txSummary.data.haraHachiBuRatio * 100).toFixed(1)}%` : '-'}
          subtitle="Essential spend proportion"
          tone="accent"
        />
        <StatusCard
          title="Goals"
          value={`${goals.data?.length ?? 0}`}
          subtitle={`${completedGoals} completed`}
          tone="success"
        />
        <StatusCard
          title="Open Alerts"
          value={`${alerts.data?.filter((alert) => alert.status === 'open').length ?? 0}`}
          subtitle="Requires review"
          tone="warning"
        />
      </div>

      <div className="panel">
        <h2>Latest Alerts</h2>
        {alerts.data && alerts.data.length > 0 ? (
          <DataTable
            title="Recent alert signals"
            columns={[
              { key: 'type', title: 'Type', render: (row) => row.alertType },
              { key: 'severity', title: 'Severity', render: (row) => row.severity },
              { key: 'message', title: 'Message', render: (row) => row.message },
              { key: 'status', title: 'Status', render: (row) => row.status }
            ]}
            rows={alerts.data.slice(0, 8)}
          />
        ) : (
          <EmptyState title="No alerts" body="Detected anomalies and feedback items appear here." />
        )}
      </div>
    </section>
  );
}
