import React, { useState } from 'react';
import {
  User,
  GraduationCap,
  Coins,
  CheckCircle2,
  Circle,
  Users,
  Calendar,
  Tag,
  Lock,
  Trophy,
  BookOpen,
  BarChart3,
  Loader2,
  Star,
  ChevronRight,
  FlaskConical,
  Zap,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { TeamMember } from '../types';

// ─── Token Economy Panel ─────────────────────────────────────────────────────

function TokenEconomyPanel() {
  return (
    <div
      className="rounded-2xl p-5 text-white"
      style={{ background: 'linear-gradient(135deg, #003D7A 0%, #6B4C9A 100%)' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Zap size={16} className="text-[#17A2B8]" />
        <h3 className="font-semibold text-sm">Token Economy</h3>
      </div>
      <div className="space-y-2.5">
        {[
          { label: 'Post a Project', delta: '−10', color: 'text-red-300' },
          { label: 'Apply to Project', delta: '−10', color: 'text-red-300' },
          { label: 'Lock In (commit)', delta: '−10', color: 'text-red-300' },
          { label: 'Complete Role (refund)', delta: '+10', color: 'text-emerald-300' },
          { label: 'Project Complete', delta: '+20', color: 'text-emerald-300' },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-xs text-white/70">{item.label}</span>
            <span className={`text-xs font-bold ${item.color}`}>{item.delta}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-white/10 text-xs text-white/50">
        Tokens signal commitment — they keep collaborations accountable.
      </div>
    </div>
  );
}

// ─── User Profile Card ───────────────────────────────────────────────────────

function UserProfileCard() {
  const { user } = useApp();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Banner */}
      <div
        className="h-16"
        style={{ background: 'linear-gradient(135deg, #003D7A 0%, #6B4C9A 100%)' }}
      />
      <div className="px-5 pb-5">
        {/* Avatar */}
        <div className="flex items-end justify-between -mt-8 mb-3">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-lg border-2 border-white"
            style={{ background: 'linear-gradient(135deg, #17A2B8, #6B4C9A)' }}
          >
            {user.initials}
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
            <Coins size={13} className="text-amber-500" />
            <span className="text-sm font-bold text-amber-700">{user.tokens}</span>
            <span className="text-xs text-amber-500">tokens</span>
          </div>
        </div>

        <h2 className="font-bold text-gray-900">{user.name}</h2>
        <p className="text-sm text-[#6B4C9A] font-medium">{user.role}</p>
        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
          <GraduationCap size={11} />
          {user.university} · {user.department}
        </p>

        <p className="text-xs text-gray-500 mt-3 leading-relaxed">{user.bio}</p>

        {/* Skills */}
        <div className="mt-3">
          <p className="text-xs font-semibold text-gray-500 mb-2">Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {user.skills.map((skill) => (
              <span
                key={skill}
                className="text-xs px-2.5 py-1 rounded-md font-medium bg-[#003D7A]/8 text-[#003D7A] border border-[#003D7A]/10"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { label: 'Joined', value: user.joinDate.split(' ')[1], icon: <Calendar size={12} /> },
            { label: 'Completed', value: user.completedProjects, icon: <Trophy size={12} /> },
            { label: 'Tokens', value: user.tokens, icon: <Coins size={12} /> },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center p-2.5 rounded-xl bg-[#F5F7FA] border border-gray-100"
            >
              <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                {stat.icon}
              </div>
              <p className="text-base font-bold text-[#003D7A]">{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Team Member Row ─────────────────────────────────────────────────────────

function TeamMemberRow({ member }: { member: TeamMember }) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
        member.isCurrentUser ? 'bg-[#003D7A]/5 border border-[#003D7A]/10' : 'hover:bg-gray-50'
      }`}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-sm"
        style={{ background: member.avatarColor }}
      >
        {member.initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-gray-800 truncate">{member.name}</p>
          {member.isCurrentUser && (
            <span className="text-xs bg-[#17A2B8]/10 text-[#17A2B8] px-1.5 py-0.5 rounded-md font-medium flex-shrink-0">
              You
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate">{member.role}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className={`w-2 h-2 rounded-full ${member.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
        <span className="text-xs text-gray-400 capitalize">{member.status}</span>
      </div>
    </div>
  );
}

// ─── Active Project Workspace ────────────────────────────────────────────────

function ActiveProjectWorkspace() {
  const { activeProject, completeMyRole } = useApp();
  const [completing, setCompleting] = useState(false);

  const handleCompleteRole = async () => {
    setCompleting(true);
    await new Promise((res) => setTimeout(res, 1200));
    completeMyRole();
    setCompleting(false);
  };

  const completedMilestones = activeProject.milestones.filter((m) => m.completed).length;
  const totalMilestones = activeProject.milestones.length;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className="px-6 py-5 text-white"
        style={{ background: 'linear-gradient(135deg, #003D7A, #1a2f6e)' }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <FlaskConical size={14} className="text-[#17A2B8]" />
              <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                Active Project · Locked In
              </span>
              <Lock size={12} className="text-[#17A2B8]" />
            </div>
            <h2 className="font-bold text-lg text-white leading-snug">{activeProject.title}</h2>
            <p className="text-white/60 text-xs mt-1">{activeProject.domain}</p>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-2xl font-bold text-white">{activeProject.progress}%</p>
            <p className="text-xs text-white/50">Complete</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-white/50 mb-1.5">
            <span>Progress</span>
            <span>{completedMilestones}/{totalMilestones} milestones</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${activeProject.progress}%`,
                background: 'linear-gradient(90deg, #17A2B8, #6B4C9A)',
              }}
            />
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 mt-4 text-xs text-white/50">
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            Due {activeProject.deadline}
          </span>
          <span className="flex items-center gap-1">
            <Users size={11} />
            {activeProject.team.length} members
          </span>
          <span className="flex items-center gap-1">
            <Tag size={11} />
            {activeProject.tags[0]}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-6">

        {/* Description */}
        <p className="text-sm text-gray-500 leading-relaxed">{activeProject.description}</p>

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Milestones */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={14} className="text-[#003D7A]" />
              <h3 className="text-sm font-semibold text-gray-700">Project Milestones</h3>
            </div>
            <div className="space-y-2">
              {activeProject.milestones.map((milestone, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-xl text-sm transition-colors ${
                    milestone.completed
                      ? 'bg-emerald-50 text-emerald-700'
                      : i === 3
                      ? 'bg-[#17A2B8]/8 text-[#003D7A] border border-[#17A2B8]/20'
                      : 'bg-gray-50 text-gray-500'
                  }`}
                >
                  {milestone.completed ? (
                    <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" />
                  ) : (
                    <Circle
                      size={15}
                      className={`flex-shrink-0 ${i === 3 ? 'text-[#17A2B8]' : 'text-gray-300'}`}
                    />
                  )}
                  <span className="text-xs leading-snug">{milestone.title}</span>
                  {i === 3 && !milestone.completed && (
                    <span className="ml-auto text-xs bg-[#17A2B8]/10 text-[#17A2B8] px-1.5 py-0.5 rounded-md font-semibold flex-shrink-0">
                      Yours
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Team */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users size={14} className="text-[#003D7A]" />
              <h3 className="text-sm font-semibold text-gray-700">Research Team</h3>
            </div>
            <div className="space-y-1">
              {activeProject.team.map((member) => (
                <TeamMemberRow key={member.id} member={member} />
              ))}
            </div>
          </div>
        </div>

        {/* My Role + Complete CTA */}
        <div
          className={`rounded-2xl border-2 p-5 transition-all duration-300 ${
            activeProject.myTaskCompleted
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-[#003D7A]/20 bg-[#003D7A]/3'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck
                  size={15}
                  className={activeProject.myTaskCompleted ? 'text-emerald-500' : 'text-[#003D7A]'}
                />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  My Assigned Role
                </span>
              </div>
              <p className="font-semibold text-gray-800">{activeProject.myRole}</p>
              <p className="text-sm text-gray-500 mt-1">
                Task:{' '}
                <span className="font-medium text-gray-700">{activeProject.myTaskTitle}</span>
              </p>

              {/* Reward info */}
              {!activeProject.myTaskCompleted && (
                <div className="mt-3 flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-white border border-gray-100 px-2.5 py-1.5 rounded-lg">
                    <Coins size={11} className="text-amber-500" />
                    <span>+10 commitment refund</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-white border border-gray-100 px-2.5 py-1.5 rounded-lg">
                    <Star size={11} className="text-[#6B4C9A]" />
                    <span>+20 success reward</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-lg">
                    <Zap size={11} />
                    <span>= +30 total</span>
                  </div>
                </div>
              )}

              {activeProject.myTaskCompleted && (
                <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-emerald-600">
                  <CheckCircle2 size={16} />
                  Role completed! +30 tokens earned.
                </div>
              )}
            </div>

            {/* CTA button */}
            <div className="flex-shrink-0">
              <button
                onClick={handleCompleteRole}
                disabled={activeProject.myTaskCompleted || completing}
                className={`
                  flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-200 shadow-md
                  ${activeProject.myTaskCompleted
                    ? 'bg-emerald-100 text-emerald-600 cursor-default'
                    : completing
                    ? 'bg-gray-100 text-gray-400 cursor-wait'
                    : 'text-white cursor-pointer hover:opacity-90 active:scale-[0.98] hover:shadow-lg'
                  }
                `}
                style={
                  !activeProject.myTaskCompleted && !completing
                    ? { background: 'linear-gradient(135deg, #17A2B8, #003D7A)' }
                    : {}
                }
              >
                {completing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Submitting…
                  </>
                ) : activeProject.myTaskCompleted ? (
                  <>
                    <CheckCircle2 size={14} />
                    Completed
                  </>
                ) : (
                  <>
                    <Trophy size={14} />
                    Complete My Role
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {activeProject.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-50 text-gray-500 border border-gray-100"
            >
              <Tag size={9} />
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Lock-in Status Banner ────────────────────────────────────────────────────

function LockInBanner() {
  return (
    <div
      className="flex items-center gap-3 px-5 py-3.5 rounded-xl border text-sm"
      style={{
        background: 'linear-gradient(135deg, #003D7A08, #6B4C9A08)',
        borderColor: '#003D7A20',
      }}
    >
      <Lock size={14} className="text-[#6B4C9A] flex-shrink-0" />
      <div className="flex-1">
        <span className="font-semibold text-gray-700">Locked In</span>
        <span className="text-gray-500">
          {' '}· 10 tokens committed as stake. You'll earn them back upon role completion.
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-xs font-medium text-[#6B4C9A] bg-[#6B4C9A]/10 px-2.5 py-1 rounded-lg flex-shrink-0">
        <ShieldCheck size={11} />
        Committed
      </div>
    </div>
  );
}

// ─── Applied Projects Sidebar ─────────────────────────────────────────────────

function AppliedProjectsList() {
  const { projects, appliedProjectIds, setTab } = useApp();
  const applied = projects.filter((p) => appliedProjectIds.includes(p.id));

  if (applied.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={14} className="text-[#003D7A]" />
          <h3 className="text-sm font-semibold text-gray-700">Applied Projects</h3>
        </div>
        <div className="text-center py-6">
          <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
            <BookOpen size={18} className="text-gray-300" />
          </div>
          <p className="text-sm text-gray-400">No applications yet</p>
          <button
            onClick={() => setTab('feed')}
            className="mt-3 flex items-center gap-1 text-xs text-[#17A2B8] font-medium mx-auto hover:underline cursor-pointer"
          >
            Browse projects <ChevronRight size={12} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen size={14} className="text-[#003D7A]" />
        <h3 className="text-sm font-semibold text-gray-700">Applied Projects</h3>
        <span className="ml-auto text-xs bg-[#003D7A]/10 text-[#003D7A] px-2 py-0.5 rounded-full font-medium">
          {applied.length}
        </span>
      </div>
      <div className="space-y-2">
        {applied.map((project) => (
          <div
            key={project.id}
            className="flex items-center gap-3 p-3 rounded-xl bg-[#F5F7FA] border border-gray-100"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{project.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{project.domain}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Clock size={10} className="text-amber-400" />
              <span className="text-xs text-amber-600 font-medium">Pending</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Page header */}
      <div className="flex items-center gap-2 mb-8">
        <User size={18} className="text-[#17A2B8]" />
        <h1 className="text-2xl font-bold text-[#003D7A]">My Research Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left sidebar */}
        <div className="lg:col-span-1 space-y-5">
          <UserProfileCard />
          <AppliedProjectsList />
          <TokenEconomyPanel />
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-5">
          <LockInBanner />
          <div className="flex items-center gap-2">
            <FlaskConical size={16} className="text-[#17A2B8]" />
            <h2 className="font-bold text-gray-800">Active Workspace</h2>
            <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-semibold ml-1">
              1 active
            </span>
          </div>
          <ActiveProjectWorkspace />
        </div>
      </div>
    </div>
  );
}