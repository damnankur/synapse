import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  Crown,
  Archive,
  Mail,
  Phone,
  X,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import {
  ActiveProject,
  ArchivedProject,
  PendingApplication,
  PlatformProfile,
  TeamMember,
} from '../types';
import {
  completeOwnedProject,
  approveRoleCompletion,
  fetchActiveProjects,
  fetchArchivedProjects,
  fetchPendingApplications,
  leaveProject,
  removeProjectContributor,
  resetRoleSubmission,
  reviewProjectApplication,
  submitRoleCompletion,
} from '../services/projects';
import { fetchCurrentUser } from '../services/auth';
import { fetchPlatformProfile } from '../services/user';

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
          { label: 'Submission Approved (User)', delta: '+30', color: 'text-emerald-300' },
          { label: 'Project Complete (Owner)', delta: '+20', color: 'text-emerald-300' },
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

function ActiveProjectWorkspace({
  activeProject,
  onSubmitRole,
  onApproveSubmission,
  onReviewApplicant,
  onResetSubmission,
  onRemoveContributor,
  onLeaveProject,
  onCompleteProject,
  onViewProfile,
}: {
  activeProject: ActiveProject;
  onSubmitRole: () => Promise<void>;
  onApproveSubmission: (applicationId: string) => Promise<void>;
  onReviewApplicant: (
    applicationId: string,
    action: 'accept' | 'reject',
    assignedRole?: string
  ) => Promise<void>;
  onResetSubmission: (applicationId: string) => Promise<void>;
  onRemoveContributor: (applicationId: string) => Promise<void>;
  onLeaveProject: () => Promise<void>;
  onCompleteProject: () => Promise<void>;
  onViewProfile: (userId: string, projectId: string) => void;
}) {
  const [completing, setCompleting] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [completingProject, setCompletingProject] = useState(false);

  const submissionStatus = activeProject.submissionStatus || 'not_submitted';
  const isOwner = Boolean(activeProject.isOwner);
  const pendingApprovals = activeProject.pendingApprovals || [];
  const applicantsQueue = activeProject.applicantsQueue || [];
  const activeContributors = activeProject.activeContributors || [];

  const handleSubmitRole = async () => {
    setCompleting(true);
    try {
      await onSubmitRole();
    } finally {
      setCompleting(false);
    }
  };

  const handleApprove = async (applicationId: string) => {
    setApprovingId(applicationId);
    try {
      await onApproveSubmission(applicationId);
    } finally {
      setApprovingId(null);
    }
  };

  const handleReview = async (
    applicationId: string,
    action: 'accept' | 'reject',
    assignedRole = ''
  ) => {
    setReviewingId(applicationId);
    try {
      await onReviewApplicant(applicationId, action, assignedRole);
    } finally {
      setReviewingId(null);
    }
  };

  const handleResetSubmission = async (applicationId: string) => {
    setResettingId(applicationId);
    try {
      await onResetSubmission(applicationId);
    } finally {
      setResettingId(null);
    }
  };

  const handleRemove = async (applicationId: string) => {
    setRemovingId(applicationId);
    try {
      await onRemoveContributor(applicationId);
    } finally {
      setRemovingId(null);
    }
  };

  const handleLeaveProject = async () => {
    setLeaving(true);
    try {
      await onLeaveProject();
    } finally {
      setLeaving(false);
    }
  };

  const handleCompleteProject = async () => {
    setCompletingProject(true);
    try {
      await onCompleteProject();
    } finally {
      setCompletingProject(false);
    }
  };

  const completedMilestones = activeProject.milestones.filter((m) => m.completed).length;
  const totalMilestones = activeProject.milestones.length;
  const ownerUserId = activeProject.ownerUserId || '';
  const canViewOwnerProfile = !isOwner && Boolean(ownerUserId);

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
            {canViewOwnerProfile && (
              <button
                type="button"
                onClick={() => onViewProfile(ownerUserId, activeProject.id)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-2.5 py-1 text-[11px] font-semibold text-white/80 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <User size={11} />
                View Publisher Profile
              </button>
            )}
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
              {!isOwner && !activeProject.myTaskCompleted && (
                <div className="mt-3 flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-white border border-gray-100 px-2.5 py-1.5 rounded-lg">
                    <Coins size={11} className="text-amber-500" />
                    <span>Owner approval required</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-white border border-gray-100 px-2.5 py-1.5 rounded-lg">
                    <Star size={11} className="text-[#6B4C9A]" />
                    <span>Reward on final review</span>
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

              {isOwner && (
                <div className="mt-3 space-y-4">
                  <div className="rounded-xl bg-[#003D7A]/6 border border-[#003D7A]/12 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                          Final Project Completion
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Marking completion archives this project for both owner and contributors.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleCompleteProject}
                        disabled={activeProject.myTaskCompleted || completingProject}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          activeProject.myTaskCompleted
                            ? 'bg-emerald-100 text-emerald-700 cursor-default'
                            : completingProject
                            ? 'bg-gray-100 text-gray-500 cursor-wait'
                            : 'text-white hover:opacity-90 cursor-pointer'
                        }`}
                        style={
                          !activeProject.myTaskCompleted && !completingProject
                            ? { background: 'linear-gradient(135deg, #003D7A, #6B4C9A)' }
                            : {}
                        }
                      >
                        {activeProject.myTaskCompleted
                          ? 'Completed'
                          : completingProject
                          ? 'Completing...'
                          : 'Mark Project Complete'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Applicants Queue
                    </p>
                    {applicantsQueue.length === 0 ? (
                      <p className="text-sm text-gray-500">No pending applicants right now.</p>
                    ) : (
                      applicantsQueue.map((applicant) => (
                        <div
                          key={applicant.applicationId}
                          className="rounded-xl bg-white border border-gray-100 px-3 py-2.5"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <button
                                type="button"
                                onClick={() => onViewProfile(applicant.userId, activeProject.id)}
                                className="text-sm font-semibold text-gray-800 hover:text-[#003D7A] transition-colors cursor-pointer"
                              >
                                {applicant.name}
                              </button>
                              <p className="text-xs text-gray-500">
                                {applicant.role || 'Contributor'}
                                {applicant.appliedAt ? ` · applied ${applicant.appliedAt}` : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleReview(
                                    applicant.applicationId,
                                    'accept',
                                    applicant.role && applicant.role !== 'Role not specified'
                                      ? applicant.role
                                      : 'Contributor'
                                  )
                                }
                                disabled={reviewingId === applicant.applicationId}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60 cursor-pointer"
                                style={{ background: 'linear-gradient(135deg, #17A2B8, #003D7A)' }}
                              >
                                {reviewingId === applicant.applicationId ? '...' : 'Accept'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReview(applicant.applicationId, 'reject')}
                                disabled={reviewingId === applicant.applicationId}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60 cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                          {applicant.message && (
                            <p className="text-xs text-gray-500 mt-2">{applicant.message}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Pending Owner Reviews
                    </p>
                    {pendingApprovals.length === 0 ? (
                      <p className="text-sm text-gray-500">No pending contribution submissions yet.</p>
                    ) : (
                      pendingApprovals.map((pending) => (
                        <div
                          key={pending.applicationId}
                          className="flex items-center justify-between gap-3 rounded-xl bg-white border border-gray-100 px-3 py-2.5"
                        >
                          <div>
                            <button
                              type="button"
                              onClick={() => onViewProfile(pending.userId, activeProject.id)}
                              className="text-sm font-semibold text-gray-800 hover:text-[#003D7A] transition-colors cursor-pointer"
                            >
                              {pending.name}
                            </button>
                            <p className="text-xs text-gray-500">
                              {pending.role}
                              {pending.submittedAt ? ` · submitted ${pending.submittedAt}` : ''}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleApprove(pending.applicationId)}
                            disabled={approvingId === pending.applicationId}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60 cursor-pointer"
                            style={{ background: 'linear-gradient(135deg, #003D7A, #6B4C9A)' }}
                          >
                            {approvingId === pending.applicationId ? 'Approving...' : 'Approve'}
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Active Contributors
                    </p>
                    {activeContributors.length === 0 ? (
                      <p className="text-sm text-gray-500">No selected contributors yet.</p>
                    ) : (
                      activeContributors.map((contributor) => (
                        <div
                          key={contributor.applicationId}
                          className="rounded-xl bg-white border border-gray-100 px-3 py-2.5"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <button
                                type="button"
                                onClick={() => onViewProfile(contributor.userId, activeProject.id)}
                                className="text-sm font-semibold text-gray-800 hover:text-[#003D7A] transition-colors cursor-pointer"
                              >
                                {contributor.name}
                              </button>
                              <p className="text-xs text-gray-500">
                                {contributor.role}
                                {contributor.submittedAt ? ` · submitted ${contributor.submittedAt}` : ''}
                              </p>
                              <p className="text-[11px] text-gray-400 mt-0.5">
                                Status: {contributor.submissionStatus.replace('_', ' ')}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {contributor.submissionStatus === 'submitted' && (
                                <button
                                  type="button"
                                  onClick={() => handleResetSubmission(contributor.applicationId)}
                                  disabled={resettingId === contributor.applicationId}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-amber-200 text-amber-700 hover:bg-amber-50 disabled:opacity-60 cursor-pointer"
                                >
                                  {resettingId === contributor.applicationId ? '...' : 'Reset'}
                                </button>
                              )}
                              {contributor.submissionStatus !== 'approved' && (
                                <button
                                  type="button"
                                  onClick={() => handleRemove(contributor.applicationId)}
                                  disabled={removingId === contributor.applicationId}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60 cursor-pointer"
                                >
                                  {removingId === contributor.applicationId ? '...' : 'Remove'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* CTA button */}
            {!isOwner && (
              <div className="flex-shrink-0 space-y-2">
                <button
                  onClick={handleSubmitRole}
                  disabled={
                    activeProject.myTaskCompleted ||
                    completing ||
                    submissionStatus === 'submitted' ||
                    leaving
                  }
                  className={`
                    flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-200 shadow-md
                    ${activeProject.myTaskCompleted
                      ? 'bg-emerald-100 text-emerald-600 cursor-default'
                      : submissionStatus === 'submitted'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200 cursor-default'
                      : completing
                      ? 'bg-gray-100 text-gray-400 cursor-wait'
                      : 'text-white cursor-pointer hover:opacity-90 active:scale-[0.98] hover:shadow-lg'
                    }
                  `}
                  style={
                    !activeProject.myTaskCompleted &&
                    !completing &&
                    submissionStatus !== 'submitted'
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
                  ) : submissionStatus === 'submitted' ? (
                    <>
                      <Clock size={14} />
                      Submitted for Review
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={14} />
                      Submit My Role
                    </>
                  )}
                </button>
                {!activeProject.myTaskCompleted && (
                  <button
                    type="button"
                    onClick={handleLeaveProject}
                    disabled={leaving || completing}
                    className="w-full px-4 py-2 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 disabled:opacity-60 cursor-pointer"
                  >
                    {leaving ? 'Leaving...' : 'Leave Project (No Refund)'}
                  </button>
                )}
              </div>
            )}
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
          {' '}· Applications stay pending until publisher accepts or rejects your proposal.
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

function PendingApplicationsList({
  applications,
  loading,
  onViewPublisher,
}: {
  applications: PendingApplication[];
  loading: boolean;
  onViewPublisher: (publisherUserId: string, projectId: string) => void;
}) {
  const { setTab } = useApp();

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={14} className="text-[#003D7A]" />
          <h3 className="text-sm font-semibold text-gray-700">Pending Applications</h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 size={14} className="animate-spin text-[#003D7A]" />
          Loading pending queue...
        </div>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={14} className="text-[#003D7A]" />
          <h3 className="text-sm font-semibold text-gray-700">Pending Applications</h3>
        </div>
        <div className="text-center py-6">
          <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
            <BookOpen size={18} className="text-gray-300" />
          </div>
          <p className="text-sm text-gray-400">No pending applications</p>
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
        <h3 className="text-sm font-semibold text-gray-700">Pending Applications</h3>
        <span className="ml-auto text-xs bg-[#003D7A]/10 text-[#003D7A] px-2 py-0.5 rounded-full font-medium">
          {applications.length}
        </span>
      </div>
      <div className="space-y-2">
        {applications.map((application) => (
          <button
            key={application.applicationId}
            type="button"
            onClick={() => onViewPublisher(application.publisherUserId, application.projectId)}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#F5F7FA] border border-gray-100 hover:bg-[#eef2f7] transition-colors cursor-pointer text-left"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{application.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {application.domain}
                {application.appliedAt ? ` · applied ${application.appliedAt}` : ''}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                Publisher: {application.publisherName || 'Project Owner'}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Clock size={10} className="text-amber-400" />
              <span className="text-xs text-amber-600 font-medium">Pending</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function PlatformProfileModal({
  profile,
  loading,
  error,
  onClose,
}: {
  profile: PlatformProfile | null;
  loading: boolean;
  error: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0b1020]/55 px-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white border border-gray-100 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">Researcher Profile</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 cursor-pointer"
            aria-label="Close profile preview"
          >
            <X size={14} />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin text-[#003D7A] mx-auto mb-2" />
            Loading profile...
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          </div>
        ) : profile ? (
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #17A2B8, #6B4C9A)' }}
              >
                {profile.initials || 'U'}
              </div>
              <div className="flex-1">
                <p className="text-base font-bold text-gray-900">{profile.name}</p>
                <p className="text-sm text-[#6B4C9A] font-medium">{profile.role}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {profile.university} · {profile.department}
                </p>
              </div>
              <div className="text-right text-xs text-gray-500">
                <p>{profile.completedProjects} completed</p>
                <p>{profile.activeProjectsCount} active</p>
              </div>
            </div>

            <p className="text-sm text-gray-600">{profile.bio || 'No bio shared yet.'}</p>

            <div className="flex flex-wrap gap-1.5">
              {profile.skills.length ? (
                profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-[#003D7A]/8 text-[#003D7A] border border-[#003D7A]/10"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-400">No skills listed.</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-gray-100 bg-[#F5F7FA] px-3 py-2.5">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Contact Details
                </p>
                <p className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Mail size={11} />
                  {profile.contact.email || 'Hidden until accepted + shared'}
                </p>
                <p className="text-xs text-gray-600 flex items-center gap-1.5 mt-1">
                  <Phone size={11} />
                  {profile.contact.phone || 'Hidden until accepted + shared'}
                </p>
                <p className="text-[11px] text-gray-400 mt-2">
                  {!profile.contact.unlocked
                    ? 'Contact unlocks after proposal acceptance.'
                    : 'Visible only for details marked visible by this user.'}
                </p>
              </div>

              <div className="rounded-xl border border-gray-100 bg-[#F5F7FA] px-3 py-2.5">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Platform Stats
                </p>
                <p className="text-xs text-gray-600">Joined: {profile.joinDate || 'N/A'}</p>
                <p className="text-xs text-gray-600 mt-1">
                  Past projects: {profile.pastProjectsCount}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Current active: {profile.activeProjectsCount}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-gray-100 px-3 py-2.5">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Active Projects
                </p>
                {profile.activeProjects.length === 0 ? (
                  <p className="text-xs text-gray-400">No active projects currently.</p>
                ) : (
                  <div className="space-y-1.5">
                    {profile.activeProjects.slice(0, 4).map((project) => (
                      <div key={`${project.projectId}-${project.role}`}>
                        <p className="text-xs font-semibold text-gray-700">{project.title}</p>
                        <p className="text-[11px] text-gray-500">
                          {project.role} · {project.status}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-gray-100 px-3 py-2.5">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Past Projects
                </p>
                {profile.pastProjects.length === 0 ? (
                  <p className="text-xs text-gray-400">No past projects yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {profile.pastProjects.slice(0, 4).map((project) => (
                      <div key={`${project.projectId}-${project.role}-${project.completedOn}`}>
                        <p className="text-xs font-semibold text-gray-700">{project.title}</p>
                        <p className="text-[11px] text-gray-500">
                          {project.role} · {project.outcome}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ProjectArchiveSection({
  archivedProjects,
  loading,
}: {
  archivedProjects: ArchivedProject[];
  loading: boolean;
}) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Archive size={15} className="text-[#003D7A]" />
        <h3 className="text-sm font-semibold text-gray-800">Project Archive</h3>
        <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
          {archivedProjects.length}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 size={14} className="animate-spin text-[#003D7A]" />
          Loading archive...
        </div>
      ) : archivedProjects.length === 0 ? (
        <p className="text-sm text-gray-500">No archived projects yet.</p>
      ) : (
        <div className="space-y-2">
          {archivedProjects.map((project) => (
            <div
              key={project.id}
              className="rounded-xl border border-gray-100 bg-[#F5F7FA] px-3 py-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{project.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {project.domain} · {project.role}
                  </p>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-600">
                  {project.completedOn || 'Completed'}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2 flex-wrap text-[11px]">
                <span className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-600">
                  {project.outcome}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md border ${
                    project.rewardTokens > 0
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-gray-50 border-gray-200 text-gray-500'
                  }`}
                >
                  Reward {project.rewardTokens > 0 ? `+${project.rewardTokens}` : '0'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function Dashboard() {
  const { hydrateUser } = useApp();
  const [activeProjects, setActiveProjects] = useState<ActiveProject[]>([]);
  const [archivedProjects, setArchivedProjects] = useState<ArchivedProject[]>([]);
  const [pendingApplications, setPendingApplications] = useState<PendingApplication[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [loadingActiveProjects, setLoadingActiveProjects] = useState(true);
  const [loadingArchiveProjects, setLoadingArchiveProjects] = useState(true);
  const [loadingPendingApplications, setLoadingPendingApplications] = useState(true);
  const [activeProjectsError, setActiveProjectsError] = useState('');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileModalLoading, setProfileModalLoading] = useState(false);
  const [profileModalError, setProfileModalError] = useState('');
  const [profilePreview, setProfilePreview] = useState<PlatformProfile | null>(null);

  const loadActiveProjects = useCallback(async () => {
    setLoadingActiveProjects(true);
    setLoadingArchiveProjects(true);
    setLoadingPendingApplications(true);
    setActiveProjectsError('');

    try {
      const [activeResponse, archiveResponse, pendingResponse, userResponse] = await Promise.all([
        fetchActiveProjects(),
        fetchArchivedProjects(),
        fetchPendingApplications(),
        fetchCurrentUser(),
      ]);

      setActiveProjects(activeResponse.projects);
      setArchivedProjects(archiveResponse.projects);
      setPendingApplications(pendingResponse.applications);
      setSelectedProjectId((current) => {
        if (!activeResponse.projects.length) return '';
        if (current && activeResponse.projects.some((project) => project.id === current)) {
          return current;
        }
        return activeResponse.projects[0].id;
      });
      hydrateUser(userResponse.user);
    } catch (error) {
      setActiveProjects([]);
      setArchivedProjects([]);
      setPendingApplications([]);
      setSelectedProjectId('');
      setActiveProjectsError(
        error instanceof Error ? error.message : 'Failed to load dashboard projects.'
      );
    } finally {
      setLoadingActiveProjects(false);
      setLoadingArchiveProjects(false);
      setLoadingPendingApplications(false);
    }
  }, [hydrateUser]);

  useEffect(() => {
    loadActiveProjects();
  }, [loadActiveProjects]);

  const selectedActiveProject = useMemo(
    () =>
      activeProjects.find((project) => project.id === selectedProjectId) ||
      activeProjects[0] ||
      null,
    [activeProjects, selectedProjectId]
  );
  const ownerProjects = useMemo(
    () => activeProjects.filter((project) => project.isOwner),
    [activeProjects]
  );

  const handleCloseProfileModal = useCallback(() => {
    setProfileModalOpen(false);
    setProfileModalLoading(false);
    setProfileModalError('');
    setProfilePreview(null);
  }, []);

  const handleViewProfile = useCallback(async (userId: string, projectId: string) => {
    if (!userId) return;
    setProfileModalOpen(true);
    setProfileModalLoading(true);
    setProfileModalError('');
    setProfilePreview(null);

    try {
      const response = await fetchPlatformProfile(userId, projectId);
      setProfilePreview(response.profile);
    } catch (error) {
      setProfileModalError(
        error instanceof Error ? error.message : 'Unable to load this profile right now.'
      );
    } finally {
      setProfileModalLoading(false);
    }
  }, []);

  const handleSubmitRole = async () => {
    if (!selectedActiveProject?.applicationId) return;
    try {
      await submitRoleCompletion(selectedActiveProject.id, selectedActiveProject.applicationId);
      await loadActiveProjects();
    } catch (error) {
      setActiveProjectsError(
        error instanceof Error ? error.message : 'Failed to submit completion.'
      );
    }
  };

  const handleApproveSubmission = async (applicationId: string) => {
    if (!selectedActiveProject) return;
    try {
      await approveRoleCompletion(selectedActiveProject.id, applicationId);
      await loadActiveProjects();
    } catch (error) {
      setActiveProjectsError(
        error instanceof Error ? error.message : 'Failed to approve contributor.'
      );
    }
  };

  const handleReviewApplicant = async (
    applicationId: string,
    action: 'accept' | 'reject',
    assignedRole = ''
  ) => {
    if (!selectedActiveProject) return;
    try {
      await reviewProjectApplication(selectedActiveProject.id, applicationId, action, {
        assignedRole,
      });
      await loadActiveProjects();
    } catch (error) {
      setActiveProjectsError(
        error instanceof Error ? error.message : 'Failed to review applicant.'
      );
    }
  };

  const handleResetSubmission = async (applicationId: string) => {
    if (!selectedActiveProject) return;
    try {
      await resetRoleSubmission(selectedActiveProject.id, applicationId);
      await loadActiveProjects();
    } catch (error) {
      setActiveProjectsError(
        error instanceof Error ? error.message : 'Failed to reset submission.'
      );
    }
  };

  const handleRemoveContributor = async (applicationId: string) => {
    if (!selectedActiveProject) return;
    try {
      await removeProjectContributor(selectedActiveProject.id, applicationId);
      await loadActiveProjects();
    } catch (error) {
      setActiveProjectsError(
        error instanceof Error ? error.message : 'Failed to remove contributor.'
      );
    }
  };

  const handleLeaveProject = async () => {
    if (!selectedActiveProject) return;
    try {
      await leaveProject(selectedActiveProject.id);
      await loadActiveProjects();
    } catch (error) {
      setActiveProjectsError(
        error instanceof Error ? error.message : 'Failed to leave project.'
      );
    }
  };

  const handleCompleteProject = async () => {
    if (!selectedActiveProject) return;
    try {
      await completeOwnedProject(selectedActiveProject.id);
      await loadActiveProjects();
    } catch (error) {
      setActiveProjectsError(
        error instanceof Error ? error.message : 'Failed to mark project as completed.'
      );
    }
  };

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
          <PendingApplicationsList
            applications={pendingApplications}
            loading={loadingPendingApplications}
            onViewPublisher={handleViewProfile}
          />
          <TokenEconomyPanel />
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-5">
          <LockInBanner />
          {activeProjectsError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs text-red-600">{activeProjectsError}</p>
            </div>
          )}

          <OwnerControlCenter
            ownerProjects={ownerProjects}
            selectedProjectId={selectedProjectId}
            onSelectProject={setSelectedProjectId}
          />

          {activeProjects.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeProjects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => setSelectedProjectId(project.id)}
                  className={`px-3 py-2 rounded-lg border text-left transition-colors cursor-pointer ${
                    selectedActiveProject?.id === project.id
                      ? 'border-[#003D7A]/30 bg-[#003D7A]/10'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <p className="text-xs font-semibold text-gray-800">{project.title}</p>
                  <p className="text-[11px] text-gray-500">{project.domain}</p>
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <FlaskConical size={16} className="text-[#17A2B8]" />
            <h2 className="font-bold text-gray-800">Active Workspace</h2>
            <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-semibold ml-1">
              {activeProjects.length} active
            </span>
          </div>

          {loadingActiveProjects ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
              <Loader2 size={18} className="animate-spin text-[#003D7A] mx-auto mb-2" />
              <p className="text-sm text-gray-500">Loading active workspace...</p>
            </div>
          ) : selectedActiveProject ? (
            <ActiveProjectWorkspace
              activeProject={selectedActiveProject}
              onSubmitRole={handleSubmitRole}
              onApproveSubmission={handleApproveSubmission}
              onReviewApplicant={handleReviewApplicant}
              onResetSubmission={handleResetSubmission}
              onRemoveContributor={handleRemoveContributor}
              onLeaveProject={handleLeaveProject}
              onCompleteProject={handleCompleteProject}
              onViewProfile={handleViewProfile}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
              <p className="text-sm font-semibold text-gray-700">No active projects yet.</p>
              <p className="text-xs text-gray-500 mt-1">
                Apply to projects and get accepted to see active workspaces here.
              </p>
            </div>
          )}

          <ProjectArchiveSection
            archivedProjects={archivedProjects}
            loading={loadingArchiveProjects}
          />
        </div>
      </div>

      {profileModalOpen && (
        <PlatformProfileModal
          profile={profilePreview}
          loading={profileModalLoading}
          error={profileModalError}
          onClose={handleCloseProfileModal}
        />
      )}
    </div>
  );
}

// ─── Owner Control Center ────────────────────────────────────────────────────

function OwnerControlCenter({
  ownerProjects,
  selectedProjectId,
  onSelectProject,
}: {
  ownerProjects: ActiveProject[];
  selectedProjectId: string;
  onSelectProject: (projectId: string) => void;
}) {
  if (ownerProjects.length === 0) return null;

  const totals = ownerProjects.reduce(
    (acc, project) => {
      acc.applicants += project.applicantsQueue?.length || 0;
      acc.pendingReviews += project.pendingApprovals?.length || 0;
      acc.activeContributors += project.activeContributors?.length || 0;
      acc.awaitingReview +=
        project.activeContributors?.filter((contributor) => contributor.submissionStatus === 'submitted')
          .length || 0;
      return acc;
    },
    { applicants: 0, pendingReviews: 0, activeContributors: 0, awaitingReview: 0 }
  );

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Crown size={15} className="text-[#003D7A]" />
        <h3 className="text-sm font-semibold text-gray-800">Owner Control Center</h3>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
        {[
          { label: 'Your Projects', value: ownerProjects.length },
          { label: 'Pending Applicants', value: totals.applicants },
          { label: 'Pending Reviews', value: totals.pendingReviews },
          { label: 'Active Contributors', value: totals.activeContributors },
          { label: 'Submitted for Review', value: totals.awaitingReview },
        ].map((item) => (
          <div key={item.label} className="rounded-xl bg-[#F5F7FA] border border-gray-100 p-3">
            <p className="text-lg font-bold text-[#003D7A]">{item.value}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {ownerProjects.map((project) => (
          <div
            key={project.id}
            className={`rounded-xl border p-3 transition-colors ${
              selectedProjectId === project.id
                ? 'border-[#003D7A]/30 bg-[#003D7A]/5'
                : 'border-gray-100 bg-white'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">{project.title}</p>
                <p className="text-xs text-gray-500">{project.domain}</p>
              </div>
              <button
                type="button"
                onClick={() => onSelectProject(project.id)}
                className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Open
              </button>
            </div>

            <div className="mt-2.5 flex items-center gap-2 flex-wrap text-[11px]">
              <span className="px-2 py-0.5 rounded-md bg-[#17A2B8]/10 text-[#17A2B8] border border-[#17A2B8]/20">
                Applicants {project.applicantsQueue?.length || 0}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                Reviews {project.pendingApprovals?.length || 0}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#003D7A]/8 text-[#003D7A] border border-[#003D7A]/15">
                Contributors {project.activeContributors?.length || 0}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-gray-50 text-gray-600 border border-gray-200">
                Progress {project.progress}%
              </span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-gray-500">
        Contributors move to completed only after you review and approve their submission.
      </p>
    </section>
  );
}
