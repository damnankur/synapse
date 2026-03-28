import mongoose from 'mongoose';
import { Project, ProjectApplication, User } from '../models/db.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\-()\s]{7,20}$/;

function buildInitials(name) {
  const chunks = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  const initials = chunks.map((part) => part[0]?.toUpperCase() || '').join('');
  return initials || 'U';
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
    skills: user.skills,
    completedProjects: user.completedProjects,
    joinDate: user.joinDate,
    permissions: user.permissions || [],
  };
}

function toCleanString(value, fallback = '') {
  if (typeof value !== 'string') return fallback;
  return value.trim();
}

function toSafeInteger(value, fallback = 0) {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  return Math.max(0, Math.round(next));
}

function toSafeBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  return fallback;
}

function normalizeDateLabel(dateValue) {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
}

async function resolveUserByAnyId(userId) {
  const lookup = [{ userCode: userId }];
  if (mongoose.Types.ObjectId.isValid(userId)) {
    lookup.push({ _id: userId });
  }

  return User.findOne({ $or: lookup });
}

async function resolveProjectByAnyId(projectId) {
  if (!projectId) return null;
  const lookup = [{ projectCode: projectId }];
  if (mongoose.Types.ObjectId.isValid(projectId)) {
    lookup.push({ _id: projectId });
  }

  return Project.findOne({ $or: lookup });
}

export async function getMyProfile(req, res) {
  const userId = req.auth?.sub;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  return res.json({ user: toClientUser(user), permissions: user.permissions || [] });
}

export async function updateMyProfile(req, res) {
  const userId = req.auth?.sub;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const updates = {};

  if (req.body.id !== undefined) {
    updates.userCode = toCleanString(req.body.id);
  }

  if (req.body.name !== undefined) {
    updates.name = toCleanString(req.body.name);
  }

  if (req.body.role !== undefined) {
    updates.role = toCleanString(req.body.role, 'researcher');
  }

  if (req.body.email !== undefined) {
    const nextEmail = toCleanString(req.body.email).toLowerCase();
    if (!nextEmail || !EMAIL_REGEX.test(nextEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    if (nextEmail !== user.email) {
      const existingUser = await User.findOne({ email: nextEmail, _id: { $ne: user._id } }).lean();
      if (existingUser) {
        return res.status(409).json({ message: 'This email is already in use.' });
      }
    }
    updates.email = nextEmail;
  }

  if (req.body.phone !== undefined) {
    const nextPhone = toCleanString(req.body.phone);
    if (nextPhone && !PHONE_REGEX.test(nextPhone)) {
      return res
        .status(400)
        .json({ message: 'Phone number can contain digits, spaces, +, -, and parentheses.' });
    }
    updates.phone = nextPhone;
  }

  if (req.body.isEmailVisible !== undefined) {
    updates.isEmailVisible = toSafeBoolean(req.body.isEmailVisible, user.isEmailVisible);
  }

  if (req.body.isPhoneVisible !== undefined) {
    updates.isPhoneVisible = toSafeBoolean(req.body.isPhoneVisible, user.isPhoneVisible);
  }

  if (req.body.initials !== undefined) {
    updates.initials = toCleanString(req.body.initials).toUpperCase().slice(0, 4);
  }

  if (req.body.university !== undefined) {
    updates.university = toCleanString(req.body.university);
  }

  if (req.body.department !== undefined) {
    updates.department = toCleanString(req.body.department);
  }

  if (req.body.bio !== undefined) {
    updates.bio = toCleanString(req.body.bio);
  }

  if (req.body.skills !== undefined) {
    if (!Array.isArray(req.body.skills)) {
      return res.status(400).json({ message: 'skills must be an array of strings.' });
    }
    updates.skills = req.body.skills.map((skill) => toCleanString(skill)).filter(Boolean);
  }

  if (req.body.completedProjects !== undefined) {
    updates.completedProjects = toSafeInteger(req.body.completedProjects, user.completedProjects);
  }

  if (req.body.joinDate !== undefined) {
    updates.joinDate = toCleanString(req.body.joinDate);
  }

  if (req.body.tokens !== undefined) {
    updates.tokens = toSafeInteger(req.body.tokens, user.tokens);
  }

  if (updates.name && !updates.initials) {
    updates.initials = buildInitials(updates.name);
  }

  if (!updates.initials && !user.initials) {
    updates.initials = buildInitials(updates.name || user.name);
  }

  Object.assign(user, updates);
  await user.save();

  return res.json({ user: toClientUser(user), permissions: user.permissions || [] });
}

export async function getPlatformProfile(req, res) {
  const requesterId = req.auth?.sub;
  if (!requesterId) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const requestedUserId = String(req.params.userId || '').trim();
  if (!requestedUserId) {
    return res.status(400).json({ message: 'userId is required.' });
  }

  const targetUser = await resolveUserByAnyId(requestedUserId);
  if (!targetUser) {
    return res.status(404).json({ message: 'Requested user not found.' });
  }

  const isSelfProfile = String(targetUser._id) === String(requesterId);
  const projectId = String(req.query.projectId || '').trim();
  let contactUnlocked = isSelfProfile;

  if (!contactUnlocked && projectId) {
    const project = await resolveProjectByAnyId(projectId);
    if (project) {
      const ownerId = String(project.creatorUserId || '');
      const targetId = String(targetUser._id);
      let contributorId = '';

      if (ownerId === String(requesterId) && targetId !== ownerId) {
        contributorId = targetId;
      } else if (ownerId === targetId && String(requesterId) !== ownerId) {
        contributorId = String(requesterId);
      }

      if (contributorId) {
        const acceptedConnection = await ProjectApplication.exists({
          projectId: project._id,
          userId: contributorId,
          status: { $in: ['accepted', 'locked-in'] },
        });
        contactUnlocked = Boolean(acceptedConnection);
      }
    }
  }

  const [ownerActiveProjects, contributorActiveApplications, ownerCompletedProjects, contributorPastApplications] =
    await Promise.all([
      Project.find({
        creatorUserId: targetUser._id,
        status: { $in: ['open', 'in-progress'] },
      })
        .sort({ updatedAt: -1 })
        .lean(),
      ProjectApplication.find({
        userId: targetUser._id,
        status: { $in: ['accepted', 'locked-in'] },
        completionSubmissionStatus: { $ne: 'approved' },
      })
        .populate('projectId')
        .sort({ updatedAt: -1 })
        .lean(),
      Project.find({
        creatorUserId: targetUser._id,
        status: 'completed',
      })
        .sort({ updatedAt: -1 })
        .lean(),
      ProjectApplication.find({
        userId: targetUser._id,
        status: { $in: ['accepted', 'locked-in', 'rejected', 'withdrawn'] },
      })
        .populate('projectId')
        .sort({ updatedAt: -1 })
        .lean(),
    ]);

  const activeProjects = [
    ...ownerActiveProjects.map((project) => ({
      projectId: project.projectCode || String(project._id),
      title: project.title,
      domain: project.domain,
      role: 'Project Owner',
      status: project.status,
      isOwner: true,
    })),
    ...contributorActiveApplications
      .filter(
        (application) =>
          application.projectId &&
          ['open', 'in-progress'].includes(application.projectId.status) &&
          application.completionSubmissionStatus !== 'approved'
      )
      .map((application) => ({
        projectId: application.projectId.projectCode || String(application.projectId._id),
        title: application.projectId.title,
        domain: application.projectId.domain,
        role: application.assignedRole || 'Contributor',
        status: application.projectId.status,
        isOwner: false,
      })),
  ];

  const pastProjects = [
    ...ownerCompletedProjects.map((project) => ({
      projectId: project.projectCode || String(project._id),
      title: project.title,
      domain: project.domain,
      role: 'Project Owner',
      isOwner: true,
      completedOn: normalizeDateLabel(project.updatedAt),
      outcome: 'Completed',
    })),
    ...contributorPastApplications
      .filter(
        (application) =>
          application.projectId &&
          (application.completionSubmissionStatus === 'approved' ||
            application.projectId.status === 'completed')
      )
      .map((application) => ({
        projectId: application.projectId.projectCode || String(application.projectId._id),
        title: application.projectId.title,
        domain: application.projectId.domain,
        role: application.assignedRole || 'Contributor',
        isOwner: false,
        completedOn: normalizeDateLabel(application.reviewedAt || application.projectId.updatedAt),
        outcome: application.completionSubmissionStatus === 'approved' ? 'Approved + rewarded' : 'Participated',
      })),
  ];

  return res.json({
    profile: {
      id: targetUser.userCode || String(targetUser._id),
      name: targetUser.name,
      role: targetUser.role,
      initials: targetUser.initials,
      university: targetUser.university || '',
      department: targetUser.department || '',
      bio: targetUser.bio || '',
      skills: targetUser.skills || [],
      joinDate: targetUser.joinDate || '',
      completedProjects: targetUser.completedProjects || 0,
      activeProjectsCount: activeProjects.length,
      pastProjectsCount: pastProjects.length,
      activeProjects,
      pastProjects,
      contact: {
        email:
          isSelfProfile || (contactUnlocked && targetUser.isEmailVisible)
            ? targetUser.email || ''
            : '',
        phone:
          isSelfProfile || (contactUnlocked && targetUser.isPhoneVisible)
            ? targetUser.phone || ''
            : '',
        isEmailVisible: Boolean(targetUser.isEmailVisible),
        isPhoneVisible: Boolean(targetUser.isPhoneVisible),
        unlocked: contactUnlocked,
      },
    },
  });
}
