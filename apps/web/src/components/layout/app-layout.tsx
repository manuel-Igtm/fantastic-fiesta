import { House, ShieldCheck, SignOut, Sparkle, Target, User, UsersThree, Vault, Wallet } from 'phosphor-react';
import { NavLink, Outlet } from 'react-router-dom';
import type { ReactNode } from 'react';

import { useAuth } from '../../context/auth-context';

type NavItem = {
  to: string;
  label: string;
  icon: ReactNode;
};

const navItems: NavItem[] = [
  { to: '/', label: 'Home', icon: <House size={18} /> },
  { to: '/wallets', label: 'Wallets', icon: <Wallet size={18} /> },
  { to: '/goals', label: 'Goals', icon: <Target size={18} /> },
  { to: '/insights', label: 'Insights', icon: <Sparkle size={18} /> },
  { to: '/vault', label: 'Vault', icon: <Vault size={18} /> },
  { to: '/community', label: 'Community', icon: <UsersThree size={18} /> },
  { to: '/reports', label: 'Reports', icon: <ShieldCheck size={18} /> },
  { to: '/profile', label: 'Profile', icon: <User size={18} /> }
];

export function AppLayout() {
  const { logout } = useAuth();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <h1>Save Sabi</h1>
          <p>Where financial literacy finds action.</p>
        </div>
        <nav className="nav-list" aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <span aria-hidden>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <button className="sidebar-logout" type="button" onClick={() => void logout()}>
          <SignOut size={16} />
          <span>Sign out</span>
        </button>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
