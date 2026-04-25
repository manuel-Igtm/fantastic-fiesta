import { FormEvent, useState } from 'react';

import { useAuth } from '../context/auth-context';

const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'Kiswahili', value: 'sw' }
];

export function ProfilePage() {
  const { me, updateProfile, updateLanguage, refreshMe } = useAuth();
  const [email, setEmail] = useState(() => me?.email ?? '');
  const [phone, setPhone] = useState(() => me?.phone ?? '');
  const [firstName, setFirstName] = useState(() => me?.profile?.firstName ?? '');
  const [lastName, setLastName] = useState(() => me?.profile?.lastName ?? '');
  const [country, setCountry] = useState(() => me?.profile?.country ?? '');
  const [currency, setCurrency] = useState(() => me?.profile?.currency ?? '');
  const [monthlyBaselineExpense, setMonthlyBaselineExpense] = useState(() =>
    me?.profile?.monthlyBaselineExpense !== undefined && me?.profile?.monthlyBaselineExpense !== null
      ? String(me.profile.monthlyBaselineExpense)
      : ''
  );
  const [language, setLanguage] = useState<'en' | 'sw'>(
    () => (me?.preferredLanguage === 'sw' ? 'sw' : 'en')
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await updateProfile({
        email: email || undefined,
        phone: phone || undefined,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        country: country || undefined,
        currency: currency || undefined,
        monthlyBaselineExpense: monthlyBaselineExpense ? Number(monthlyBaselineExpense) : undefined
      });
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update profile.');
    } finally {
      setBusy(false);
    }
  }

  async function handleLanguageChange(nextLanguage: 'en' | 'sw') {
    setLanguage(nextLanguage);
    setError(null);
    setMessage(null);
    try {
      await updateLanguage(nextLanguage);
      setMessage('Language preference updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update language.');
    }
  }

  return (
    <section className="stack">
      <header className="section-header">
        <div>
          <h1>Profile</h1>
          <p>Manage your account details, language, and financial baseline values.</p>
        </div>
        <button className="button button-ghost" onClick={() => void refreshMe()} type="button">
          Refresh profile
        </button>
      </header>

      <article className="panel">
        <h2>Language</h2>
        <div className="chip-group">
          {languageOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`chip-button ${language === option.value ? 'active' : ''}`}
              onClick={() => void handleLanguageChange(option.value as 'en' | 'sw')}
            >
              {option.label}
            </button>
          ))}
        </div>
      </article>

      <article className="panel">
        <h2>Personal profile</h2>
        <form className="form-grid" onSubmit={(event) => void handleSaveProfile(event)}>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@email.com" />
          </label>
          <label>
            Phone
            <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+254..." />
          </label>
          <label>
            First name
            <input value={firstName} onChange={(event) => setFirstName(event.target.value)} />
          </label>
          <label>
            Last name
            <input value={lastName} onChange={(event) => setLastName(event.target.value)} />
          </label>
          <label>
            Country
            <input value={country} onChange={(event) => setCountry(event.target.value)} placeholder="Kenya" />
          </label>
          <label>
            Currency
            <input value={currency} onChange={(event) => setCurrency(event.target.value)} placeholder="KES" />
          </label>
          <label>
            Monthly baseline expense
            <input
              type="number"
              min={0}
              step="0.01"
              value={monthlyBaselineExpense}
              onChange={(event) => setMonthlyBaselineExpense(event.target.value)}
            />
          </label>
          <div className="form-actions">
            <button type="submit" className="primary-button" disabled={busy}>
              {busy ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </article>

      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
    </section>
  );
}
