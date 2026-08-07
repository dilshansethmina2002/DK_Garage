import express from 'express';
import JobCard from '../models/JobCard.js'; // Note the .js extension

const router = express.Router();

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

export default router;