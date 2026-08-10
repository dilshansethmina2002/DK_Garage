import express from 'express';
import JobCard from '../models/JobCard.js';
import Customer from '../models/Customer.js';
import Vehicle from '../models/Vehicle.js';

const router = express.Router();

// GET /api/jobs/active
// Fetches all jobs that are NOT completed
router.get('/active', async (req, res) => {
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
router.post('/', async (req, res) => {
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

export default router;