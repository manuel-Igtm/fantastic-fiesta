import { Navigate, Route, Routes } from 'react-router-dom';

import { AppLayout } from './components/layout/app-layout';
import { CommunityPage } from './pages/community-page';
import { GoalsPage } from './pages/goals-page';
import { HomePage } from './pages/home-page';
import { InsightsPage } from './pages/insights-page';
import { ProfilePage } from './pages/profile-page';
import { ReportsPage } from './pages/reports-page';
import { VaultPage } from './pages/vault-page';
import { WalletsPage } from './pages/wallets-page';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/wallets" element={<WalletsPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/vault" element={<VaultPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
