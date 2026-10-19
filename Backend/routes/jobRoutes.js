import express from 'express';
import {
  getAllJobs,
  getActiveJobs,
  getJobById,
  createJob,
  updateJob,
  updateJobStatus,
  deleteJob
} from '../controllers/jobController.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Publicly authenticated across all routes
router.use(verifyToken);

// Active jobs query for the Dashboard
router.get('/active', getActiveJobs);

// Base route: /api/jobs
router.route('/')
  .get(getAllJobs)
  .post(authorizeRoles('Admin', 'ServiceAdvisor'), createJob);

// Quick status patch endpoint
router.put('/:jobId/status', updateJobStatus);

// Parameterized route: /api/jobs/:jobId
router.route('/:jobId')
  .get(getJobById)
  .put(updateJob)
  .delete(authorizeRoles('Admin'), deleteJob);

export default router;