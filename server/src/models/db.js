import mongoose from 'mongoose';

const { Schema } = mongoose;

const PROJECT_STATUS = ['open', 'in-progress', 'completed'];
const MEMBER_STATUS = ['active', 'pending'];
const APPLICATION_STATUS = ['pending', 'accepted', 'rejected', 'withdrawn', 'locked-in'];
const COMPLETION_SUBMISSION_STATUS = ['not_submitted', 'submitted', 'approved', 'rejected'];
const PAYMENT_STATUS = ['created', 'processing', 'succeeded', 'failed', 'cancelled'];
const TRANSACTION_TYPE = [
  'purchase',
  'apply',
  'publish',
  'commit_lock',
  'commit_refund',
  'project_reward',
  'manual_adjustment',
];

const MilestoneSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const TeamMemberSchema = new Schema(
  {
    memberId: { type: String, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    initials: { type: String, required: true, trim: true, maxlength: 4 },
    avatarColor: { type: String, trim: true },
    status: { type: String, enum: MEMBER_STATUS, default: 'active' },
    isCurrentUser: { type: Boolean, default: false },
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    externalId: { type: String, trim: true, index: true }, // auth provider ID (Auth0/local)
    userCode: { type: String, trim: true, unique: true, sparse: true }, // maps UI id like "user-1"
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String }, // nullable for social login
    role: { type: String, required: true, trim: true, default: 'researcher' },
    initials: { type: String, required: true, trim: true, maxlength: 4 },
    permissions: { type: [String], default: [] },
    tokens: { type: Number, default: 0, min: 0 },
    phone: { type: String, default: '', trim: true, maxlength: 20 },
    isEmailVisible: { type: Boolean, default: false },
    isPhoneVisible: { type: Boolean, default: false },
    university: { type: String, default: '', trim: true },
    department: { type: String, default: '', trim: true },
    bio: { type: String, default: '', trim: true, maxlength: 2500 },
    skills: { type: [String], default: [] },
    completedProjects: { type: Number, default: 0, min: 0 },
    joinDate: { type: String, default: '' }, // kept as string to match current frontend format
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

const ProjectSchema = new Schema(
  {
    projectCode: { type: String, trim: true, unique: true, sparse: true }, // maps UI id like "proj-1"
    title: { type: String, required: true, trim: true, maxlength: 220 },
    domain: { type: String, required: true, trim: true, maxlength: 220 },
    description: { type: String, required: true, trim: true, maxlength: 6000 },
    // Duplicate entries are allowed to represent multiple slots for the same role.
    requiredRoles: { type: [String], default: [] },
    status: { type: String, enum: PROJECT_STATUS, default: 'open' },
    creatorUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    creator: { type: String, required: true, trim: true },
    creatorRole: { type: String, required: true, trim: true },
    costToApply: { type: Number, default: 10, min: 0 },
    applicants: { type: Number, default: 0, min: 0 },
    deadline: { type: Date },
    tags: { type: [String], default: [] },
    maxTeamSize: { type: Number, required: true, min: 1 },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

const ProjectApplicationSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: APPLICATION_STATUS, default: 'pending' },
    assignedRole: { type: String, trim: true, default: '' },
    commitmentTokens: { type: Number, default: 10, min: 0 },
    message: { type: String, trim: true, maxlength: 2000 },
    completionSubmissionStatus: {
      type: String,
      enum: COMPLETION_SUBMISSION_STATUS,
      default: 'not_submitted',
    },
    completionSubmissionNote: { type: String, trim: true, maxlength: 2500, default: '' },
    reviewerNote: { type: String, trim: true, maxlength: 2500, default: '' },
    appliedAt: { type: Date, default: Date.now },
    respondedAt: { type: Date },
    submittedAt: { type: Date },
    reviewedAt: { type: Date },
  },
  { timestamps: true, versionKey: false }
);

ProjectApplicationSchema.index({ projectId: 1, userId: 1 }, { unique: true });

const ActiveProjectWorkspaceSchema = new Schema(
  {
    workspaceCode: { type: String, trim: true, unique: true, sparse: true }, // maps UI id like "active-proj-1"
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
    title: { type: String, required: true, trim: true },
    domain: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    team: { type: [TeamMemberSchema], default: [] },
    myRole: { type: String, default: '', trim: true },
    myTaskTitle: { type: String, default: '', trim: true },
    myTaskCompleted: { type: Boolean, default: false },
    deadline: { type: Date },
    tags: { type: [String], default: [] },
    milestones: { type: [MilestoneSchema], default: [] },
  },
  { timestamps: true, versionKey: false }
);

const TokenTransactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: TRANSACTION_TYPE, required: true },
    amount: { type: Number, required: true }, // positive or negative token delta
    balanceAfter: { type: Number, min: 0 },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    applicationId: { type: Schema.Types.ObjectId, ref: 'ProjectApplication' },
    paymentIntentId: { type: Schema.Types.ObjectId, ref: 'PaymentIntent' },
    note: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true, versionKey: false }
);

const PaymentIntentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bundleId: { type: String, trim: true },
    tokensAmount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'USD', trim: true, uppercase: true },
    priceAmount: { type: Number, default: 0, min: 0 }, // in major currency units for now
    provider: { type: String, default: 'dummy' },
    providerIntentId: { type: String, trim: true, index: true, sparse: true },
    providerReceiptId: { type: String, trim: true, sparse: true },
    status: { type: String, enum: PAYMENT_STATUS, default: 'created' },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, versionKey: false }
);

const RefreshSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    refreshTokenHash: { type: String, required: true },
    userAgent: { type: String, trim: true, maxlength: 500 },
    ipAddress: { type: String, trim: true, maxlength: 120 },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date },
  },
  { timestamps: true, versionKey: false }
);

RefreshSessionSchema.index({ userId: 1, refreshTokenHash: 1 }, { unique: true });

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
export const ProjectApplication =
  mongoose.models.ProjectApplication ||
  mongoose.model('ProjectApplication', ProjectApplicationSchema);
export const ActiveProjectWorkspace =
  mongoose.models.ActiveProjectWorkspace ||
  mongoose.model('ActiveProjectWorkspace', ActiveProjectWorkspaceSchema);
export const TokenTransaction =
  mongoose.models.TokenTransaction ||
  mongoose.model('TokenTransaction', TokenTransactionSchema);
export const PaymentIntent =
  mongoose.models.PaymentIntent || mongoose.model('PaymentIntent', PaymentIntentSchema);
export const RefreshSession =
  mongoose.models.RefreshSession || mongoose.model('RefreshSession', RefreshSessionSchema);

export default {
  User,
  Project,
  ProjectApplication,
  ActiveProjectWorkspace,
  TokenTransaction,
  PaymentIntent,
  RefreshSession,
};
