import express from 'express';
import JobCard from '../models/JobCard.js';
import Customer from '../models/Customer.js';
import Vehicle from '../models/Vehicle.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper: Server-side financial calculation & sanitization (Zero-Trust Client Math)
const calculateSecureFinancials = (lineItems = [], applyGST = false) => {
  const sanitizedItems = Array.isArray(lineItems)
    ? lineItems
        .filter(item => item && item.name && String(item.name).trim() !== '')
        .map(item => ({
          type: item.type === 'Part' ? 'Part' : 'Service',
          name: String(item.name).trim().slice(0, 200),
          rate: Math.max(0, Number(item.rate) || 0)
        }))
    : [];

  const subtotal = sanitizedItems.reduce((sum, item) => sum + item.rate, 0);
  const tax = applyGST ? Number((subtotal * 0.18).toFixed(2)) : 0;
  const totalCost = Number((subtotal + tax).toFixed(2));

  return { sanitizedItems, subtotal, tax, totalCost };
};

// GET /api/jobs
router.get('/', verifyToken, async (req, res) => {
  try {
    const jobs = await JobCard.find()
      .populate('customer', 'name phone')
      .populate('vehicle', 'make model licensePlate')
      .sort({ createdAt: -1 });

    const formattedJobs = jobs.map(job => ({
      id: job.jobId,
      vehicle: job.vehicle
        ? `${job.vehicle.make} ${job.vehicle.model} - ${job.vehicle.licensePlate}`
        : 'Unknown Vehicle - NO-PLATE',
      customer: job.customer?.name || 'Unknown Customer',
      customerPhone: job.customer?.phone || 'N/A',
      mechanic: job.mechanic,
      priority: job.priority || 'Medium',
      status: job.status,
      totalCost: job.totalCost || 0,
      createdAt: job.createdAt
    }));

    res.status(200).json(formattedJobs);
  } catch (error) {
    console.error("Error fetching all jobs:", error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /api/jobs/active
// Fetches active jobs (Not Completed) for the Dashboard
router.get('/active', verifyToken, async (req, res) => {
  try {
    const activeJobs = await JobCard.find({ status: { $ne: 'Completed' } })
      .populate('customer', 'name phone')
      .populate('vehicle', 'make model licensePlate')
      .sort({ createdAt: -1 });

    const formattedJobs = activeJobs.map(job => ({
      id: job.jobId,
      vehicle: job.vehicle ? `${job.vehicle.make} ${job.vehicle.model} - ${job.vehicle.licensePlate}` : 'Unknown Vehicle - NO-PLATE',
      customer: job.customer?.name || 'Unknown Customer',
      customerPhone: job.customer?.phone || 'N/A',
      mechanic: job.mechanic,
      priority: job.priority || 'Medium',
      status: job.status,
      totalCost: job.totalCost || 0,
      createdAt: job.createdAt
    }));

    res.status(200).json(formattedJobs);
  } catch (error) {
    console.error("Error fetching active jobs:", error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /api/jobs/:jobId
// Fetches full job details for the Job Card Workspace
router.get('/:jobId', verifyToken, async (req, res) => {
  try {
    const job = await JobCard.findOne({ jobId: req.params.jobId })
      .populate('customer')
      .populate('vehicle');
      
    if (!job) {
      return res.status(404).json({ message: 'Job Card not found' });
    }
    
    res.status(200).json(job);
  } catch (error) {
    console.error("Error fetching single job:", error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /api/jobs
// Creates a new Job Card (Works with both Dashboard quick-modal and full Workspace)
router.post('/', verifyToken, authorizeRoles('Admin', 'ServiceAdvisor'), async (req, res) => {
  try {
    const { 
      customerName, customerPhone, make, model, licensePlate, 
      mechanic, priority, status, jobDate, deliveryDate, 
      notes, lineItems, applyGST 
    } = req.body;

    if (!customerName || !customerPhone || !licensePlate || !mechanic) {
      return res.status(400).json({ message: 'Missing required customer, vehicle, or mechanic fields.' });
    }

    // 1. Find or create Customer
    let customer = await Customer.findOne({ phone: customerPhone.trim() });
    if (!customer) {
      customer = await Customer.create({ 
        name: customerName.trim(), 
        phone: customerPhone.trim() 
      });
    } else if (customer.name !== customerName.trim()) {
      customer.name = customerName.trim();
      await customer.save();
    }

    // 2. Find or create Vehicle
    const cleanPlate = licensePlate.trim().toUpperCase();
    let vehicle = await Vehicle.findOne({ licensePlate: cleanPlate });
    if (!vehicle) {
      vehicle = await Vehicle.create({
        licensePlate: cleanPlate,
        make: (make || 'Unknown').trim(),
        model: (model || 'Vehicle').trim(),
        owner: customer._id
      });
    }

    // 3. Generate unique Job ID safely (checks highest existing number so deletions don't cause collisions)
    const lastJob = await JobCard.findOne().sort({ createdAt: -1 });
    const lastNum = lastJob && lastJob.jobId ? parseInt(lastJob.jobId.replace('JC-', ''), 10) : 1000;
    const newJobId = `JC-${(isNaN(lastNum) ? 1000 : lastNum) + 1}`;

    // 4. Server-side financial validation
    const { sanitizedItems, subtotal, tax, totalCost } = calculateSecureFinancials(lineItems, Boolean(applyGST));

    // 5. Create Job Card in MongoDB
    const newJob = await JobCard.create({
      jobId: newJobId,
      customer: customer._id,
      vehicle: vehicle._id,
      mechanic: mechanic.trim(),
      priority: priority || 'Medium',
      status: status || 'Pending Inspection',
      jobDate: jobDate || Date.now(),
      deliveryDate: deliveryDate || null,
      notes: notes ? String(notes).trim() : '',
      lineItems: sanitizedItems,
      applyGST: Boolean(applyGST),
      subtotal,
      tax,
      totalCost
    });

    res.status(201).json({ message: 'Job Card created successfully', job: newJob });
  } catch (error) {
    console.error("Error creating job card:", error);
    res.status(500).json({ message: 'Failed to create Job Card', error: error.message });
  }
});

// PUT /api/jobs/:jobId
// Updates an existing Job Card from the Job Card Workspace
router.put('/:jobId', verifyToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { 
      customerName, customerPhone, make, model, licensePlate, 
      mechanic, priority, status, jobDate, deliveryDate, 
      notes, lineItems, applyGST 
    } = req.body;

    const existingJob = await JobCard.findOne({ jobId });
    if (!existingJob) {
      return res.status(404).json({ message: 'Job Card not found' });
    }

    // Update linked Customer details if edited
    if (customerName && customerPhone && existingJob.customer) {
      await Customer.findByIdAndUpdate(existingJob.customer, {
        name: customerName.trim(),
        phone: customerPhone.trim()
      });
    }

    // Update linked Vehicle details if edited
    if (licensePlate && existingJob.vehicle) {
      await Vehicle.findByIdAndUpdate(existingJob.vehicle, {
        make: (make || 'Unknown').trim(),
        model: (model || 'Vehicle').trim(),
        licensePlate: licensePlate.trim().toUpperCase()
      });
    }

    // Recalculate financials securely on the server
    const { sanitizedItems, subtotal, tax, totalCost } = calculateSecureFinancials(lineItems, Boolean(applyGST));

    const updatedJob = await JobCard.findOneAndUpdate(
      { jobId },
      {
        mechanic: mechanic ? mechanic.trim() : existingJob.mechanic,
        priority: priority || existingJob.priority,
        status: status || existingJob.status,
        jobDate: jobDate || existingJob.jobDate,
        deliveryDate: deliveryDate || existingJob.deliveryDate,
        notes: notes !== undefined ? String(notes).trim() : existingJob.notes,
        lineItems: sanitizedItems,
        applyGST: Boolean(applyGST),
        subtotal,
        tax,
        totalCost
      },
      { new: true }
    ).populate('customer').populate('vehicle');

    res.status(200).json({ message: 'Job Card updated successfully', job: updatedJob });
  } catch (error) {
    console.error("Error updating job card:", error);
    res.status(500).json({ message: 'Failed to update Job Card', error: error.message });
  }
});

// PUT /api/jobs/:jobId/status
// Quick-updates the status of a specific job card from the card dropdown
router.put('/:jobId/status', verifyToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pending Inspection', 'In Progress', 'Awaiting Parts', 'Ready for Pickup', 'Completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status provided' });
    }

    const updatedJob = await JobCard.findOneAndUpdate(
      { jobId },
      { status },
      { new: true }
    );

    if (!updatedJob) {
      return res.status(404).json({ message: 'Job Card not found' });
    }

    res.status(200).json({ message: 'Status updated successfully', job: updatedJob });
  } catch (error) {
    console.error("Error updating job status:", error);
    res.status(500).json({ message: 'Failed to update job status' });
  }
});

// DELETE /api/jobs/:jobId
// Permanently deletes a job card (Restricted to Admin only)
router.delete('/:jobId', verifyToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const deletedJob = await JobCard.findOneAndDelete({ jobId: req.params.jobId });
    if (!deletedJob) {
      return res.status(404).json({ message: 'Job Card not found' });
    }
    res.status(200).json({ message: 'Job Card deleted permanently' });
  } catch (error) {
    console.error("Error deleting job card:", error);
    res.status(500).json({ message: 'Failed to delete Job Card' });
  }
});

export default router;