import { FormEvent, useMemo, useState } from 'react';

import { EmptyState } from '../components/ui/empty-state';
import { StatusCard } from '../components/ui/status-card';

type Challenge = {
  id: string;
  title: string;
  members: number;
  streakDays: number;
  deadline: string;
};

const initialChallenges: Challenge[] = [
  {
    id: '1',
    title: '30-Day Emergency Buffer Sprint',
    members: 6,
    streakDays: 11,
    deadline: '2026-05-30'
  },
  {
    id: '2',
    title: 'No-Spend Weekend Group',
    members: 12,
    streakDays: 5,
    deadline: '2026-05-04'
  }
];

export function CommunityPage() {
  const [challenges, setChallenges] = useState<Challenge[]>(initialChallenges);
  const [form, setForm] = useState({ title: '', deadline: '' });

  const totalMembers = useMemo(
    () => challenges.reduce((sum, challenge) => sum + challenge.members, 0),
    [challenges]
  );

  function createChallenge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title || !form.deadline) {
      return;
    }

    const next: Challenge = {
      id: crypto.randomUUID(),
      title: form.title,
      deadline: form.deadline,
      members: 1,
      streakDays: 0
    };
    setChallenges((prev) => [next, ...prev]);
    setForm({ title: '', deadline: '' });
  }

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <h1>Community</h1>
          <p>Shared streaks and accountability challenges.</p>
        </div>
      </header>

      <section className="card-grid">
        <StatusCard
          title="Active Challenges"
          value={String(challenges.length)}
          subtitle="Track streak boards together."
          tone="primary"
        />
        <StatusCard
          title="Total Participants"
          value={String(totalMembers)}
          subtitle="Invited members across all groups."
          tone="secondary"
        />
      </section>

      <section className="panel">
        <h2>Create challenge</h2>
        <form className="form-grid" onSubmit={createChallenge}>
          <label className="field">
            <span>Challenge title</span>
            <input
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Monthly savings challenge"
              required
            />
          </label>
          <label className="field">
            <span>Deadline</span>
            <input
              type="date"
              value={form.deadline}
              onChange={(event) => setForm((prev) => ({ ...prev, deadline: event.target.value }))}
              required
            />
          </label>
          <button className="button button-primary" type="submit">
            Create challenge
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>Current challenges</h2>
        {challenges.length === 0 ? (
          <EmptyState
            title="No active groups"
            body="Create a challenge and invite your accountability circle."
          />
        ) : (
          <ul className="list">
            {challenges.map((challenge) => (
              <li key={challenge.id} className="list-item">
                <div>
                  <h3>{challenge.title}</h3>
                  <p>
                    {challenge.members} member(s) • {challenge.streakDays} day streak
                  </p>
                </div>
                <span className="pill">Deadline {challenge.deadline}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
