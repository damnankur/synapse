import { Router } from 'express';
import {
  applyToProject,
  completeProjectByOwner,
  getArchivedProjects,
  getPublisherOngoingProjectInsights,
  approveRoleCompletion,
  createProject,
  getActiveProjects,
  getPendingApplications,
  listProjects,
  leaveProject,
  removeContributor,
  resetContributorSubmission,
  reviewProjectApplication,
  submitRoleCompletion,
} from '../controllers/project.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', listProjects);
router.post('/', authMiddleware, createProject);
router.post('/:projectId/apply', authMiddleware, applyToProject);
router.get('/active', authMiddleware, getActiveProjects);
router.get('/applications/pending', authMiddleware, getPendingApplications);
router.get('/archive', authMiddleware, getArchivedProjects);
router.get('/publisher/ongoing', authMiddleware, getPublisherOngoingProjectInsights);
router.post('/:projectId/applications/:applicationId/review', authMiddleware, reviewProjectApplication);
router.post('/:projectId/applications/:applicationId/submit', authMiddleware, submitRoleCompletion);
router.post('/:projectId/applications/:applicationId/approve', authMiddleware, approveRoleCompletion);
router.post('/:projectId/applications/:applicationId/reset', authMiddleware, resetContributorSubmission);
router.post('/:projectId/applications/:applicationId/remove', authMiddleware, removeContributor);
router.post('/:projectId/leave', authMiddleware, leaveProject);
router.post('/:projectId/complete', authMiddleware, completeProjectByOwner);

export default router;
