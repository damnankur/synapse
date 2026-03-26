import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './store/AppContext';
import { Header } from './components/Header';
import { Feed } from './components/Feed';
import { PostProject } from './components/PostProject';
import { Dashboard } from './components/Dashboard';
import { Tokens } from './components/Tokens';
import { UserProfile } from './components/User';
import { AuthSession, LandingPage } from './components/LandingPage';
import { ToastContainer } from './components/ToastContainer';

function AppShell() {
  const { activeTab, toasts, dismissToast, setTab } = useApp();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('synapse_access_token');
    setIsAuthenticated(Boolean(token));
  }, []);

  const handleAuthenticated = (session: AuthSession, persistSession: boolean) => {
    if (persistSession) {
      localStorage.setItem('synapse_access_token', session.accessToken);
      localStorage.setItem('synapse_refresh_token', session.refreshToken);
      localStorage.setItem('synapse_permissions', JSON.stringify(session.permissions));
      localStorage.setItem('synapse_session_user', JSON.stringify(session.user));
    } else {
      localStorage.removeItem('synapse_access_token');
      localStorage.removeItem('synapse_refresh_token');
      localStorage.removeItem('synapse_permissions');
      localStorage.removeItem('synapse_session_user');
    }

    setIsAuthenticated(true);
    setTab('dashboard');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F5F7FA]">
        <LandingPage onAuthenticated={handleAuthenticated} />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <Header />

      <main className="pb-16">
        {activeTab === 'feed' && <Feed />}
        {activeTab === 'post' && <PostProject />}
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'tokens' && <Tokens />}
        {activeTab === 'user' && <UserProfile />}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
        <div className="max-w-7xl mx-auto px-4">
          <div
            className="h-px mb-0"
            style={{
              background:
                'linear-gradient(90deg, transparent, #003D7A30, #6B4C9A30, transparent)',
            }}
          />
        </div>
      </footer>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
