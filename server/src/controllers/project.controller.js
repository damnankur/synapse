import { Project, ProjectApplication, TokenTransaction, User } from '../models/db.js';
import mongoose from 'mongoose';

const AUTO_APPROVAL_DAYS = 15;
const CONTRIBUTOR_REWARD_TOKENS = 30;
const OWNER_PROJECT_COMPLETION_REWARD_TOKENS = 20;

function toPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toClientProject(projectDoc) {
  return {
    id: projectDoc.projectCode || String(projectDoc._id),
    title: projectDoc.title,
    domain: projectDoc.domain,
    description: projectDoc.description,
    requiredRoles: projectDoc.requiredRoles || [],
    status: projectDoc.status,
    creator: projectDoc.creator,
    creatorRole: projectDoc.creatorRole,
    costToApply: projectDoc.costToApply ?? 10,
    applicants: projectDoc.applicants ?? 0,
    deadline: projectDoc.deadline
      ? new Date(projectDoc.deadline).toISOString().split('T')[0]
      : '',
    tags: projectDoc.tags || [],
    maxTeamSize: projectDoc.maxTeamSize ?? 1,
    featured: Boolean(projectDoc.featured),
  };
}

function toClientUser(user) {
  return {
    id: user.userCode || String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    isEmailVisible: Boolean(user.isEmailVisible),
    isPhoneVisible: Boolean(user.isPhoneVisible),
    role: user.role,
    initials: user.initials,
    tokens: user.tokens,
    university: user.university,
    department: user.department,
    bio: user.bio,
    skills: user.skills || [],
    completedProjects: user.completedProjects || 0,
    joinDate: user.joinDate || '',
    permissions: user.permissions || [],
  };
}

function sanitizeStringArray(values) {
  if (!Array.isArray(values)) return [];
  const unique = new Set();

  values.forEach((value) => {
    const normalized = String(value || '').trim();
    if (normalized) unique.add(normalized);
  });

  return Array.from(unique);
}

function sanitizeRoleArray(values) {
  if (!Array.isArray(values)) return [];

  return values
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .slice(0, 100);
}

function buildProjectCode() {
  return `proj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeDateLabel(dateValue) {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
}

function normalizeIsoDateTime(dateValue) {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString();
}

function buildContributorMilestones(status) {
  return [
    { title: 'Project role accepted', completed: true },
    { title: 'Contribution work in progress', completed: status !== 'not_submitted' },
    { title: 'Role submission sent to owner', completed: ['submitted', 'approved'].includes(status) },
    { title: 'Owner approval and reward released', completed: status === 'approved' },
  ];
}

function buildOwnerMilestones(totalContributors, approvedContributors) {
  return [
    { title: 'Project published and contributors onboarded', completed: true },
    { title: 'Contributors submit completion requests', completed: totalContributors > 0 },
    { title: 'Owner reviews and approves submissions', completed: approvedContributors > 0 },
    { title: 'All active contributors completed', completed: totalContributors > 0 && approvedContributors >= totalContributors },
  ];
}

function buildTeamMember(user, role, isCurrentUser = false) {
  return {
    id: user.userCode || String(user._id),
    name: user.name,
    role,
    initials: user.initials || 'U',
    avatarColor: isCurrentUser ? '#17A2B8' : '#6B4C9A',
    status: 'active',
    isCurrentUser,
  };
}

async function resolveProjectByAnyId(projectId, extraFilter = {}) {
  const lookup = [{ projectCode: projectId }];
  if (mongoose.Types.ObjectId.isValid(projectId)) {
    lookup.push({ _id: projectId });
  }

  return Project.findOne({
    ...extraFilter,
    $or: lookup,
  });
}

async function recomputeProjectStatus(projectId) {
  const project = await Project.findById(projectId);
  if (!project) return null;
  if (project.status === 'completed') return project;

  const activeContributors = await ProjectApplication.find({
    projectId,
    status: { $in: ['accepted', 'locked-in'] },
  }).lean();

  if (activeContributors.length === 0) {
    if (project.status !== 'open') {
      project.status = 'open';
      await project.save();
    }
    return project;
  }

  // Keep project active until owner explicitly marks it complete.
  // Contributor approvals should not auto-complete owner projects.
  project.status = 'in-progress';
  await project.save();
  return project;
}

function buildArchiveOutcomeForApplication(application) {
  if (application.status === 'withdrawn') return 'Left project (no reward)';
  if (application.status === 'rejected') return 'Removed / rejected';
  if (application.completionSubmissionStatus === 'approved') return 'Approved + rewarded';
  if (application.completionSubmissionStatus === 'submitted') return 'Submitted (not approved)';
  return 'Participated';
}

function buildSubmissionTimeline(application) {
  const events = [];
  const userName = application.userId?.name || 'Contributor';
  const roleLabel = application.assignedRole || 'Contributor';

  if (application.appliedAt) {
    events.push({
      eventId: `${application._id}-appliedAt`,
      applicationId: String(application._id),
      userId: String(application.userId?._id || application.userId || ''),
      userName,
      role: roleLabel,
      eventType: 'applied',
      label: `${userName} applied to the project`,
      status: application.status,
      note: application.message || '',
      at: normalizeIsoDateTime(application.appliedAt),
    });
  }

  if (application.respondedAt) {
    events.push({
      eventId: `${application._id}-respondedAt`,
      applicationId: String(application._id),
      userId: String(application.userId?._id || application.userId || ''),
      userName,
      role: roleLabel,
      eventType: 'application_reviewed',
      label:
        application.status === 'accepted'
          ? `${userName} was accepted by publisher`
          : `${userName} was rejected by publisher`,
      status: application.status,
      note: application.reviewerNote || '',
      at: normalizeIsoDateTime(application.respondedAt),
    });
  }

  if (application.submittedAt) {
    events.push({
      eventId: `${application._id}-submittedAt`,
      applicationId: String(application._id),
      userId: String(application.userId?._id || application.userId || ''),
      userName,
      role: roleLabel,
      eventType: 'submission_submitted',
      label: `${userName} submitted role completion`,
      status: application.completionSubmissionStatus,
      note: application.completionSubmissionNote || '',
      at: normalizeIsoDateTime(application.submittedAt),
    });
  }

  if (application.reviewedAt) {
    const isApproved = application.completionSubmissionStatus === 'approved';
    events.push({
      eventId: `${application._id}-reviewedAt`,
      applicationId: String(application._id),
      userId: String(application.userId?._id || application.userId || ''),
      userName,
      role: roleLabel,
      eventType: isApproved ? 'submission_approved' : 'submission_reviewed',
      label: isApproved
        ? `${userName}'s submission was approved`
        : `${userName}'s submission was reviewed`,
      status: application.completionSubmissionStatus,
      note: application.reviewerNote || '',
      at: normalizeIsoDateTime(application.reviewedAt),
    });
  }

  return events;
}

async function autoApproveExpiredSubmissions(projectIds = []) {
  const now = new Date();
  const cutoff = new Date(now.getTime() - AUTO_APPROVAL_DAYS * 24 * 60 * 60 * 1000);

  const filter = {
    status: { $in: ['accepted', 'locked-in'] },
    completionSubmissionStatus: 'submitted',
    submittedAt: { $lte: cutoff },
  };

  if (projectIds.length > 0) {
    filter.projectId = { $in: projectIds };
  }

  const staleSubmissions = await ProjectApplication.find(filter);
  if (!staleSubmissions.length) return;
  const touchedProjectIds = new Set();

  for (const application of staleSubmissions) {
    const [project, contributor] = await Promise.all([
      Project.findById(application.projectId),
      User.findById(application.userId),
    ]);
    if (!project || !contributor) continue;

    const rewardTokens = CONTRIBUTOR_REWARD_TOKENS;
    application.completionSubmissionStatus = 'approved';
    application.reviewerNote = `Auto-approved after ${AUTO_APPROVAL_DAYS} days without owner review.`;
    application.reviewedAt = now;
    await application.save();

    contributor.tokens = Math.max(0, contributor.tokens + rewardTokens);
    contributor.completedProjects = Math.max(0, (contributor.completedProjects || 0) + 1);
    await contributor.save();

    await TokenTransaction.create({
      userId: contributor._id,
      type: 'project_reward',
      amount: rewardTokens,
      balanceAfter: contributor.tokens,
      projectId: project._id,
      applicationId: application._id,
      note: `Auto-approved completion for "${project.title}" after ${AUTO_APPROVAL_DAYS} days`,
    });
    touchedProjectIds.add(String(project._id));
  }

  for (const projectId of touchedProjectIds) {
    // Keep project status aligned after automatic approvals.
    await recomputeProjectStatus(projectId);
  }
}

export async function listProjects(req, res) {
  const q = String(req.query.q || '').trim();
  const domain = String(req.query.domain || '').trim();
  const page = toPositiveInteger(req.query.page, 1);
  const limit = Math.min(toPositiveInteger(req.query.limit, 9), 24);

  const filter = {};

  if (domain && domain.toLowerCase() !== 'all') {
    filter.domain = { $regex: escapeRegex(domain), $options: 'i' };
  }

  if (q) {
    const safeQuery = escapeRegex(q);
    filter.$or = [
      { title: { $regex: safeQuery, $options: 'i' } },
      { domain: { $regex: safeQuery, $options: 'i' } },
      { description: { $regex: safeQuery, $options: 'i' } },
      { tags: { $elemMatch: { $regex: safeQuery, $options: 'i' } } },
      { requiredRoles: { $elemMatch: { $regex: safeQuery, $options: 'i' } } },
      { creator: { $regex: safeQuery, $options: 'i' } },
      { creatorRole: { $regex: safeQuery, $options: 'i' } },
    ];
  }

  const total = await Project.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const skip = (safePage - 1) * limit;

  const projects = await Project.find(filter)
    .sort({ featured: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return res.json({
    projects: projects.map(toClientProject),
    pagination: {
      page: safePage,
      limit,
      total,
      totalPages,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1,
    },
  });
}

export async function createProject(req, res) {
  const userId = req.auth?.sub;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const title = String(req.body.title || '').trim();
  const domain = String(req.body.domain || '').trim();
  const description = String(req.body.description || '').trim();
  const requiredRoles = sanitizeRoleArray(req.body.requiredRoles);
  const tags = sanitizeStringArray(req.body.tags);
  const publishCost = 10;

  if (!title || !domain || !description) {
    return res.status(400).json({ message: 'title, domain and description are required.' });
  }

  if (requiredRoles.length === 0) {
    return res.status(400).json({ message: 'At least one required role is required.' });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  if (user.tokens < publishCost) {
    return res.status(400).json({ message: 'You need at least 10 tokens to publish a project.' });
  }

  const project = await Project.create({
    projectCode: buildProjectCode(),
    title,
    domain,
    description,
    requiredRoles,
    status: 'open',
    creatorUserId: user._id,
    creator: user.name,
    creatorRole: user.role,
    costToApply: publishCost,
    applicants: 0,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    tags,
    maxTeamSize: requiredRoles.length + 1,
    featured: false,
  });

  user.tokens = Math.max(0, user.tokens - publishCost);
  await user.save();

  await TokenTransaction.create({
    userId: user._id,
    type: 'publish',
    amount: -publishCost,
    balanceAfter: user.tokens,
    projectId: project._id,
    note: `Published project "${project.title}"`,
  });

  return res.status(201).json({
    project: toClientProject(project),
    user: toClientUser(user),
    tokenDelta: -publishCost,
  });
}

export async function applyToProject(req, res) {
  const userId = req.auth?.sub;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const { projectId } = req.params;
  const project = await resolveProjectByAnyId(projectId);

  if (!project) {
    return res.status(404).json({ message: 'Project not found.' });
  }

  if (String(project.creatorUserId) === String(userId)) {
    return res.status(400).json({ message: 'Project owner cannot apply to own project.' });
  }

  const existing = await ProjectApplication.findOne({
    projectId: project._id,
    userId,
  });
  if (existing) {
    return res.status(409).json({ message: 'You have already applied to this project.' });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const applyCost = project.costToApply || 10;
  if (user.tokens < applyCost) {
    return res.status(400).json({ message: 'Insufficient tokens to apply.' });
  }

  const application = await ProjectApplication.create({
    projectId: project._id,
    userId: user._id,
    status: 'pending',
    assignedRole: String(req.body.assignedRole || '').trim(),
    commitmentTokens: applyCost,
    message: String(req.body.message || '').trim(),
  });

  project.applicants = Math.max(0, (project.applicants || 0) + 1);
  await project.save();

  user.tokens = Math.max(0, user.tokens - applyCost);
  await user.save();

  await TokenTransaction.create({
    userId: user._id,
    type: 'apply',
    amount: -applyCost,
    balanceAfter: user.tokens,
    projectId: project._id,
    applicationId: application._id,
    note: `Applied to project "${project.title}"`,
  });

  return res.status(201).json({
    applicationId: String(application._id),
    project: toClientProject(project),
    user: toClientUser(user),
    tokenDelta: -applyCost,
    status: application.status,
  });
}

export async function reviewProjectApplication(req, res) {
  const ownerId = req.auth?.sub;
  if (!ownerId) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const { projectId, applicationId } = req.params;
  const action = String(req.body.action || '').trim().toLowerCase();
  const reviewerNote = String(req.body.note || '').trim();
  const assignedRole = String(req.body.assignedRole || '').trim();

  if (!['accept', 'reject'].includes(action)) {
    return res.status(400).json({ message: 'action must be either "accept" or "reject".' });
  }

  const project = await resolveProjectByAnyId(projectId, { creatorUserId: ownerId });
  if (!project) {
    return res.status(404).json({ message: 'Project not found or you are not the owner.' });
  }
  if (project.status === 'completed') {
    return res.status(400).json({ message: 'Completed projects cannot be reviewed.' });
  }

  const application = await ProjectApplication.findOne({
    _id: applicationId,
    projectId: project._id,
    status: 'pending',
  });

  if (!application) {
    return res.status(404).json({ message: 'Pending application not found.' });
  }

  const contributor = await User.findById(application.userId);
  if (!contributor) {
    return res.status(404).json({ message: 'Applicant user not found.' });
  }

  application.respondedAt = new Date();

  if (action === 'accept') {
    application.status = 'accepted';
    application.assignedRole = assignedRole || application.assignedRole || 'Contributor';
    application.completionSubmissionStatus = 'not_submitted';
    application.reviewerNote = reviewerNote;
    await application.save();

    if (project.status === 'open') {
      project.status = 'in-progress';
      await project.save();
    }

    return res.json({
      message: 'Applicant selected for the project.',
      applicationId: String(application._id),
      status: application.status,
    });
  }

  application.status = 'rejected';
  application.completionSubmissionStatus = 'rejected';
  application.reviewerNote = reviewerNote || 'Not selected by project owner.';
  await application.save();

  contributor.tokens = Math.max(0, contributor.tokens + (application.commitmentTokens || 0));
  await contributor.save();

  await TokenTransaction.create({
    userId: contributor._id,
    type: 'commit_refund',
    amount: application.commitmentTokens || 0,
    balanceAfter: contributor.tokens,
    projectId: project._id,
    applicationId: application._id,
    note: `Application rejected for "${project.title}". Commitment refunded.`,
  });

  return res.json({
    message: 'Applicant rejected and commitment refunded.',
    applicationId: String(application._id),
    status: application.status,
  });
}

export async function removeContributor(req, res) {
  const ownerId = req.auth?.sub;
  if (!ownerId) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const { projectId, applicationId } = req.params;
  const reviewerNote = String(req.body.note || '').trim();

  const project = await resolveProjectByAnyId(projectId, { creatorUserId: ownerId });
  if (!project) {
    return res.status(404).json({ message: 'Project not found or you are not the owner.' });
  }
  if (project.status === 'completed') {
    return res.status(400).json({ message: 'Completed projects cannot be modified.' });
  }

  const application = await ProjectApplication.findOne({
    _id: applicationId,
    projectId: project._id,
    status: { $in: ['accepted', 'locked-in'] },
  });

  if (!application) {
    return res.status(404).json({ message: 'Active contributor not found for this project.' });
  }

  if (application.completionSubmissionStatus === 'approved') {
    return res
      .status(400)
      .json({ message: 'Approved contributors cannot be removed from this workflow.' });
  }

  application.status = 'rejected';
  application.completionSubmissionStatus = 'rejected';
  application.reviewerNote = reviewerNote || 'Removed by project owner due to project issues.';
  application.reviewedAt = new Date();
  await application.save();

  await recomputeProjectStatus(project._id);

  return res.json({
    message: 'Contributor removed without reward.',
    applicationId: String(application._id),
  });
}

export async function resetContributorSubmission(req, res) {
  const ownerId = req.auth?.sub;
  if (!ownerId) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const { projectId, applicationId } = req.params;
  const reviewerNote = String(req.body.note || '').trim();

  const project = await resolveProjectByAnyId(projectId, { creatorUserId: ownerId });
  if (!project) {
    return res.status(404).json({ message: 'Project not found or you are not the owner.' });
  }
  if (project.status === 'completed') {
    return res.status(400).json({ message: 'Completed projects cannot be modified.' });
  }

  const application = await ProjectApplication.findOne({
    _id: applicationId,
    projectId: project._id,
    status: { $in: ['accepted', 'locked-in'] },
  });

  if (!application) {
    return res.status(404).json({ message: 'Application not found.' });
  }

  if (application.completionSubmissionStatus === 'approved') {
    return res.status(400).json({
      message:
        'Approved completions cannot be reset. Remove contributor before approval if needed.',
    });
  }

  application.completionSubmissionStatus = 'not_submitted';
  application.completionSubmissionNote = '';
  application.reviewerNote = reviewerNote || 'Submission reset by project owner.';
  application.submittedAt = undefined;
  application.reviewedAt = new Date();
  await application.save();

  await recomputeProjectStatus(project._id);

  return res.json({
    message: 'Submission reset. Contributor must submit again.',
    applicationId: String(application._id),
    submissionStatus: application.completionSubmissionStatus,
  });
}

export async function leaveProject(req, res) {
  const userId = req.auth?.sub;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const { projectId } = req.params;
  const note = String(req.body.note || '').trim();

  const project = await resolveProjectByAnyId(projectId);
  if (!project) {
    return res.status(404).json({ message: 'Project not found.' });
  }
  if (project.status === 'completed') {
    return res.status(400).json({ message: 'This project is already completed.' });
  }

  const application = await ProjectApplication.findOne({
    projectId: project._id,
    userId,
    status: { $in: ['accepted', 'locked-in'] },
  });

  if (!application) {
    return res.status(404).json({ message: 'You are not an active contributor on this project.' });
  }

  if (application.completionSubmissionStatus === 'approved') {
    return res.status(400).json({ message: 'Completed contributors cannot leave this project.' });
  }

  application.status = 'withdrawn';
  application.completionSubmissionStatus = 'rejected';
  application.reviewerNote = note || 'Contributor left the project midway.';
  application.reviewedAt = new Date();
  await application.save();

  await recomputeProjectStatus(project._id);

  return res.json({
    message: 'You have left the project. Commitment and rewards are forfeited.',
    projectId: project.projectCode || String(project._id),
  });
}

export async function getPendingApplications(req, res) {
  const userId = req.auth?.sub;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const currentUser = await User.findById(userId).lean();
  if (!currentUser) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const pendingApplications = await ProjectApplication.find({
    userId: currentUser._id,
    status: 'pending',
  })
    .populate('projectId')
    .sort({ appliedAt: -1 })
    .lean();

  const applications = pendingApplications
    .filter((application) => application.projectId && application.projectId.status !== 'completed')
    .map((application) => ({
      applicationId: String(application._id),
      projectId: application.projectId.projectCode || String(application.projectId._id),
      title: application.projectId.title,
      domain: application.projectId.domain,
      appliedAt: normalizeDateLabel(application.appliedAt),
      status: application.status,
      publisherUserId: String(application.projectId.creatorUserId || ''),
      publisherName: application.projectId.creator || '',
      publisherRole: application.projectId.creatorRole || '',
    }));

  return res.json({ applications });
}

export async function getActiveProjects(req, res) {
  const userId = req.auth?.sub;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const currentUser = await User.findById(userId).lean();
  if (!currentUser) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const ownerProjects = await Project.find({
    creatorUserId: currentUser._id,
    status: { $in: ['open', 'in-progress'] },
  })
    .sort({ createdAt: -1 })
    .lean();

  const ownerProjectIds = ownerProjects.map((project) => project._id);

  const ownerProjectApplications = ownerProjectIds.length
    ? await ProjectApplication.find({
        projectId: { $in: ownerProjectIds },
        status: { $in: ['pending', 'accepted', 'locked-in'] },
      })
        .populate('userId')
        .lean()
    : [];

  const ownerWorkspaces = ownerProjects.map((project) => {
    const projectApplications = ownerProjectApplications.filter(
      (application) => String(application.projectId) === String(project._id)
    );
    const members = projectApplications.filter((application) =>
      ['accepted', 'locked-in'].includes(application.status)
    );
    const approved = members.filter(
      (application) => application.completionSubmissionStatus === 'approved'
    );
    const pendingApprovals = members
      .filter((application) => application.completionSubmissionStatus === 'submitted')
      .map((application) => ({
        applicationId: String(application._id),
        userId: String(application.userId?._id || application.userId),
        name: application.userId?.name || 'Contributor',
        role: application.assignedRole || 'Contributor',
        submittedAt: normalizeDateLabel(application.submittedAt),
      }));
    const applicantsQueue = projectApplications
      .filter((application) => application.status === 'pending')
      .map((application) => ({
        applicationId: String(application._id),
        userId: String(application.userId?._id || application.userId),
        name: application.userId?.name || 'Applicant',
        role: application.assignedRole || application.message || 'Role not specified',
        message: application.message || '',
        appliedAt: normalizeDateLabel(application.appliedAt),
      }));
    const activeContributors = members.map((application) => ({
      applicationId: String(application._id),
      userId: String(application.userId?._id || application.userId),
      name: application.userId?.name || 'Contributor',
      role: application.assignedRole || 'Contributor',
      submissionStatus: application.completionSubmissionStatus || 'not_submitted',
      submittedAt: normalizeDateLabel(application.submittedAt),
      status: application.status,
    }));

    const contributorCount = members.length;
    const progress =
      contributorCount > 0
        ? Math.min(100, Math.round((approved.length / contributorCount) * 100))
        : project.status === 'completed'
        ? 100
        : 20;

    return {
      id: project.projectCode || String(project._id),
      title: project.title,
      domain: project.domain,
      description: project.description,
      progress,
      team: [
        buildTeamMember(currentUser, 'Project Owner', true),
        ...members
          .filter((application) => application.userId)
          .map((application) =>
            buildTeamMember(
              application.userId,
              application.assignedRole || 'Contributor',
              String(application.userId._id) === String(currentUser._id)
            )
          ),
      ],
      myRole: 'Project Owner',
      myTaskTitle: 'Review submitted contributions and approve completion',
      myTaskCompleted: project.status === 'completed',
      deadline: normalizeDateLabel(project.deadline),
      tags: project.tags || [],
      milestones: buildOwnerMilestones(contributorCount, approved.length),
      isOwner: true,
      submissionStatus: 'not_submitted',
      pendingApprovals,
      applicantsQueue,
      activeContributors,
      ownerUserId: String(project.creatorUserId || currentUser._id),
      ownerName: project.creator || currentUser.name,
      ownerRole: project.creatorRole || currentUser.role,
    };
  });

  const contributorApplications = await ProjectApplication.find({
    userId: currentUser._id,
    status: { $in: ['accepted', 'locked-in'] },
    completionSubmissionStatus: { $ne: 'approved' },
  })
    .populate('projectId')
    .lean();

  const contributorProjectOwnerIds = Array.from(
    new Set(
      contributorApplications
        .map((application) => application.projectId?.creatorUserId)
        .filter(Boolean)
        .map((id) => String(id))
    )
  );

  const owners = contributorProjectOwnerIds.length
    ? await User.find({ _id: { $in: contributorProjectOwnerIds } }).lean()
    : [];
  const ownerMap = new Map(owners.map((owner) => [String(owner._id), owner]));

  const contributorWorkspaces = contributorApplications
    .filter(
      (application) =>
        application.projectId && ['open', 'in-progress'].includes(application.projectId.status)
    )
    .map((application) => {
      const project = application.projectId;
      const owner = ownerMap.get(String(project.creatorUserId));
      const submissionStatus = application.completionSubmissionStatus || 'not_submitted';
      const progress =
        submissionStatus === 'approved' ? 100 : submissionStatus === 'submitted' ? 80 : 60;

      return {
        id: project.projectCode || String(project._id),
        title: project.title,
        domain: project.domain,
        description: project.description,
        progress,
        team: [
          ...(owner ? [buildTeamMember(owner, 'Project Owner')] : []),
          buildTeamMember(currentUser, application.assignedRole || 'Contributor', true),
        ],
        myRole: application.assignedRole || 'Contributor',
        myTaskTitle: `Deliver contribution for "${project.title}"`,
        myTaskCompleted: submissionStatus === 'approved',
        deadline: normalizeDateLabel(project.deadline),
        tags: project.tags || [],
        milestones: buildContributorMilestones(submissionStatus),
        isOwner: false,
        applicationId: String(application._id),
        submissionStatus,
        pendingApprovals: [],
        applicantsQueue: [],
        activeContributors: [],
        ownerUserId: String(project.creatorUserId || ''),
        ownerName: project.creator || owner?.name || 'Project Owner',
        ownerRole: project.creatorRole || owner?.role || 'Project Owner',
      };
    });

  const activeProjects = [...ownerWorkspaces, ...contributorWorkspaces].sort((a, b) =>
    a.title.localeCompare(b.title)
  );

  return res.json({ projects: activeProjects });
}

export async function getPublisherOngoingProjectInsights(req, res) {
  const ownerId = req.auth?.sub;
  if (!ownerId) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const owner = await User.findById(ownerId).lean();
  if (!owner) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const ongoingProjects = await Project.find({
    creatorUserId: owner._id,
    status: { $in: ['open', 'in-progress'] },
  })
    .sort({ updatedAt: -1 })
    .lean();

  if (!ongoingProjects.length) {
    return res.json({ projects: [] });
  }

  const projectIds = ongoingProjects.map((project) => project._id);
  const allApplications = await ProjectApplication.find({
    projectId: { $in: projectIds },
  })
    .populate('userId')
    .sort({ appliedAt: 1 })
    .lean();

  const insightProjects = ongoingProjects.map((project) => {
    const projectApplications = allApplications.filter(
      (application) => String(application.projectId) === String(project._id)
    );

    const acceptedContributors = projectApplications.filter((application) =>
      ['accepted', 'locked-in'].includes(application.status)
    );

    const approvedContributors = acceptedContributors.filter(
      (application) => application.completionSubmissionStatus === 'approved'
    );

    const submittedContributors = acceptedContributors.filter(
      (application) => application.completionSubmissionStatus === 'submitted'
    );

    const timeline = projectApplications
      .flatMap((application) => buildSubmissionTimeline(application))
      .filter((event) => Boolean(event.at))
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

    const contributors = projectApplications
      .filter((application) => application.userId)
      .map((application) => ({
        applicationId: String(application._id),
        userId: String(application.userId?._id || application.userId || ''),
        name: application.userId?.name || 'Contributor',
        email: application.userId?.email || '',
        role: application.assignedRole || 'Contributor',
        applicationStatus: application.status,
        submissionStatus: application.completionSubmissionStatus || 'not_submitted',
        message: application.message || '',
        reviewerNote: application.reviewerNote || '',
        appliedAt: normalizeIsoDateTime(application.appliedAt),
        respondedAt: normalizeIsoDateTime(application.respondedAt),
        submittedAt: normalizeIsoDateTime(application.submittedAt),
        reviewedAt: normalizeIsoDateTime(application.reviewedAt),
      }));

    const progress =
      acceptedContributors.length > 0
        ? Math.min(100, Math.round((approvedContributors.length / acceptedContributors.length) * 100))
        : project.status === 'in-progress'
        ? 20
        : 0;

    return {
      id: project.projectCode || String(project._id),
      title: project.title,
      domain: project.domain,
      description: project.description,
      status: project.status,
      tags: project.tags || [],
      deadline: normalizeDateLabel(project.deadline),
      createdAt: normalizeIsoDateTime(project.createdAt),
      updatedAt: normalizeIsoDateTime(project.updatedAt),
      progress,
      stats: {
        totalApplicants: projectApplications.length,
        pendingApplicants: projectApplications.filter((application) => application.status === 'pending').length,
        acceptedContributors: acceptedContributors.length,
        submittedContributors: submittedContributors.length,
        approvedContributors: approvedContributors.length,
        rejectedContributors: projectApplications.filter((application) => application.status === 'rejected').length,
        withdrawnContributors: projectApplications.filter((application) => application.status === 'withdrawn').length,
        timelineEventsCount: timeline.length,
      },
      contributors,
      timeline,
    };
  });

  return res.json({ projects: insightProjects });
}

export async function submitRoleCompletion(req, res) {
  const userId = req.auth?.sub;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const { projectId, applicationId } = req.params;
  const submissionNote = String(req.body.note || '').trim();

  const project = await resolveProjectByAnyId(projectId);
  if (!project) {
    return res.status(404).json({ message: 'Project not found.' });
  }
  if (project.status === 'completed') {
    return res.status(400).json({ message: 'Project is already completed.' });
  }

  const application = await ProjectApplication.findOne({
    _id: applicationId,
    projectId: project._id,
    userId,
    status: { $in: ['accepted', 'locked-in'] },
  });

  if (!application) {
    return res.status(404).json({ message: 'Active application not found for this project.' });
  }

  if (application.completionSubmissionStatus === 'approved') {
    return res.status(400).json({ message: 'This role is already approved as completed.' });
  }

  if (application.completionSubmissionStatus === 'submitted') {
    return res.status(400).json({ message: 'Completion is already submitted for owner review.' });
  }

  application.completionSubmissionStatus = 'submitted';
  application.completionSubmissionNote = submissionNote;
  application.submittedAt = new Date();
  await application.save();

  if (project.status === 'open') {
    project.status = 'in-progress';
    await project.save();
  } else {
    await recomputeProjectStatus(project._id);
  }

  return res.json({
    message: 'Contribution submitted for owner review.',
    projectId: project.projectCode || String(project._id),
    applicationId: String(application._id),
    submissionStatus: application.completionSubmissionStatus,
  });
}

export async function approveRoleCompletion(req, res) {
  const ownerId = req.auth?.sub;
  if (!ownerId) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const { projectId, applicationId } = req.params;
  const reviewerNote = String(req.body.note || '').trim();
  const rewardTokens = CONTRIBUTOR_REWARD_TOKENS;

  const project = await resolveProjectByAnyId(projectId, { creatorUserId: ownerId });

  if (!project) {
    return res.status(404).json({ message: 'Project not found or you are not the project owner.' });
  }
  if (project.status === 'completed') {
    return res.status(400).json({ message: 'Project is already completed.' });
  }

  const application = await ProjectApplication.findOne({
    _id: applicationId,
    projectId: project._id,
    status: { $in: ['accepted', 'locked-in'] },
  });

  if (!application) {
    return res.status(404).json({ message: 'Application not found for this project.' });
  }

  if (application.completionSubmissionStatus !== 'submitted') {
    return res.status(400).json({ message: 'This contribution is not awaiting approval.' });
  }

  const contributor = await User.findById(application.userId);
  if (!contributor) {
    return res.status(404).json({ message: 'Contributor user not found.' });
  }

  application.completionSubmissionStatus = 'approved';
  application.reviewerNote = reviewerNote;
  application.reviewedAt = new Date();
  await application.save();

  contributor.tokens = Math.max(0, contributor.tokens + rewardTokens);
  contributor.completedProjects = Math.max(0, (contributor.completedProjects || 0) + 1);
  await contributor.save();

  await TokenTransaction.create({
    userId: contributor._id,
    type: 'project_reward',
    amount: rewardTokens,
    balanceAfter: contributor.tokens,
    projectId: project._id,
    applicationId: application._id,
    note: `Completion approved by project owner for "${project.title}"`,
  });

  await recomputeProjectStatus(project._id);

  return res.json({
    message: 'Contribution approved and reward credited.',
    contributor: toClientUser(contributor),
    rewardTokens,
  });
}

export async function completeProjectByOwner(req, res) {
  const ownerId = req.auth?.sub;
  if (!ownerId) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const { projectId } = req.params;
  const reviewerNote = String(req.body.note || '').trim();
  const contributorRewardTokens = CONTRIBUTOR_REWARD_TOKENS;
  const ownerRewardTokens = OWNER_PROJECT_COMPLETION_REWARD_TOKENS;

  const project = await resolveProjectByAnyId(projectId, { creatorUserId: ownerId });
  if (!project) {
    return res.status(404).json({ message: 'Project not found or you are not the project owner.' });
  }

  const owner = await User.findById(ownerId);
  if (!owner) {
    return res.status(404).json({ message: 'Owner user not found.' });
  }

  if (project.status === 'completed') {
    return res.json({
      message: 'Project is already completed.',
      projectId: project.projectCode || String(project._id),
      autoApprovedCount: 0,
      rewardedCount: 0,
      ownerRewardTokens: 0,
    });
  }

  const activeApplications = await ProjectApplication.find({
    projectId: project._id,
    status: { $in: ['accepted', 'locked-in'] },
  });

  let autoApprovedCount = 0;
  let rewardedCount = 0;

  for (const application of activeApplications) {
    if (application.completionSubmissionStatus !== 'submitted') continue;

    const contributor = await User.findById(application.userId);
    if (!contributor) continue;

    application.completionSubmissionStatus = 'approved';
    application.reviewerNote =
      reviewerNote || 'Approved by owner during final project completion.';
    application.reviewedAt = new Date();
    await application.save();

    contributor.tokens = Math.max(0, contributor.tokens + contributorRewardTokens);
    contributor.completedProjects = Math.max(0, (contributor.completedProjects || 0) + 1);
    await contributor.save();

    await TokenTransaction.create({
      userId: contributor._id,
      type: 'project_reward',
      amount: contributorRewardTokens,
      balanceAfter: contributor.tokens,
      projectId: project._id,
      applicationId: application._id,
      note: `Final completion reward released for "${project.title}"`,
    });

    autoApprovedCount += 1;
    rewardedCount += 1;
  }

  project.status = 'completed';
  owner.tokens = Math.max(0, owner.tokens + ownerRewardTokens);
  owner.completedProjects = Math.max(0, (owner.completedProjects || 0) + 1);

  await Promise.all([
    project.save(),
    owner.save(),
    TokenTransaction.create({
      userId: owner._id,
      type: 'project_reward',
      amount: ownerRewardTokens,
      balanceAfter: owner.tokens,
      projectId: project._id,
      note: `Owner completion reward for "${project.title}"`,
    }),
  ]);

  return res.json({
    message: 'Project marked as completed and moved to archive.',
    projectId: project.projectCode || String(project._id),
    autoApprovedCount,
    rewardedCount,
    ownerRewardTokens,
  });
}

export async function getArchivedProjects(req, res) {
  const userId = req.auth?.sub;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const currentUser = await User.findById(userId).lean();
  if (!currentUser) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const ownerProjects = await Project.find({
    creatorUserId: currentUser._id,
    status: 'completed',
  })
    .sort({ updatedAt: -1 })
    .lean();

  const ownerProjectIds = ownerProjects.map((project) => project._id);
  const ownerApplications = ownerProjectIds.length
    ? await ProjectApplication.find({
        projectId: { $in: ownerProjectIds },
        status: { $in: ['accepted', 'locked-in'] },
      }).lean()
    : [];

  const ownerProjectContributorMap = ownerApplications.reduce((acc, application) => {
    const key = String(application.projectId);
    const current = acc.get(key) || { contributors: 0, approved: 0 };
    current.contributors += 1;
    if (application.completionSubmissionStatus === 'approved') current.approved += 1;
    acc.set(key, current);
    return acc;
  }, new Map());

  const ownerArchive = ownerProjects.map((project) => {
    const stats =
      ownerProjectContributorMap.get(String(project._id)) || { contributors: 0, approved: 0 };
    return {
      id: `${project.projectCode || String(project._id)}-owner`,
      projectId: project.projectCode || String(project._id),
      title: project.title,
      domain: project.domain,
      role: 'Project Owner',
      isOwner: true,
      outcome: `Completed · ${stats.approved}/${stats.contributors} contributors approved`,
      rewardTokens: OWNER_PROJECT_COMPLETION_REWARD_TOKENS,
      completedOn: normalizeDateLabel(project.updatedAt),
      tags: project.tags || [],
    };
  });

  const contributorApplications = await ProjectApplication.find({
    userId: currentUser._id,
    status: { $in: ['accepted', 'locked-in', 'rejected', 'withdrawn'] },
  })
    .populate('projectId')
    .lean();

  const contributorArchive = contributorApplications
    .filter(
      (application) =>
        application.projectId &&
        (application.completionSubmissionStatus === 'approved' ||
          application.projectId.status === 'completed')
    )
    .map((application) => {
      const project = application.projectId;
      const reward =
        application.completionSubmissionStatus === 'approved'
          ? CONTRIBUTOR_REWARD_TOKENS
          : 0;
      return {
        id: `${project.projectCode || String(project._id)}-${String(application._id)}`,
        projectId: project.projectCode || String(project._id),
        title: project.title,
        domain: project.domain,
        role: application.assignedRole || 'Contributor',
        isOwner: false,
        outcome: buildArchiveOutcomeForApplication(application),
        rewardTokens: reward,
        completedOn: normalizeDateLabel(application.reviewedAt || project.updatedAt),
        tags: project.tags || [],
      };
    });

  const projects = [...ownerArchive, ...contributorArchive].sort((a, b) =>
    b.completedOn.localeCompare(a.completedOn)
  );

  return res.json({ projects });
}
