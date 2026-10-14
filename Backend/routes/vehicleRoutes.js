import express from 'express';
import Vehicle from '../models/Vehicle.js';
import Customer from '../models/Customer.js';
import JobCard from '../models/JobCard.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper: Sanitize license plate (allow only alphanumeric, spaces, and hyphens)
const sanitizePlate = (plate = '') =>
  String(plate).toUpperCase().replace(/[^A-Z0-9 -]/g, '').trim().slice(0, 20);

// GET /api/vehicles
// Fetches all registered vehicles with owner details and total job count
// GET /api/vehicles
// Fetches all registered vehicles with defensive null-checks for legacy MongoDB documents
router.get('/', verifyToken, async (req, res) => {
  try {
    const vehicles = await Vehicle.find()
      .populate('owner', 'name phone')
      .sort({ createdAt: -1 })
      .lean();

    const jobCounts = await JobCard.aggregate([
      { $group: { _id: '$vehicle', count: { $sum: 1 }, lastService: { $max: '$createdAt' } } }
    ]);

    const countMap = {};
    jobCounts.forEach(item => {
      if (item && item._id) {
        countMap[String(item._id)] = { count: item.count, lastService: item.lastService };
      }
    });

    const formattedVehicles = vehicles.map(v => {
      const idStr = String(v._id);
      return {
        _id: v._id,
        licensePlate: v.licensePlate || 'NO-PLATE',
        make: v.make || 'Unknown',
        model: v.model || 'Vehicle',
        year: v.year || null,
        fuelType: v.fuelType || 'Petrol',
        mileage: Number(v.mileage) || 0,
        ownerName: v.owner?.name || 'Unknown Owner',
        ownerPhone: v.owner?.phone || 'N/A',
        totalJobs: countMap[idStr]?.count || 0,
        lastService: countMap[idStr]?.lastService || null,
        createdAt: v.createdAt
      };
    });

    res.status(200).json(formattedVehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ message: 'Failed to load vehicles securely.', error: error.message });
  }
});

// POST /api/vehicles
// Registers a new vehicle and links/creates its Customer owner
router.post('/', verifyToken, authorizeRoles('Admin', 'ServiceAdvisor'), async (req, res) => {
  try {
    const { licensePlate, make, model, year, fuelType, mileage, ownerName, ownerPhone } = req.body;

    const cleanPlate = sanitizePlate(licensePlate);
    if (!cleanPlate || !make || !model || !ownerName || !ownerPhone) {
      return res.status(400).json({ message: 'License plate, make, model, owner name, and phone are required.' });
    }

    // Check for duplicate license plate
    const existingVehicle = await Vehicle.findOne({ licensePlate: cleanPlate });
    if (existingVehicle) {
      return res.status(409).json({ message: `Vehicle with plate ${cleanPlate} is already registered.` });
    }

    // Find or create Customer by phone
    const cleanPhone = String(ownerPhone).trim().slice(0, 20);
    let customer = await Customer.findOne({ phone: cleanPhone });
    if (!customer) {
      customer = await Customer.create({
        name: String(ownerName).trim().slice(0, 100),
        phone: cleanPhone
      });
    }

    const newVehicle = await Vehicle.create({
      licensePlate: cleanPlate,
      make: String(make).trim().slice(0, 50),
      model: String(model).trim().slice(0, 50),
      year: year ? Number(year) : undefined,
      fuelType: ['Petrol', 'Diesel', 'Hybrid', 'Electric'].includes(fuelType) ? fuelType : 'Petrol',
      mileage: Math.max(0, Number(mileage) || 0),
      owner: customer._id
    });

    res.status(201).json({ message: 'Vehicle registered successfully', vehicle: newVehicle });
  } catch (error) {
    console.error('Error registering vehicle:', error);
    res.status(500).json({ message: 'Failed to register vehicle.' });
  }
});

// PUT /api/vehicles/:id
// Updates vehicle details and owner information
router.put('/:id', verifyToken, authorizeRoles('Admin', 'ServiceAdvisor'), async (req, res) => {
  try {
    const { licensePlate, make, model, year, fuelType, mileage, ownerName, ownerPhone } = req.body;
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found.' });
    }

    if (licensePlate) {
      const cleanPlate = sanitizePlate(licensePlate);
      const duplicate = await Vehicle.findOne({ licensePlate: cleanPlate, _id: { $ne: vehicle._id } });
      if (duplicate) {
        return res.status(409).json({ message: `Another vehicle already uses plate ${cleanPlate}.` });
      }
      vehicle.licensePlate = cleanPlate;
    }

    if (make) vehicle.make = String(make).trim().slice(0, 50);
    if (model) vehicle.model = String(model).trim().slice(0, 50);
    if (year !== undefined) vehicle.year = year ? Number(year) : undefined;
    if (fuelType && ['Petrol', 'Diesel', 'Hybrid', 'Electric'].includes(fuelType)) {
      vehicle.fuelType = fuelType;
    }
    if (mileage !== undefined) vehicle.mileage = Math.max(0, Number(mileage) || 0);

    // Update linked owner details if provided
    if (ownerName && ownerPhone && vehicle.owner) {
      await Customer.findByIdAndUpdate(vehicle.owner, {
        name: String(ownerName).trim().slice(0, 100),
        phone: String(ownerPhone).trim().slice(0, 20)
      });
    }

    await vehicle.save();
    res.status(200).json({ message: 'Vehicle updated successfully', vehicle });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({ message: 'Failed to update vehicle.' });
  }
});

// DELETE /api/vehicles/:id
// Deletes a vehicle ONLY if no Job Cards are linked to it (Referential Integrity)
router.delete('/:id', verifyToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const linkedJobsCount = await JobCard.countDocuments({ vehicle: req.params.id });
    if (linkedJobsCount > 0) {
      return res.status(400).json({
        message: `Security Block: Cannot delete this vehicle because it is linked to ${linkedJobsCount} job card(s). Delete its job cards first.`
      });
    }

    const deleted = await Vehicle.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Vehicle not found.' });
    }

    res.status(200).json({ message: 'Vehicle deleted permanently.' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ message: 'Failed to delete vehicle.' });
  }
});

export default router;