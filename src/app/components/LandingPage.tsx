import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Atom,
  BookOpen,
  CheckCircle2,
  FlaskConical,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User2,
  Users,
} from 'lucide-react';

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  permissions: string[];
}

interface LandingPageProps {
  onAuthenticated: (session: AuthSession, persistSession: boolean) => void;
}

type AuthMode = 'signin' | 'signup';

interface AuthPayload {
  mode: AuthMode;
  name: string;
  email: string;
  password: string;
}

const FEATURE_CARDS = [
  {
    icon: <Users size={15} className="text-[#17A2B8]" />,
    title: 'Cross-Disciplinary Teams',
    detail: 'Find collaborators across CS, bio, engineering, and social science.',
  },
  {
    icon: <FlaskConical size={15} className="text-[#17A2B8]" />,
    title: 'Project Workspace',
    detail: 'Track milestones, assignments, and outcomes in one research dashboard.',
  },
  {
    icon: <ShieldCheck size={15} className="text-[#17A2B8]" />,
    title: 'Commitment Signals',
    detail: 'Token mechanics keep applications and execution accountable.',
  },
];

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function mockAuthenticate(payload: AuthPayload): Promise<Omit<AuthSession, 'permissions'>> {
  await new Promise((res) => setTimeout(res, 900));

  if (!isValidEmail(payload.email)) {
    throw new Error('Please enter a valid email address.');
  }

  if (payload.password.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }

  if (payload.email.toLowerCase().includes('blocked')) {
    throw new Error('Account access is blocked in mock mode.');
  }

  const derivedName =
    payload.mode === 'signup'
      ? payload.name.trim()
      : payload.email.split('@')[0].replace(/[._-]/g, ' ');

  return {
    accessToken: `mock_access_${Date.now()}`,
    refreshToken: `mock_refresh_${Date.now()}`,
    expiresIn: 60 * 60,
    user: {
      id: `user_${Math.floor(Math.random() * 100000)}`,
      name: derivedName
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0]?.toUpperCase() + part.slice(1))
        .join(' ') || 'Researcher',
      email: payload.email.toLowerCase(),
      role: 'researcher',
    },
  };
}

async function mockAuthorize(accessToken: string): Promise<string[]> {
  await new Promise((res) => setTimeout(res, 500));
  if (!accessToken.startsWith('mock_access_')) {
    throw new Error('Invalid access token.');
  }

  return ['projects.read', 'projects.apply', 'projects.publish', 'profile.update'];
}

export function LandingPage({ onAuthenticated }: LandingPageProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('jordan.patel@synapse-demo.dev');
  const [password, setPassword] = useState('research123');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const title = useMemo(
    () => (mode === 'signin' ? 'Welcome Back' : 'Create Your Synapse Account'),
    [mode]
  );

  const subtitle = useMemo(
    () =>
      mode === 'signin'
        ? 'Sign in to continue your research collaborations.'
        : 'Start collaborating with researchers across disciplines.',
    [mode]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setError('Name is required to create an account.');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const auth = await mockAuthenticate({ mode, name, email, password });
      const permissions = await mockAuthorize(auth.accessToken);
      const session: AuthSession = { ...auth, permissions };

      onAuthenticated(session, rememberMe);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError('');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F5F7FA]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-24 w-80 h-80 rounded-full bg-[#003D7A]/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-[#6B4C9A]/10 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          <section
            className="rounded-2xl border border-[#003D7A]/10 shadow-lg p-6 sm:p-8 text-white"
            style={{ background: 'linear-gradient(135deg, #003D7A 0%, #1a2f6e 50%, #6B4C9A 100%)' }}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white/10 backdrop-blur">
                <Atom size={22} className="text-[#17A2B8]" />
              </div>
              <div>
                <p className="text-xl font-bold leading-tight">Synapse</p>
                <p className="text-[11px] uppercase tracking-wider text-white/60">
                  Research Collaboration
                </p>
              </div>
            </div>

            <div className="mt-8">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs">
                <Sparkles size={12} className="text-[#17A2B8]" />
                Build Serious Research Teams
              </div>
              <h1 className="mt-3 text-3xl sm:text-4xl font-bold leading-tight">
                From Idea to Published Work, Faster.
              </h1>
              <p className="mt-3 text-sm text-white/70 max-w-xl">
                Discover projects, apply with commitment, and execute in a shared workspace built
                for academic and interdisciplinary teams.
              </p>
            </div>

            <div className="mt-8 grid gap-3">
              {FEATURE_CARDS.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl bg-white/10 border border-white/15 p-3.5"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    {feature.icon}
                    {feature.title}
                  </div>
                  <p className="mt-1 text-xs text-white/70">{feature.detail}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-xl bg-[#17A2B8]/15 border border-[#17A2B8]/30 p-3.5">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-[#17A2B8] mt-0.5 flex-shrink-0" />
                <p className="text-xs text-white/80 leading-relaxed">
                  Demo auth mode is enabled. Use any valid email + 8+ character password to sign
                  in. Authorization scopes are mocked for frontend flow testing.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#003D7A]">{title}</h2>
                <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#6B4C9A] bg-[#6B4C9A]/10 border border-[#6B4C9A]/20 rounded-lg px-2.5 py-1">
                <Lock size={12} />
                Secure flow
              </div>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#F5F7FA] border border-gray-100">
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className={`text-sm font-semibold rounded-lg py-2.5 transition-all cursor-pointer ${
                  mode === 'signin'
                    ? 'text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                style={mode === 'signin' ? { background: 'linear-gradient(135deg, #003D7A, #6B4C9A)' } : {}}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={`text-sm font-semibold rounded-lg py-2.5 transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                style={mode === 'signup' ? { background: 'linear-gradient(135deg, #003D7A, #6B4C9A)' } : {}}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                    <User2 size={14} className="text-[#003D7A]" />
                    Full Name
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jordan Patel"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#F5F7FA] text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#17A2B8]/30 focus:border-[#17A2B8] transition-all"
                  />
                </div>
              )}

              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                  <Mail size={14} className="text-[#003D7A]" />
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#F5F7FA] text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#17A2B8]/30 focus:border-[#17A2B8] transition-all"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                  <Lock size={14} className="text-[#003D7A]" />
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#F5F7FA] text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#17A2B8]/30 focus:border-[#17A2B8] transition-all"
                />
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                    <Lock size={14} className="text-[#003D7A]" />
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#F5F7FA] text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#17A2B8]/30 focus:border-[#17A2B8] transition-all"
                  />
                </div>
              )}

              <div className="flex items-center justify-between gap-3 text-xs">
                <label className="flex items-center gap-2 text-gray-500">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#003D7A] focus:ring-[#17A2B8]/30"
                  />
                  Remember session in local storage
                </label>
                <span className="text-gray-400">Dummy API mode</span>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3">
                  <AlertCircle size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-sm font-semibold text-white transition-all duration-200 shadow-md ${
                  loading ? 'opacity-60 cursor-wait' : 'cursor-pointer hover:opacity-90 hover:shadow-lg'
                }`}
                style={{ background: 'linear-gradient(135deg, #003D7A 0%, #6B4C9A 100%)' }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    {mode === 'signin' ? 'Sign In to Synapse' : 'Create Account'}
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={14} className="text-[#003D7A]" />
                <p className="text-sm font-semibold text-gray-700">Quick Demo Credentials</p>
              </div>
              <p className="text-xs text-gray-500">
                Email: <span className="font-medium text-gray-700">jordan.patel@synapse-demo.dev</span>{' '}
                | Password: <span className="font-medium text-gray-700">research123</span>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
