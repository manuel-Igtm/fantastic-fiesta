import { FormEvent, useState } from 'react';

import { useAuth } from '../context/auth-context';
import { SaveSabiApi } from '../lib/api';
import { useQuery } from '../lib/query';
import { ReportItem } from '../types';

const REPORT_TYPES = [
  { value: 'monthly_statement', label: 'Monthly statement' },
  { value: 'goal_performance', label: 'Goal performance' },
  { value: 'behavior_trend', label: 'Behavior trend' }
] as const;

export function ReportsPage() {
  const { accessToken } = useAuth();
  const api = new SaveSabiApi(() => accessToken);
  const [reportType, setReportType] =
    useState<(typeof REPORT_TYPES)[number]['value']>('monthly_statement');
  const [periodStart, setPeriodStart] = useState(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return firstDay.toISOString().slice(0, 10);
  });
  const [periodEnd, setPeriodEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reportsQuery = useQuery<ReportItem[]>(() => api.listReports(), [api, accessToken]);
  const reports = reportsQuery.data ?? [];

  const handleGenerate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      await api.generateReport({
        reportType,
        periodStart: new Date(periodStart).toISOString(),
        periodEnd: new Date(periodEnd).toISOString()
      });
      setMessage('Report generation request submitted.');
      await reportsQuery.refetch();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to generate report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="stack">
      <article className="panel">
        <header>
          <h2>Generate report</h2>
          <p className="muted">Create downloadable statements and behavior reports.</p>
        </header>
        <form className="form-grid" onSubmit={handleGenerate}>
          <label>
            <span>Report type</span>
            <select value={reportType} onChange={(event) => setReportType(event.target.value as never)}>
              {REPORT_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Period start</span>
            <input
              type="date"
              value={periodStart}
              onChange={(event) => setPeriodStart(event.target.value)}
              required
            />
          </label>
          <label>
            <span>Period end</span>
            <input
              type="date"
              value={periodEnd}
              onChange={(event) => setPeriodEnd(event.target.value)}
              required
            />
          </label>
          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? 'Generating...' : 'Generate report'}
          </button>
        </form>
        {message ? <p className="hint">{message}</p> : null}
      </article>

      <article className="panel">
        <header>
          <h2>Generated reports</h2>
        </header>
        {reportsQuery.isLoading ? (
          <p className="muted">Loading reports...</p>
        ) : reports.length === 0 ? (
          <p className="muted">No reports generated yet.</p>
        ) : (
          <div className="list">
            {reports.map((report) => (
              <div key={report.id} className="list-row">
                <div>
                  <strong>{report.reportType}</strong>
                  <p className="muted">{new Date(report.createdAt).toLocaleString()}</p>
                </div>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={async () => {
                    const result = await api.downloadReport(report.id);
                    window.open(result.downloadUrl, '_blank', 'noopener,noreferrer');
                  }}
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
