import { FormEvent, useMemo, useState } from 'react';

import { DataTable } from '../components/ui/data-table';
import { EmptyState } from '../components/ui/empty-state';
import { StatusCard } from '../components/ui/status-card';
import { useAuth } from '../context/auth-context';
import { ApiError, runScenario, SaveSabiApi } from '../lib/api';
import { useQuery } from '../lib/query';
import type { AlertItem, ReportItem, TransactionSummary } from '../types';

type ScenarioResult = {
  recommendation: string;
  safer_alternatives: string[];
  action_plan: string[];
  explainability: string;
  generated_at: string;
};

type ReportForm = {
  reportType: 'monthly_statement' | 'goal_performance' | 'behavior_trend';
  periodStart: string;
  periodEnd: string;
};

const aiLanguageByUiLanguage = (value: 'en' | 'sw'): 'en' | 'sw' => value;

export function InsightsPage() {
  const { accessToken, me } = useAuth();
  const api = useMemo(() => new SaveSabiApi(() => accessToken), [accessToken]);

  const [reportForm, setReportForm] = useState<ReportForm>({
    reportType: 'monthly_statement',
    periodStart: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().slice(0, 10),
    periodEnd: new Date().toISOString().slice(0, 10)
  });
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportMessage, setReportMessage] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [scenarioPrompt, setScenarioPrompt] = useState('Can I afford a business trip this month?');
  const [scenarioResult, setScenarioResult] = useState<ScenarioResult | null>(null);
  const [scenarioError, setScenarioError] = useState<string | null>(null);
  const [isScenarioLoading, setIsScenarioLoading] = useState(false);

  const summaryQuery = useQuery<TransactionSummary>(() => api.transactionSummary(), [api]);
  const reportsQuery = useQuery<ReportItem[]>(() => api.listReports(), [api]);
  const alertsQuery = useQuery<AlertItem[]>(() => api.listAlerts(), [api]);

  const cashflowTone = useMemo(() => {
    if (!summaryQuery.data) {
      return 'neutral' as const;
    }
    return summaryQuery.data.netCashFlow >= 0 ? ('positive' as const) : ('negative' as const);
  }, [summaryQuery.data]);

  const spendRatio = useMemo(() => {
    if (!summaryQuery.data) {
      return 0;
    }
    return Math.round(summaryQuery.data.haraHachiBuRatio * 100);
  }, [summaryQuery.data]);

  const handleGenerateReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsGeneratingReport(true);
    setReportError(null);
    setReportMessage(null);
    try {
      const generated = await api.generateReport({
        reportType: reportForm.reportType,
        periodStart: new Date(reportForm.periodStart).toISOString(),
        periodEnd: new Date(reportForm.periodEnd).toISOString()
      });
      setReportMessage(`Report ${generated.reportType} created successfully.`);
      await reportsQuery.refetch();
    } catch (error) {
      if (error instanceof ApiError) {
        setReportError(error.message);
      } else {
        setReportError('Unable to generate report.');
      }
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleAiScenario = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setScenarioError(null);
    setIsScenarioLoading(true);
    try {
      const summary = summaryQuery.data;
      if (!summary) {
        throw new Error('Cashflow summary unavailable');
      }

      const result = await runScenario({
        prompt: scenarioPrompt,
        language: aiLanguageByUiLanguage((me?.preferredLanguage ?? 'en') as 'en' | 'sw'),
        monthly_income: summary.inflow,
        monthly_expenses: summary.outflow,
        goal_commitments: Math.max(0, summary.outflow * 0.2)
      });
      setScenarioResult(result);
    } catch (error) {
      if (error instanceof ApiError) {
        setScenarioError(error.message);
      } else {
        setScenarioError('Unable to run AI scenario right now.');
      }
    } finally {
      setIsScenarioLoading(false);
    }
  };

  return (
    <section className="page-section">
      <header className="page-header">
        <div>
          <h1>Insights</h1>
          <p>Understand your spending behavior, alerts, and forecast decisions with AI coaching.</p>
        </div>
      </header>

      <div className="card-grid">
        <StatusCard
          title="Net Cashflow"
          value={
            summaryQuery.data
              ? `${summaryQuery.data.netCashFlow >= 0 ? '+' : ''}${summaryQuery.data.netCashFlow.toLocaleString()}`
              : '...'
          }
          tone={cashflowTone === 'positive' ? 'success' : cashflowTone === 'negative' ? 'accent' : 'primary'}
          subtitle="Last 30-day trend from transactions summary."
        />
        <StatusCard
          title="80/20 Discipline"
          value={`${spendRatio}% essential`}
          tone={spendRatio >= 80 ? 'success' : 'warning'}
          subtitle="Target is at least 80% essentials (Hara Hachi Bu)."
        />
        <StatusCard
          title="Open Alerts"
          value={String(alertsQuery.data?.filter((item) => item.status !== 'resolved').length ?? 0)}
          tone="warning"
          subtitle="Requires review and disposition feedback."
        />
      </div>

      <div className="two-column-grid">
        <article className="surface-card">
          <h2>AI Scenario Coach</h2>
          <p>Ask affordability questions backed by your current inflow/outflow profile.</p>
          <form className="stack-form" onSubmit={handleAiScenario}>
            <label>
              Scenario prompt
              <textarea
                value={scenarioPrompt}
                onChange={(event) => setScenarioPrompt(event.target.value)}
                rows={3}
                required
              />
            </label>
            {scenarioError ? <p className="form-error">{scenarioError}</p> : null}
            <button className="primary-button" type="submit" disabled={isScenarioLoading || summaryQuery.isLoading}>
              {isScenarioLoading ? 'Running scenario...' : 'Run AI scenario'}
            </button>
          </form>

          {scenarioResult ? (
            <div className="insight-result">
              <h3>Recommendation</h3>
              <p>{scenarioResult.recommendation}</p>
              <h4>Safer alternatives</h4>
              <ul>
                {scenarioResult.safer_alternatives.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <h4>Action plan</h4>
              <ul>
                {scenarioResult.action_plan.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="muted-text">{scenarioResult.explainability}</p>
            </div>
          ) : null}
        </article>

        <article className="surface-card">
          <h2>Generate Report</h2>
          <p>Create downloadable monthly statements and behavior summaries.</p>
          <form className="stack-form" onSubmit={handleGenerateReport}>
            <label>
              Report type
              <select
                value={reportForm.reportType}
                onChange={(event) =>
                  setReportForm((prev) => ({
                    ...prev,
                    reportType: event.target.value as ReportForm['reportType']
                  }))
                }
              >
                <option value="monthly_statement">Monthly statement</option>
                <option value="goal_performance">Goal performance</option>
                <option value="behavior_trend">Behavior trend</option>
              </select>
            </label>
            <label>
              Period start
              <input
                type="date"
                value={reportForm.periodStart}
                onChange={(event) => setReportForm((prev) => ({ ...prev, periodStart: event.target.value }))}
                required
              />
            </label>
            <label>
              Period end
              <input
                type="date"
                value={reportForm.periodEnd}
                onChange={(event) => setReportForm((prev) => ({ ...prev, periodEnd: event.target.value }))}
                required
              />
            </label>
            {reportError ? <p className="form-error">{reportError}</p> : null}
            {reportMessage ? <p className="form-success">{reportMessage}</p> : null}
            <button className="primary-button" type="submit" disabled={isGeneratingReport}>
              {isGeneratingReport ? 'Generating...' : 'Generate report'}
            </button>
          </form>
        </article>
      </div>

      <article className="surface-card">
        <h2>Reports</h2>
        {reportsQuery.isLoading ? (
          <p>Loading reports...</p>
        ) : reportsQuery.data && reportsQuery.data.length > 0 ? (
          <DataTable
            title="Generated reports"
            columns={[
              { key: 'reportType', title: 'Report Type', render: (row) => row.reportType },
              { key: 'periodStart', title: 'Period Start', render: (row) => row.periodStart },
              { key: 'periodEnd', title: 'Period End', render: (row) => row.periodEnd },
              { key: 'createdAt', title: 'Created', render: (row) => row.createdAt }
            ]}
            rows={reportsQuery.data.map((report: ReportItem) => ({
              reportType: report.reportType,
              periodStart: new Date(report.periodStart).toLocaleDateString(),
              periodEnd: new Date(report.periodEnd).toLocaleDateString(),
              createdAt: new Date(report.createdAt).toLocaleString()
            }))}
          />
        ) : (
          <EmptyState title="No reports yet" body="Generate your first report from the panel above." />
        )}
      </article>

      <article className="surface-card">
        <h2>Alerts Feed</h2>
        {alertsQuery.isLoading ? (
          <p>Loading alerts...</p>
        ) : alertsQuery.data && alertsQuery.data.length > 0 ? (
          <DataTable
            title="Alerts"
            columns={[
              { key: 'alertType', title: 'Type', render: (row) => row.alertType },
              { key: 'severity', title: 'Severity', render: (row) => row.severity },
              { key: 'message', title: 'Message', render: (row) => row.message },
              { key: 'status', title: 'Status', render: (row) => row.status },
              { key: 'createdAt', title: 'Created', render: (row) => row.createdAt }
            ]}
            rows={alertsQuery.data.map((alert: AlertItem) => ({
              alertType: alert.alertType,
              severity: alert.severity,
              message: alert.message,
              status: alert.status,
              createdAt: new Date(alert.createdAt).toLocaleString()
            }))}
          />
        ) : (
          <EmptyState title="No alerts generated" body="Your anomaly alerts will appear here." />
        )}
      </article>
    </section>
  );
}
