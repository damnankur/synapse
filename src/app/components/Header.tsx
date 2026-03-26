import React, { useEffect, useRef, useState } from 'react';
import { Atom, Coins, LayoutDashboard, Rss, PlusSquare, TrendingUp } from 'lucide-react';
import { TabType } from '../types';
import { useApp } from '../store/AppContext';

function AnimatedTokenCount({ value }: { value: number }) {
  const [displayVal, setDisplayVal] = useState(value);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const prevRef = useRef(value);

  useEffect(() => {
    if (value === prevRef.current) return;
    const dir = value > prevRef.current ? 'up' : 'down';
    setFlash(dir);
    const start = prevRef.current;
    const end = value;
    const duration = 600;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayVal(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(step);
      else {
        setDisplayVal(end);
        prevRef.current = end;
      }
    };
    requestAnimationFrame(step);

    const clearFlash = setTimeout(() => setFlash(null), 1000);
    return () => clearTimeout(clearFlash);
  }, [value]);

  return (
    <span
      className={`
        font-bold text-white tabular-nums transition-colors duration-300
        ${flash === 'up' ? 'text-emerald-300' : flash === 'down' ? 'text-red-300' : 'text-white'}
      `}
    >
      {displayVal}
    </span>
  );
}

const NAV_TABS: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'feed', label: 'Discover', icon: <Rss size={16} /> },
  { id: 'dashboard', label: 'My Dashboard', icon: <LayoutDashboard size={16} /> },
  // { id: 'tokens', label: 'Tokens', icon: <Coins size={16} /> },
  { id: 'post', label: 'Post Project', icon: <PlusSquare size={16} /> },
];

export function Header() {
  const { user, activeTab, setTab } = useApp();

  return (
    <header
      className="sticky top-0 z-40 w-full shadow-lg"
      style={{ background: 'linear-gradient(135deg, #003D7A 0%, #1a2f6e 50%, #6B4C9A 100%)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            type="button"
            onClick={() => setTab('feed')}
            className={`flex items-center gap-2.5 rounded-xl transition-all cursor-pointer px-2 py-1 -mx-2 -my-1 ${
              activeTab === 'feed' 
            }`}
            aria-label="Go to discover page"
            title="Go to Discover"
          >
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur">
              <Atom size={22} className="text-[#17A2B8]" />
            </div>
            <div>
              <span className="text-xl font-bold text-white tracking-tight">Synapse</span>
              <span className="hidden sm:block text-[10px] text-white/50 leading-none tracking-wider uppercase">
                Research Collaboration
              </span>
            </div>
          </button>

          {/* Token Balance + User */}
          <div className="flex items-center gap-3">
            {/* Token pill */}
            <button
              type="button"
              onClick={() => setTab('tokens')}
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-inner border transition-all cursor-pointer${
                activeTab === 'tokens' ? 'border-white/60 ring-2 ring-[#17A2B8]/80 ring-offset-2 ring-offset-[#0c1f4f]'
                    : 'border-white/20 hover:border-white/50'
              }`}
              aria-label="View token balance and purchase tokens"
              title="Manage profile"
            >
              <div className="p-1 rounded-lg bg-blue-400/20">
                <Coins size={15} className="text-lightBlue-300" />
              </div>
            </button>

            {/* User avatar */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTab('user')}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-inner border transition-all cursor-pointer ${
                  activeTab === 'user'
                    ? 'border-white/60 ring-2 ring-[#17A2B8]/80 ring-offset-2 ring-offset-[#0c1f4f]'
                    : 'border-white/20 hover:border-white/50'
                }`}
                style={{ background: 'linear-gradient(135deg, #17A2B8, #6B4C9A)' }}
                aria-label="Open manage profile page"
                aria-current={activeTab === 'user' ? 'page' : undefined}
                title="Manage profile"
              >
                {user.initials}
              </button>
              <button
                type="button"
                onClick={() => setTab('user')}
                className="hidden md:block text-left cursor-pointer"
                aria-label="Open manage profile page"
                title="Manage profile"
              >
                <p className="text-white text-sm font-semibold leading-none">{user.name}</p>
                <p className="text-white/50 text-xs mt-0.5">{user.role}</p>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation tabs */}
        <nav className="flex items-center gap-1 pb-0" aria-label="Main navigation">
          {NAV_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={`
                  relative flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg
                  transition-all duration-200 cursor-pointer
                  ${
                    isActive
                      ? 'text-white bg-white/10'
                      : 'text-white/60 hover:text-white/90 hover:bg-white/5'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className={isActive ? 'text-[#17A2B8]' : ''}>{tab.icon}</span>
                {tab.label}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                    style={{ background: '#17A2B8' }}
                  />
                )}
              </button>
            );
          })}

          {/* Token economy legend — far right */}
          <div className="ml-auto mb-1 hidden lg:flex items-center gap-1.5 text-white/40 text-xs pr-1">
            <TrendingUp size={11} />
            <span>Apply −10 · Post −10 · Complete +30</span>
          </div>
        </nav>
      </div>
    </header>
  );
}
