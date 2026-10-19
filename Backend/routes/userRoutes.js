import express from 'express';
import { 
  getAllUsers, 
  createUser, 
  updateUser, 
  deleteUser,
  getActiveMechanics 
} from '../controllers/userController.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. MUST BE AT THE VERY TOP: Mechanics list endpoint for dropdowns
// Any logged-in user with a valid JWT token can access this
router.get('/mechanics', verifyToken, getActiveMechanics);

// 2. Admin RBAC guard for management operations
router.use(verifyToken, authorizeRoles('Admin'));

// 3. Admin user management routes
router.route('/')
  .get(getAllUsers)
  .post(createUser);

router.route('/:id')
  .put(updateUser)
  .delete(deleteUser);

export default router;