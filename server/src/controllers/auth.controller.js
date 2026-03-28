import bcrypt from 'bcryptjs';
import { User } from '../models/db.js';
import { signAccessToken } from '../middleware/auth.js';

function buildInitials(name) {
  const chunks = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  const initials = chunks.map((part) => part[0]?.toUpperCase() || '').join('');
  return initials || 'U';
}

function buildJoinDateLabel() {
  const date = new Date();
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
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

export async function register(req, res) {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email and password are required.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters.' });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ message: 'A user with this email already exists.' });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    userCode: `user-${Date.now()}`,
    name,
    email,
    passwordHash,
    role: 'researcher',
    initials: buildInitials(name),
    permissions: ['projects.read', 'projects.apply', 'projects.publish', 'profile.update'],
    tokens: 20,
    phone: '',
    isEmailVisible: false,
    isPhoneVisible: false,
    university: '',
    department: '',
    bio: '',
    skills: [],
    completedProjects: 0,
    joinDate: buildJoinDateLabel(),
  });

  const accessToken = signAccessToken({
    sub: String(user._id),
    email: user.email,
    name: user.name,
  });

  return res.status(201).json({
    accessToken,
    refreshToken: '',
    expiresIn: 12 * 60 * 60,
    user: toClientUser(user),
    permissions: user.permissions || [],
  });
}

export async function login(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required.' });
  }

  const user = await User.findOne({ email });
  if (!user || !user.passwordHash) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const accessToken = signAccessToken({
    sub: String(user._id),
    email: user.email,
    name: user.name,
  });

  return res.json({
    accessToken,
    refreshToken: '',
    expiresIn: 12 * 60 * 60,
    user: toClientUser(user),
    permissions: user.permissions || [],
  });
}

export async function me(req, res) {
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
