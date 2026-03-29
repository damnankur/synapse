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
import {
  loginWithPassword,
  registerWithPassword,
  type AuthSession as ServiceAuthSession,
} from '../services/auth';

export type AuthSession = ServiceAuthSession;

interface LandingPageProps {
  onAuthenticated: (session: AuthSession, persistSession: boolean) => void;
}

type AuthMode = 'signin' | 'signup';

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

/**
 * Validate basic email format before calling backend auth APIs.
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Enforce minimum password length for register/sign-in UX consistency.
 */
function isStrongPassword(password: string): boolean {
  return password.length >= 8;
}

/**
 * Trim and normalize display name so we do not send blank padded values.
 */
function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function LandingPage({ onAuthenticated }: LandingPageProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Dynamic heading based on current auth mode.
   */
  const title = useMemo(
    () => (mode === 'signin' ? 'Welcome Back' : 'Create Your Synapse Account'),
    [mode]
  );

  /**
   * Dynamic subtitle based on current auth mode.
   */
  const subtitle = useMemo(
    () =>
      mode === 'signin'
        ? 'Sign in to continue your research collaborations.'
        : 'Start collaborating with researchers across disciplines.',
    [mode]
  );

  /**
   * Execute register/login flow against real backend auth endpoints.
   * On success, bubble session back to App.tsx for persistence and app entry.
   */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = normalizeName(name);

    if (!normalizedEmail || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!isStrongPassword(password)) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (mode === 'signup' && !normalizedName) {
      setError('Name is required to create an account.');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const session =
        mode === 'signup'
          ? await registerWithPassword({ name: normalizedName, email: normalizedEmail, password })
          : await loginWithPassword({ email: normalizedEmail, password });

      onAuthenticated(session, rememberMe);
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggle between sign-in and sign-up screens and clear stale errors.
   */
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

            {/* <div className="mt-8 rounded-xl bg-[#17A2B8]/15 border border-[#17A2B8]/30 p-3.5">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-[#17A2B8] mt-0.5 flex-shrink-0" />
                <p className="text-xs text-white/80 leading-relaxed">
                  Real authentication is enabled. Sign in or register using email and password,
                  then your account is validated against MongoDB.
                </p>
              </div>
            </div> */}
          </section>

          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#003D7A]">{title}</h2>
                <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
              </div>
              {/* <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#6B4C9A] bg-[#6B4C9A]/10 border border-[#6B4C9A]/20 rounded-lg px-2.5 py-1">
                <Lock size={12} />
                Secure flow
              </div> */}
            </div>

            <div className="mb-5 grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#F5F7FA] border border-gray-100">
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className={`text-sm font-semibold rounded-lg py-2.5 transition-all cursor-pointer ${
                  mode === 'signin' ? 'text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
                style={mode === 'signin' ? { background: 'linear-gradient(135deg, #003D7A, #6B4C9A)' } : {}}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={`text-sm font-semibold rounded-lg py-2.5 transition-all cursor-pointer ${
                  mode === 'signup' ? 'text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
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
                  Remember Me
                </label>
                {/* <span className="text-gray-400">MongoDB auth</span> */}
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

            {/* <div className="mt-5 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={14} className="text-[#003D7A]" />
                <p className="text-sm font-semibold text-gray-700">Auth Setup</p>
              </div>
              <p className="text-xs text-gray-500">
                This page now uses real backend auth endpoints: <code>/api/auth/register</code> and{' '}
                <code>/api/auth/login</code>.
              </p>
            </div> */}
          </section>
        </div>
      </div>
    </div>
  );
}
