import express from 'express';
import multer from 'multer';
import {
  getValuations,
  getValuationById,
  createValuation,
  updateValuation,
  deleteValuation
} from '../controllers/valuationController.js';
import { verifyToken as protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { uploadToSupabase } from '../config/supabase.js';

const valuationRoutes = express.Router();

// Configure Multer for in-memory buffer handling before streaming to Supabase
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB limit per image
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// =========================================================================
// Photo Upload Route (Tab 4: Chassis, Engine, and Vehicle Photos)
// =========================================================================
// @route   POST /api/valuations/upload-photos
// @access  Private
valuationRoutes.post(
  '/upload-photos',
  protect,
  upload.fields([
    { name: 'chassisNoPhoto', maxCount: 1 },
    { name: 'engineNoPhoto', maxCount: 1 },
    { name: 'vehiclePhotos', maxCount: 6 }
  ]),
  async (req, res) => {
    try {
      const files = req.files || {};
      let chassisUrl = '';
      let engineUrl = '';
      const vehiclePhotoUrls = [];

      // 1. Upload Chassis No photo (Box 1 in Tab 4)
      if (files['chassisNoPhoto']?.[0]) {
        const file = files['chassisNoPhoto'][0];
        chassisUrl = await uploadToSupabase(
          file.buffer, 
          file.originalname, 
          file.mimetype, 
          'chassis'
        );
      }

      // 2. Upload Engine No photo (Box 2 in Tab 4)
      if (files['engineNoPhoto']?.[0]) {
        const file = files['engineNoPhoto'][0];
        engineUrl = await uploadToSupabase(
          file.buffer, 
          file.originalname, 
          file.mimetype, 
          'engine'
        );
      }

      // 3. Upload Vehicle body photos
      if (files['vehiclePhotos'] && files['vehiclePhotos'].length > 0) {
        for (const file of files['vehiclePhotos']) {
          const url = await uploadToSupabase(
            file.buffer, 
            file.originalname, 
            file.mimetype, 
            'vehicles'
          );
          vehiclePhotoUrls.push(url);
        }
      }

      res.status(200).json({
        success: true,
        chassisNoPhoto: chassisUrl,
        engineNoPhoto: engineUrl,
        vehiclePhotos: vehiclePhotoUrls
      });
    } catch (error) {
      console.error('Supabase photo upload error:', error);
      res.status(500).json({ 
        message: 'Failed to upload photos to Supabase Storage.', 
        error: error.message 
      });
    }
  }
);

// =========================================================================
// Valuation Core CRUD Routes
// =========================================================================

// @route   GET /api/valuations (List all valuations / Search)
// @route   POST /api/valuations (Save valuation record)
valuationRoutes.route('/')
  .get(protect, getValuations)
  .post(protect, createValuation);

// @route   GET /api/valuations/:id (Fetch single valuation by reportNo or _id)
// @route   PUT /api/valuations/:id (Update existing valuation)
// @route   DELETE /api/valuations/:id (Soft-delete / Archive valuation)
valuationRoutes.route('/:id')
  .get(protect, getValuationById)
  .put(protect, updateValuation)
  .delete(protect, deleteValuation);

export default valuationRoutes;