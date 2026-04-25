import type { ReactNode } from 'react';

type EmptyStateProps = {
  title: string;
  body: string;
  icon?: ReactNode;
};

export function EmptyState({ title, body, icon }: EmptyStateProps) {
  return (
    <section className="empty-state" role="status" aria-live="polite">
      {icon ? <div className="empty-state-icon">{icon}</div> : null}
      <h3>{title}</h3>
      <p>{body}</p>
    </section>
  );
}
