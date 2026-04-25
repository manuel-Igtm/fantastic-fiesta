export type StatusTone =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'teal'
  | 'amber'
  | 'coral'
  | 'green'
  | 'neutral'
  | 'positive'
  | 'negative';

type StatusCardProps = {
  title?: string;
  label?: string;
  value: string;
  subtitle?: string;
  hint?: string;
  tone?: StatusTone;
};

function normalizeTone(tone: StatusTone): string {
  if (tone === 'teal') return 'primary';
  if (tone === 'amber') return 'warning';
  if (tone === 'green') return 'success';
  if (tone === 'positive') return 'success';
  if (tone === 'negative') return 'accent';
  if (tone === 'neutral') return 'secondary';
  return tone;
}

export function StatusCard({ title, label, value, subtitle, hint, tone = 'primary' }: StatusCardProps) {
  const normalizedTone = normalizeTone(tone);
  const heading = title ?? label ?? 'Metric';
  const text = subtitle ?? hint;
  return (
    <article className={`status-card tone-${normalizedTone}`}>
      <p className="status-card-title">{heading}</p>
      <p className="status-card-value">{value}</p>
      {text ? <p className="status-card-subtitle">{text}</p> : null}
    </article>
  );
}
