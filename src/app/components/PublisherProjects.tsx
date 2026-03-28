import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  Loader2,
  PlusSquare,
  Rss,
  Users,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import type {
  PublisherOngoingProjectInsight,
  PublisherProjectContributor,
  PublisherProjectTimelineEvent,
} from '../types';
import { fetchPublisherOngoingProjects } from '../services/projects';

function formatDate(value: string) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString();
}

function formatDateTime(value: string) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

function toLabel(value: string) {
  return value.replace(/_/g, ' ');
}

function statusPillClass(status: string) {
  if (status === 'approved' || status === 'accepted' || status === 'locked-in') {
    return 'bg-emerald-50 border-emerald-200 text-emerald-700';
  }
  if (status === 'submitted' || status === 'pending') {
    return 'bg-amber-50 border-amber-200 text-amber-700';
  }
  if (status === 'rejected' || status === 'withdrawn') {
    return 'bg-red-50 border-red-200 text-red-700';
  }
  return 'bg-gray-50 border-gray-200 text-gray-600';
}

function TimelineEventItem({ event }: { event: PublisherProjectTimelineEvent }) {
  return (
    <div className="relative pl-6 pb-5 last:pb-0">
      <span className="absolute left-[7px] top-0 bottom-0 w-px bg-gray-200" />
      <span className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-white border-2 border-[#003D7A]/40" />
      <div className="rounded-xl border border-gray-100 bg-white px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-gray-800">{event.label}</p>
          <span className={`text-[11px] px-2 py-0.5 rounded-md border capitalize ${statusPillClass(event.status)}`}>
            {toLabel(event.status)}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {event.userName} - {event.role}
        </p>
        <p className="text-[11px] text-gray-400 mt-1">{formatDateTime(event.at)}</p>
        {event.note ? <p className="text-xs text-gray-500 mt-2">Note: {event.note}</p> : null}
      </div>
    </div>
  );
}

function ContributorRow({ contributor }: { contributor: PublisherProjectContributor }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-[#F5F7FA] px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">{contributor.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {contributor.role} {contributor.email ? `- ${contributor.email}` : ''}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            Applied {formatDateTime(contributor.appliedAt)}
          </p>
          {contributor.submittedAt ? (
            <p className="text-[11px] text-gray-400">Submitted {formatDateTime(contributor.submittedAt)}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1 items-end">
          <span
            className={`text-[11px] px-2 py-0.5 rounded-md border capitalize ${statusPillClass(
              contributor.applicationStatus
            )}`}
          >
            {toLabel(contributor.applicationStatus)}
          </span>
          <span
            className={`text-[11px] px-2 py-0.5 rounded-md border capitalize ${statusPillClass(
              contributor.submissionStatus
            )}`}
          >
            {toLabel(contributor.submissionStatus)}
          </span>
        </div>
      </div>
      {contributor.reviewerNote ? (
        <p className="text-xs text-gray-500 mt-2">Reviewer note: {contributor.reviewerNote}</p>
      ) : null}
    </div>
  );
}

export function PublisherProjects() {
  const { setTab } = useApp();
  const [projects, setProjects] = useState<PublisherOngoingProjectInsight[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetchPublisherOngoingProjects();
        if (!mounted) return;
        setProjects(response.projects);
        setSelectedProjectId((current) => {
          if (!response.projects.length) return '';
          if (current && response.projects.some((project) => project.id === current)) return current;
          return response.projects[0].id;
        });
      } catch (loadError) {
        if (!mounted) return;
        setProjects([]);
        setSelectedProjectId('');
        setError(loadError instanceof Error ? loadError.message : 'Failed to load publisher projects.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) || projects[0] || null,
    [projects, selectedProjectId]
  );

  const totals = useMemo(
    () =>
      projects.reduce(
        (acc, project) => {
          acc.projects += 1;
          acc.pendingApplicants += project.stats.pendingApplicants;
          acc.submittedContributors += project.stats.submittedContributors;
          acc.approvedContributors += project.stats.approvedContributors;
          acc.timelineEvents += project.stats.timelineEventsCount;
          return acc;
        },
        {
          projects: 0,
          pendingApplicants: 0,
          submittedContributors: 0,
          approvedContributors: 0,
          timelineEvents: 0,
        }
      ),
    [projects]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 size={18} className="text-[#17A2B8]" />
            <h1 className="text-2xl font-bold text-[#003D7A]">Publisher Projects Insights</h1>
          </div>
          <p className="text-sm text-gray-500">
            Track all ongoing projects you published, contributor submission progress, and timeline events.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTab('dashboard')}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            <Rss size={14} className="inline mr-1" /> Dashboard
          </button>
          <button
            type="button"
            onClick={() => setTab('post')}
            className="px-3 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #003D7A, #6B4C9A)' }}
          >
            <PlusSquare size={14} className="inline mr-1" /> Publish Project
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Ongoing Projects', value: totals.projects, icon: <ClipboardList size={14} /> },
          { label: 'Pending Applicants', value: totals.pendingApplicants, icon: <Users size={14} /> },
          {
            label: 'Awaiting Review',
            value: totals.submittedContributors,
            icon: <Clock size={14} />,
          },
          {
            label: 'Approved Submissions',
            value: totals.approvedContributors,
            icon: <CheckCircle2 size={14} />,
          },
          { label: 'Timeline Events', value: totals.timelineEvents, icon: <Calendar size={14} /> },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-gray-100 bg-white shadow-sm p-3">
            <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
              {item.icon}
              <span>{item.label}</span>
            </div>
            <p className="text-xl font-bold text-[#003D7A]">{item.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <Loader2 size={18} className="animate-spin text-[#003D7A] mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading publisher projects...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <p className="text-sm font-semibold text-gray-700">No ongoing published projects found.</p>
          <p className="text-xs text-gray-500 mt-1">
            Publish a project or accept applicants to start seeing submission timelines.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-4 space-y-3">
            {projects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => setSelectedProjectId(project.id)}
                className={`w-full text-left rounded-xl border p-3 transition-colors cursor-pointer ${
                  selectedProject?.id === project.id
                    ? 'border-[#003D7A]/30 bg-[#003D7A]/5'
                    : 'border-gray-100 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{project.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{project.domain}</p>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-md border bg-white border-gray-200 text-gray-600 capitalize">
                    {project.status}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full"
                      style={{
                        width: `${project.progress}%`,
                        background: 'linear-gradient(90deg, #17A2B8, #003D7A)',
                      }}
                    />
                  </div>
                </div>
                <div className="mt-2.5 flex items-center gap-2 flex-wrap text-[11px] text-gray-500">
                  <span>Applicants {project.stats.totalApplicants}</span>
                  <span>Submitted {project.stats.submittedContributors}</span>
                  <span>Approved {project.stats.approvedContributors}</span>
                </div>
              </button>
            ))}
          </aside>

          <section className="lg:col-span-8 space-y-4">
            {selectedProject ? (
              <>
                <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-[#003D7A]">{selectedProject.title}</h2>
                      <p className="text-xs text-gray-500 mt-0.5">{selectedProject.domain}</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 capitalize">
                      {selectedProject.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-3">{selectedProject.description}</p>
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="rounded-lg border border-gray-100 bg-[#F5F7FA] px-2.5 py-2">
                      <p className="text-[11px] text-gray-500">Deadline</p>
                      <p className="text-xs font-semibold text-gray-700">{selectedProject.deadline || 'N/A'}</p>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-[#F5F7FA] px-2.5 py-2">
                      <p className="text-[11px] text-gray-500">Pending Applicants</p>
                      <p className="text-xs font-semibold text-gray-700">{selectedProject.stats.pendingApplicants}</p>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-[#F5F7FA] px-2.5 py-2">
                      <p className="text-[11px] text-gray-500">Accepted Contributors</p>
                      <p className="text-xs font-semibold text-gray-700">{selectedProject.stats.acceptedContributors}</p>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-[#F5F7FA] px-2.5 py-2">
                      <p className="text-[11px] text-gray-500">Timeline Events</p>
                      <p className="text-xs font-semibold text-gray-700">{selectedProject.stats.timelineEventsCount}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Users size={15} className="text-[#003D7A]" />
                    <h3 className="text-sm font-semibold text-gray-800">Contributors and Applicants</h3>
                  </div>
                  {selectedProject.contributors.length === 0 ? (
                    <p className="text-sm text-gray-500">No applications yet for this project.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedProject.contributors.map((contributor) => (
                        <ContributorRow key={contributor.applicationId} contributor={contributor} />
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={15} className="text-[#003D7A]" />
                    <h3 className="text-sm font-semibold text-gray-800">Submission Timeline</h3>
                  </div>
                  {selectedProject.timeline.length === 0 ? (
                    <p className="text-sm text-gray-500">No timeline events available yet.</p>
                  ) : (
                    <div>
                      {selectedProject.timeline.map((event) => (
                        <TimelineEventItem key={event.eventId} event={event} />
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </section>
        </div>
      )}
    </div>
  );
}
