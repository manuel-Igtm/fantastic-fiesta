import { FormEvent, useCallback, useEffect, useState } from 'react';

import { SaveSabiApi } from '../lib/api';
import { Goal, GoalContribution, GoalContributionInput, GoalInput, GoalSummary } from '../types';
import { EmptyState } from '../components/ui/empty-state';
import { useAuth } from '../context/auth-context';

const goalFormDefault: GoalInput = {
  title: '',
  targetAmount: 1000,
  dueDate: '',
  priority: 3,
  imageUrl: ''
};

const contributionFormDefault: GoalContributionInput = {
  amount: 100,
  method: 'manual',
  sourceAccountId: ''
};

const emergencyFundDefault = {
  targetMonths: 6 as 6 | 9 | 12,
  currentAmount: 0
};

function toGoalSummary(goal: Goal): GoalSummary {
  const targetAmount = Number(goal.targetAmount);
  const currentAmount = Number(goal.currentAmount);
  const progressPercent = targetAmount > 0 ? Math.min((currentAmount / targetAmount) * 100, 100) : 0;
  return {
    id: goal.id,
    title: goal.title,
    dueDate: goal.dueDate,
    priority: goal.priority,
    imageUrl: goal.imageUrl,
    status: goal.status,
    contributions: goal.contributions,
    targetAmount,
    currentAmount,
    progressPercent
  };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2
  }).format(value);
}

function contributionAmountToNumber(amount: string | number): number {
  return Number(amount);
}

export function GoalsPage() {
  const { accessToken } = useAuth();
  const apiClient = useCallback(() => new SaveSabiApi(() => accessToken), [accessToken]);
  const [goals, setGoals] = useState<GoalSummary[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [goalForm, setGoalForm] = useState<GoalInput>(goalFormDefault);
  const [contributionForm, setContributionForm] = useState<GoalContributionInput>(contributionFormDefault);
  const [emergencyFund, setEmergencyFund] = useState(emergencyFundDefault);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshGoals = useCallback(async () => {
    if (!accessToken) {
      setGoals([]);
      setSelectedGoalId('');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient().listGoals();
      const normalized = data.map((goal) => toGoalSummary(goal));
      setGoals(normalized);
      setSelectedGoalId((current) => (current ? current : normalized[0]?.id ?? ''));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load goals');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, apiClient]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void refreshGoals();
    }, 0);
    return () => window.clearTimeout(id);
  }, [refreshGoals]);

  const submitGoal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await apiClient().createGoal({
        ...goalForm,
        targetAmount: Number(goalForm.targetAmount),
        priority: Number(goalForm.priority)
      });
      setGoalForm(goalFormDefault);
      await refreshGoals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create goal');
    }
  };

  const submitContribution = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedGoalId) {
      setError('Select a goal before creating a contribution.');
      return;
    }
    setError(null);
    try {
      await apiClient().contributeGoal(selectedGoalId, {
        amount: Number(contributionForm.amount),
        method: contributionForm.method,
        sourceAccountId: contributionForm.sourceAccountId || undefined
      });
      setContributionForm(contributionFormDefault);
      await refreshGoals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to contribute to goal');
    }
  };

  const submitEmergencyFund = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await apiClient().updateEmergencyFund({
        targetMonths: emergencyFund.targetMonths,
        currentAmount: Number(emergencyFund.currentAmount)
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update emergency fund');
    }
  };

  return (
    <div className="page-content">
      <section className="panel">
        <h2>Goals</h2>
        <p className="muted">
          Create goals, track progress, and add contributions to keep momentum across savings milestones.
        </p>
        <form className="form-grid" onSubmit={submitGoal}>
          <label>
            Goal title
            <input
              required
              value={goalForm.title}
              onChange={(event) => setGoalForm((current) => ({ ...current, title: event.target.value }))}
            />
          </label>
          <label>
            Target amount
            <input
              type="number"
              min={1}
              step={0.01}
              required
              value={goalForm.targetAmount}
              onChange={(event) =>
                setGoalForm((current) => ({ ...current, targetAmount: Number(event.target.value) }))
              }
            />
          </label>
          <label>
            Due date
            <input
              type="date"
              required
              value={goalForm.dueDate}
              onChange={(event) => setGoalForm((current) => ({ ...current, dueDate: event.target.value }))}
            />
          </label>
          <label>
            Priority (1-5)
            <input
              type="number"
              min={1}
              max={5}
              required
              value={goalForm.priority}
              onChange={(event) => setGoalForm((current) => ({ ...current, priority: Number(event.target.value) }))}
            />
          </label>
          <label className="full-width">
            Image URL (optional)
            <input
              value={goalForm.imageUrl ?? ''}
              onChange={(event) => setGoalForm((current) => ({ ...current, imageUrl: event.target.value }))}
            />
          </label>
          <div className="full-width">
            <button className="button primary" type="submit">
              Create goal
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <h2>Contributions</h2>
        <p className="muted">Apply manual contributions to keep goals on track.</p>
        <form className="form-grid" onSubmit={submitContribution}>
          <label>
            Goal
            <select
              value={selectedGoalId}
              onChange={(event) => setSelectedGoalId(event.target.value)}
              required
            >
              <option value="">Select goal</option>
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Amount
            <input
              type="number"
              step={0.01}
              min={0.01}
              required
              value={contributionForm.amount}
              onChange={(event) =>
                setContributionForm((current) => ({ ...current, amount: Number(event.target.value) }))
              }
            />
          </label>
          <label>
            Method
            <input
              required
              value={contributionForm.method}
              onChange={(event) => setContributionForm((current) => ({ ...current, method: event.target.value }))}
            />
          </label>
          <label>
            Source account (optional)
            <input
              value={contributionForm.sourceAccountId ?? ''}
              onChange={(event) =>
                setContributionForm((current) => ({ ...current, sourceAccountId: event.target.value }))
              }
            />
          </label>
          <div className="full-width">
            <button className="button secondary" type="submit">
              Submit contribution
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <h2>Emergency fund</h2>
        <p className="muted">Maintain your 6/9/12-month resilience buffer.</p>
        <form className="form-grid" onSubmit={submitEmergencyFund}>
          <label>
            Target months
            <select
              value={emergencyFund.targetMonths}
              onChange={(event) =>
                setEmergencyFund((current) => ({
                  ...current,
                  targetMonths: Number(event.target.value) as 6 | 9 | 12
                }))
              }
            >
              <option value={6}>6 months</option>
              <option value={9}>9 months</option>
              <option value={12}>12 months</option>
            </select>
          </label>
          <label>
            Current amount
            <input
              type="number"
              step={0.01}
              min={0}
              value={emergencyFund.currentAmount}
              onChange={(event) =>
                setEmergencyFund((current) => ({
                  ...current,
                  currentAmount: Number(event.target.value)
                }))
              }
            />
          </label>
          <div className="full-width">
            <button className="button secondary" type="submit">
              Update emergency fund
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <h2>Goal progress</h2>
        {error ? <p className="error">{error}</p> : null}
        {isLoading ? <p className="muted">Loading goals...</p> : null}
        {!isLoading && goals.length === 0 ? (
          <EmptyState title="No goals yet" body="Create your first savings goal to get started." />
        ) : (
          <div className="goal-list">
            {goals.map((goal) => (
              <article key={goal.id} className="goal-card">
                <header>
                  <h3>{goal.title}</h3>
                  <span className="badge">{goal.status}</span>
                </header>
                <p className="muted">
                  {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)} · due{' '}
                  {new Date(goal.dueDate).toLocaleDateString()}
                </p>
                <div className="progress-track" aria-label={`${goal.title} progress`}>
                  <div className="progress-fill" style={{ width: `${goal.progressPercent}%` }} />
                </div>
                <p className="muted">
                  {goal.progressPercent.toFixed(1)}% complete · priority {goal.priority}
                </p>
                <details>
                  <summary>Recent contributions</summary>
                  {goal.contributions.length === 0 ? (
                    <p className="muted">No contributions yet.</p>
                  ) : (
                    <ul>
                      {goal.contributions.map((contribution: GoalContribution) => (
                        <li key={contribution.id}>
                          {formatCurrency(contributionAmountToNumber(contribution.amount))} via {contribution.method} on{' '}
                          {new Date(contribution.contributedAt).toLocaleDateString()}
                        </li>
                      ))}
                    </ul>
                  )}
                </details>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
