import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useStore } from './lib/store';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Tenders } from './pages/Tenders';
import { TenderDetail } from './pages/TenderDetail';
import { Contractors } from './pages/Contractors';
import { ContractorProfile } from './pages/ContractorProfile';
import { Analytics } from './pages/Analytics';
import { About } from './pages/About';
import { SettingsPage } from './pages/Settings';

export function App() {
  const { state } = useStore();
  const { pathname } = useLocation();

  useEffect(() => {
    document.querySelector('.content')?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [pathname]);

  if (!state.user) return <Login />;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pirkimai" element={<Tenders />} />
        <Route path="/pirkimai/:id" element={<TenderDetail />} />
        <Route path="/pirkimai/:id/:step" element={<TenderDetail />} />
        <Route path="/rangovai" element={<Contractors />} />
        <Route path="/rangovai/:id" element={<ContractorProfile />} />
        <Route path="/analitika" element={<Analytics />} />
        <Route path="/apie" element={<About />} />
        <Route path="/nustatymai" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
