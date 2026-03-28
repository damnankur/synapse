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
import {
  clearStoredSession,
  fetchCurrentUser,
  getStoredAccessToken,
  persistSession,
} from './services/auth';

const AUTH_PATH = '/auth';

function AppShell() {
  const { activeTab, toasts, dismissToast, setTab, hydrateUser } = useApp();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBootstrappingSession, setIsBootstrappingSession] = useState(true);

  const replacePath = (path: string) => {
    if (typeof window === 'undefined') return;
    if (window.location.pathname !== path) {
      window.history.replaceState({}, '', path);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const bootstrapSession = async () => {
      const token = getStoredAccessToken();
      if (!token) {
        if (isMounted) {
          setIsAuthenticated(false);
          setIsBootstrappingSession(false);
          replacePath(AUTH_PATH);
        }
        return;
      }

      try {
        const response = await fetchCurrentUser(token);
        if (!isMounted) return;

        hydrateUser(response.user);
        setIsAuthenticated(true);
      } catch (_error) {
        clearStoredSession();
        if (!isMounted) return;
        setIsAuthenticated(false);
        replacePath(AUTH_PATH);
      } finally {
        if (isMounted) setIsBootstrappingSession(false);
      }
    };

    bootstrapSession();

    return () => {
      isMounted = false;
    };
  }, [hydrateUser]);

  const handleAuthenticated = (session: AuthSession, persistInLocalStorage: boolean) => {
    persistSession(session, persistInLocalStorage);
    hydrateUser(session.user);
    setIsAuthenticated(true);
    setTab('dashboard', { replaceHistory: true });
  };

  const handleLogout = () => {
    clearStoredSession();
    setIsAuthenticated(false);
    replacePath(AUTH_PATH);
  };

  useEffect(() => {
    if (isBootstrappingSession || isAuthenticated) return;
    replacePath(AUTH_PATH);
  }, [isAuthenticated, isBootstrappingSession]);

  if (isBootstrappingSession) {
    return <div className="min-h-screen bg-[#F5F7FA]" />;
  }

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
        {activeTab === 'user' && <UserProfile onLogout={handleLogout} />}
      </main>

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
