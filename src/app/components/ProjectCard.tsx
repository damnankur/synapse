import React from 'react';
import {
  Users,
  Calendar,
  Tag,
  CheckCircle2,
  Loader2,
  Coins,
  BookOpen,
  Star,
  UserCheck,
} from 'lucide-react';
import { Project } from '../types';

const DOMAIN_COLORS: Record<string, string> = {
  'Computer Science': '#003D7A',
  'Computer Science / Psychology': '#6B4C9A',
  'Environmental Science / ML': '#17A2B8',
  'Computer Science / Law / Education': '#003D7A',
  'Organisational Psychology / Data Science': '#6B4C9A',
  'Electrical Engineering / Sustainability': '#17A2B8',
  'Bioethics / Molecular Biology': '#6B4C9A',
};

function getDomainColor(domain: string): string {
  for (const key of Object.keys(DOMAIN_COLORS)) {
    if (domain.includes(key.split(' / ')[0])) return DOMAIN_COLORS[key];
  }
  return '#003D7A';
}

interface ProjectCardProps {
  project: Project;
  isApplied: boolean;
  isLoading: boolean;
  onApply: (id: string) => void;
}

export function ProjectCard({ project, isApplied, isLoading, onApply }: ProjectCardProps) {
  const domainColor = getDomainColor(project.domain);
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(project.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );
  const isUrgent = daysLeft <= 7;

  return (
    <article
      className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col overflow-hidden"
      aria-label={`Project: ${project.title}`}
    >
      {/* Featured badge */}
      {project.featured && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full text-xs font-semibold">
          <Star size={10} fill="currentColor" />
          Featured
        </div>
      )}

      {/* Color accent top bar */}
      <div className="h-1 w-full" style={{ background: domainColor }} />

      <div className="p-5 flex flex-col flex-1 gap-3">
        {/* Domain badge */}
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
            style={{ background: domainColor }}
          >
            {project.domain}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-gray-900 leading-snug group-hover:text-[#003D7A] transition-colors line-clamp-2">
          {project.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">{project.description}</p>

        {/* Roles needed */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <UserCheck size={13} className="text-gray-400" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Roles Needed
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {project.requiredRoles.map((role) => (
              <span
                key={role}
                className="text-xs px-2 py-0.5 rounded-md font-medium"
                style={{
                  background: `${domainColor}15`,
                  color: domainColor,
                  border: `1px solid ${domainColor}25`,
                }}
              >
                {role}
              </span>
            ))}
          </div>
        </div>

        {/* Tags */}
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                <Tag size={9} />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Meta row */}
        <div className="flex items-center gap-4 text-xs text-gray-400 pt-1 border-t border-gray-50">
          <div className="flex items-center gap-1">
            <BookOpen size={11} />
            <span>{project.creator}</span>
            <span className="text-gray-300">·</span>
            <span className="italic">{project.creatorRole}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Users size={11} />
              {project.applicants} applicants
            </span>
            <span
              className={`flex items-center gap-1 ${
                isUrgent ? 'text-amber-500 font-semibold' : ''
              }`}
            >
              <Calendar size={11} />
              {daysLeft > 0 ? `${daysLeft}d left` : 'Closing soon'}
            </span>
          </div>
          <span className="flex items-center gap-1 text-gray-400">
            <Users size={10} />
            {project.maxTeamSize} max
          </span>
        </div>

        {/* Apply button */}
        <button
          onClick={() => onApply(project.id)}
          disabled={isApplied || isLoading}
          className={`
            mt-1 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl
            text-sm font-semibold transition-all duration-200 cursor-pointer
            ${
              isApplied
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default'
                : isLoading
                ? 'bg-gray-50 text-gray-400 border border-gray-200 cursor-wait'
                : 'text-white hover:opacity-90 active:scale-[0.98] shadow-sm hover:shadow-md'
            }
          `}
          style={
            !isApplied && !isLoading
              ? { background: 'linear-gradient(135deg, #003D7A, #6B4C9A)' }
              : {}
          }
          aria-label={
            isApplied
              ? 'Already applied'
              : isLoading
              ? 'Submitting application'
              : `Apply to ${project.title} for 10 tokens`
          }
        >
          {isLoading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Submitting…
            </>
          ) : isApplied ? (
            <>
              <CheckCircle2 size={14} />
              Applied
            </>
          ) : (
            <>
              <Coins size={14} />
              Apply · 10 tokens
            </>
          )}
        </button>
      </div>
    </article>
  );
}
