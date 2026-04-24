import { House, Lightbulb, Shield, Target, Wallet } from 'phosphor-react';

const cards = [
  {
    title: 'Wallet Health',
    description: 'Track all connected accounts and spending behavior in one place.',
    icon: <Wallet size={20} weight="bold" />
  },
  {
    title: 'Savings Rules',
    description: 'Automate round-ups, payday sweeps, and fixed savings actions.',
    icon: <Target size={20} weight="bold" />
  },
  {
    title: 'Emergency Shield',
    description: 'Maintain a six to twelve month emergency buffer by default.',
    icon: <Shield size={20} weight="bold" />
  },
  {
    title: 'Insights',
    description: 'Get 80/20 adherence views and actionable recommendations.',
    icon: <Lightbulb size={20} weight="bold" />
  }
];

export default function App() {
  return (
    <main className="page">
      <header className="hero">
        <div className="hero-icon">
          <House size={24} weight="bold" />
        </div>
        <div>
          <h1>Save Sabi</h1>
          <p>Where financial literacy finds action.</p>
        </div>
      </header>
      <section className="grid">
        {cards.map((card) => (
          <article key={card.title} className="card">
            <div className="card-icon">{card.icon}</div>
            <h2>{card.title}</h2>
            <p>{card.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
