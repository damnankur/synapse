import React, { useState } from 'react';
import { Search, SlidersHorizontal, Sparkles, FlaskConical } from 'lucide-react';
import { ProjectCard } from './ProjectCard';
import { useApp } from '../store/AppContext';

const DOMAINS = ['All', 'Computer Science', 'Life Sciences', 'Engineering', 'Social Sciences', 'Bioethics'];

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
      <div className="h-1 bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-gray-100 rounded-full w-2/3" />
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-5/6" />
        <div className="h-4 bg-gray-100 rounded w-4/6" />
        <div className="flex gap-2 mt-2">
          <div className="h-6 w-20 bg-gray-100 rounded-md" />
          <div className="h-6 w-16 bg-gray-100 rounded-md" />
          <div className="h-6 w-24 bg-gray-100 rounded-md" />
        </div>
        <div className="h-10 bg-gray-100 rounded-xl mt-4" />
      </div>
    </div>
  );
}

export function Feed() {
  const { projects, appliedProjectIds, loadingProjectIds, applyToProject, user } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDomain, setActiveDomain] = useState('All');
  const [isLoading] = useState(false);

  const filtered = projects.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.requiredRoles.some((r) => r.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDomain =
      activeDomain === 'All' ||
      p.domain.toLowerCase().includes(activeDomain.toLowerCase());

    return matchesSearch && matchesDomain;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={18} className="text-[#17A2B8]" />
          <h1 className="text-2xl font-bold text-[#003D7A]">Discover Projects</h1>
        </div>
        <p className="text-gray-500 text-sm">
          Find interdisciplinary research collaborations. Each application costs{' '}
          <span className="font-semibold text-[#6B4C9A]">10 tokens</span> — your commitment signal.
        </p>
      </div>

      {/* Token warning banner */}
      {user.tokens < 10 && (
        <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <FlaskConical size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Insufficient Token Balance</p>
            <p className="text-xs text-red-500 mt-0.5">
              You have {user.tokens} token{user.tokens !== 1 ? 's' : ''}. Complete active role
              tasks to earn tokens before applying.
            </p>
          </div>
        </div>
      )}

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search projects, domains, roles, tags…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#17A2B8]/40 focus:border-[#17A2B8] transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-gray-400" />
          <div className="flex gap-1.5 flex-wrap">
            {DOMAINS.map((domain) => (
              <button
                key={domain}
                onClick={() => setActiveDomain(domain)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer
                  ${
                    activeDomain === domain
                      ? 'text-white shadow-sm'
                      : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700'
                  }
                `}
                style={
                  activeDomain === domain
                    ? { background: 'linear-gradient(135deg, #003D7A, #6B4C9A)' }
                    : {}
                }
              >
                {domain}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-gray-400">
          {filtered.length} project{filtered.length !== 1 ? 's' : ''} found
          {searchQuery && ` for "${searchQuery}"`}
        </p>
        <p className="text-xs text-gray-400">
          Your balance:{' '}
          <span className="font-semibold text-[#003D7A]">{user.tokens} tokens</span>
        </p>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Search size={24} className="text-gray-300" />
          </div>
          <h3 className="text-gray-500 font-semibold">No projects found</h3>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              isApplied={appliedProjectIds.includes(project.id)}
              isLoading={loadingProjectIds.includes(project.id)}
              onApply={applyToProject}
            />
          ))}
        </div>
      )}
    </div>
  );
}
