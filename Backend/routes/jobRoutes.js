import express from 'express';
import JobCard from '../models/JobCard.js';
import Customer from '../models/Customer.js';
import Vehicle from '../models/Vehicle.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const jobRouter = express.Router();

// GET /api/jobs/active
// Fetches all jobs that are NOT completed
jobRouter.get('/active', verifyToken, async (req, res) => {
  try {
    const activeJobs = await JobCard.find({ status: { $ne: 'Completed' } })
      .populate('customer', 'name phone')
      .populate('vehicle', 'make model licensePlate')
      .sort({ createdAt: -1 });

    const formattedJobs = activeJobs.map(job => ({
      id: job.jobId,
      vehicle: `${job.vehicle.make} ${job.vehicle.model} - ${job.vehicle.licensePlate}`,
      customer: job.customer.name,
      mechanic: job.mechanic,
      status: job.status
    }));

    res.status(200).json(formattedJobs);
  } catch (error) {
    console.error("Error fetching active jobs:", error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /api/jobs
// Creates a new Customer, Vehicle, and Job Card all at once
// PROTECTED: Only Admins and Service Advisors can create jobs
jobRouter.post('/', verifyToken, authorizeRoles('Admin', 'ServiceAdvisor'), async (req, res) => {
  try {
    const { customerName, customerPhone, make, model, licensePlate, mechanic } = req.body;

    // 1. Find the customer by phone number, or create a new one if they don't exist
    let customer = await Customer.findOne({ phone: customerPhone });
    if (!customer) {
      customer = await Customer.create({ name: customerName, phone: customerPhone });
    }

    // 2. Find the vehicle by license plate, or create a new one
    let vehicle = await Vehicle.findOne({ licensePlate });
    if (!vehicle) {
      vehicle = await Vehicle.create({
        licensePlate,
        make,
        model,
        owner: customer._id
      });
    }

    // 3. Generate a unique Job ID (e.g., JC-1001)
    const count = await JobCard.countDocuments();
    const newJobId = `JC-${1000 + count + 1}`;

    // 4. Create the actual Job Card
    const newJob = await JobCard.create({
      jobId: newJobId,
      customer: customer._id,
      vehicle: vehicle._id,
      mechanic: mechanic,
      status: 'Pending Inspection'
    });

    res.status(201).json({ message: 'Job Card created successfully', job: newJob });
  } catch (error) {
    console.error("Error creating job card:", error);
    res.status(500).json({ message: 'Failed to create Job Card', error: error.message });
  }
});

// PUT /api/jobs/:jobId/status
// Updates the status of a specific job card
jobRouter.put('/:jobId/log', verifyToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { notes, laborHours } = req.body;

    const updatedJob = await JobCard.findOneAndUpdate(
      { jobId: jobId },
      { 
        notes: notes, 
        // Ensure laborHours is saved as a number, defaulting to 0 if left blank
        laborHours: Number(laborHours) || 0 
      },
      { new: true } 
    );

    if (!updatedJob) {
      return res.status(404).json({ message: 'Job Card not found' });
    }

    res.status(200).json({ message: 'Repair log updated successfully', job: updatedJob });
  } catch (error) {
    console.error("Error updating repair log:", error);
    res.status(500).json({ message: 'Failed to update repair log' });
  }
});

// GET /api/jobs/:jobId
// Fetches detailed information for a single job card
jobRouter.get('/:jobId', verifyToken, async (req, res) => {
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

export default jobRouter;