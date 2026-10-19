import JobCard from '../models/JobCard.js';
import Customer from '../models/Customer.js';
import Vehicle from '../models/Vehicle.js';

// Helper: Calculate financials on the server to prevent client-side tampering
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

// Helper: Format job card documents consistently for frontend consumption
const formatJobResponse = (job) => {
  const mechanicsList = Array.isArray(job.mechanics) && job.mechanics.length > 0
    ? job.mechanics
    : job.mechanic
    ? String(job.mechanic).split(',').map(m => m.trim()).filter(Boolean)
    : [];

  return {
    id: job.jobId,
    vehicle: job.vehicle
      ? `${job.vehicle.make} ${job.vehicle.model} - ${job.vehicle.licensePlate}`
      : 'Unknown Vehicle - NO-PLATE',
    customer: job.customer?.name || 'Unknown Customer',
    customerPhone: job.customer?.phone || 'N/A',
    mechanics: mechanicsList,
    mechanic: mechanicsList.join(', ') || 'Unassigned',
    priority: job.priority || 'Medium',
    status: job.status,
    totalCost: job.totalCost || 0,
    createdAt: job.createdAt
  };
};

// @desc    Get all job cards
// @route   GET /api/jobs
// @access  Private
export const getAllJobs = async (req, res) => {
  try {
    const jobs = await JobCard.find()
      .populate('customer', 'name phone')
      .populate('vehicle', 'make model licensePlate')
      .sort({ createdAt: -1 });

    res.status(200).json(jobs.map(formatJobResponse));
  } catch (error) {
    console.error('Error fetching all jobs:', error);
    res.status(500).json({ message: 'Server Error loading job cards.' });
  }
};

// @desc    Get active job cards (not Completed)
// @route   GET /api/jobs/active
// @access  Private
export const getActiveJobs = async (req, res) => {
  try {
    const activeJobs = await JobCard.find({ status: { $ne: 'Completed' } })
      .populate('customer', 'name phone')
      .populate('vehicle', 'make model licensePlate')
      .sort({ createdAt: -1 });

    res.status(200).json(activeJobs.map(formatJobResponse));
  } catch (error) {
    console.error('Error fetching active jobs:', error);
    res.status(500).json({ message: 'Server Error loading active repairs.' });
  }
};

// @desc    Get single job card by jobId (e.g. JC-1001)
// @route   GET /api/jobs/:jobId
// @access  Private
export const getJobById = async (req, res) => {
  try {
    const job = await JobCard.findOne({ jobId: req.params.jobId })
      .populate('customer')
      .populate('vehicle');

    if (!job) {
      return res.status(404).json({ message: 'Job Card not found.' });
    }

    res.status(200).json(job);
  } catch (error) {
    console.error('Error fetching single job:', error);
    res.status(500).json({ message: 'Server Error loading job details.' });
  }
};

// @desc    Create a new Job Card
// @route   POST /api/jobs
// @access  Private (Admin, ServiceAdvisor)
export const createJob = async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      make,
      model,
      licensePlate,
      mechanics,
      mechanic,
      priority,
      status,
      jobDate,
      deliveryDate,
      notes,
      lineItems,
      applyGST
    } = req.body;

    if (!customerName || !customerPhone || !licensePlate) {
      return res.status(400).json({ message: 'Customer name, phone, and vehicle license plate are required.' });
    }

    // Process assigned mechanics (supports array or comma-delimited string)
    const assignedMechanics = Array.isArray(mechanics) && mechanics.length > 0
      ? mechanics.map(m => String(m).trim()).filter(Boolean)
      : mechanic
      ? String(mechanic).split(',').map(m => m.trim()).filter(Boolean)
      : [];

    if (assignedMechanics.length === 0) {
      return res.status(400).json({ message: 'At least one assigned mechanic is required.' });
    }

    // 1. Find or create Customer
    let customer = await Customer.findOne({ phone: String(customerPhone).trim() });
    if (!customer) {
      customer = await Customer.create({
        name: String(customerName).trim(),
        phone: String(customerPhone).trim()
      });
    } else if (customer.name !== String(customerName).trim()) {
      customer.name = String(customerName).trim();
      await customer.save();
    }

    // 2. Find or create Vehicle
    const cleanPlate = String(licensePlate).trim().toUpperCase().replace(/[^A-Z0-9 -]/g, '');
    const compactInputPlate = cleanPlate.replace(/[^A-Z0-9]/g, '');

    const allVehicles = await Vehicle.find();
    let vehicle = allVehicles.find(
      v => (v.licensePlate || '').toUpperCase().replace(/[^A-Z0-9]/g, '') === compactInputPlate
    );

    if (!vehicle) {
      vehicle = await Vehicle.create({
        licensePlate: cleanPlate,
        make: (make || 'Unknown').trim(),
        model: (model || 'Vehicle').trim(),
        owner: customer._id
      });
    } else {
      if (make) vehicle.make = make.trim();
      if (model) vehicle.model = model.trim();
      vehicle.owner = customer._id;
      await vehicle.save();
    }

    // 3. Generate sequential Job ID safely
    const lastJob = await JobCard.findOne().sort({ createdAt: -1 });
    const lastNum = lastJob && lastJob.jobId ? parseInt(lastJob.jobId.replace('JC-', ''), 10) : 1000;
    const newJobId = `JC-${(isNaN(lastNum) ? 1000 : lastNum) + 1}`;

    // 4. Calculate financials securely
    const { sanitizedItems, subtotal, tax, totalCost } = calculateSecureFinancials(lineItems, Boolean(applyGST));

    // 5. Create Job Card document
    const newJob = await JobCard.create({
      jobId: newJobId,
      customer: customer._id,
      vehicle: vehicle._id,
      mechanics: assignedMechanics,
      mechanic: assignedMechanics.join(', '),
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

    res.status(201).json({ message: 'Job Card created successfully.', job: newJob });
  } catch (error) {
    console.error('Error creating job card:', error);
    res.status(500).json({ message: 'Failed to create Job Card.', error: error.message });
  }
};

// @desc    Update Job Card details
// @route   PUT /api/jobs/:jobId
// @access  Private
export const updateJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const {
      customerName,
      customerPhone,
      make,
      model,
      licensePlate,
      mechanics,
      mechanic,
      priority,
      status,
      jobDate,
      deliveryDate,
      notes,
      lineItems,
      applyGST
    } = req.body;

    const existingJob = await JobCard.findOne({ jobId });
    if (!existingJob) {
      return res.status(404).json({ message: 'Job Card not found.' });
    }

    // Update customer details if provided
    if (customerName && customerPhone && existingJob.customer) {
      await Customer.findByIdAndUpdate(existingJob.customer, {
        name: String(customerName).trim(),
        phone: String(customerPhone).trim()
      });
    }

    // Update vehicle details if provided
    if (licensePlate && existingJob.vehicle) {
      await Vehicle.findByIdAndUpdate(existingJob.vehicle, {
        make: (make || 'Unknown').trim(),
        model: (model || 'Vehicle').trim(),
        licensePlate: String(licensePlate).trim().toUpperCase()
      });
    }

    // Process mechanics
    let assignedMechanics = existingJob.mechanics;
    if (Array.isArray(mechanics) && mechanics.length > 0) {
      assignedMechanics = mechanics.map(m => String(m).trim()).filter(Boolean);
    } else if (mechanic) {
      assignedMechanics = String(mechanic).split(',').map(m => m.trim()).filter(Boolean);
    }

    const { sanitizedItems, subtotal, tax, totalCost } = calculateSecureFinancials(lineItems, Boolean(applyGST));

    const updatedJob = await JobCard.findOneAndUpdate(
      { jobId },
      {
        mechanics: assignedMechanics,
        mechanic: assignedMechanics.join(', '),
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

    res.status(200).json({ message: 'Job Card updated successfully.', job: updatedJob });
  } catch (error) {
    console.error('Error updating job card:', error);
    res.status(500).json({ message: 'Failed to update Job Card.', error: error.message });
  }
};

// @desc    Quick-update status of a Job Card
// @route   PUT /api/jobs/:jobId/status
// @access  Private
export const updateJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pending Inspection', 'In Progress', 'Awaiting Parts', 'Ready for Pickup', 'Completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status provided.' });
    }

    const updatedJob = await JobCard.findOneAndUpdate(
      { jobId },
      { status },
      { new: true }
    );

    if (!updatedJob) {
      return res.status(404).json({ message: 'Job Card not found.' });
    }

    res.status(200).json({ message: 'Status updated successfully.', job: updatedJob });
  } catch (error) {
    console.error('Error updating job status:', error);
    res.status(500).json({ message: 'Failed to update job status.' });
  }
};

// @desc    Delete Job Card permanently
// @route   DELETE /api/jobs/:jobId
// @access  Private (Admin only)
export const deleteJob = async (req, res) => {
  try {
    const deletedJob = await JobCard.findOneAndDelete({ jobId: req.params.jobId });
    if (!deletedJob) {
      return res.status(404).json({ message: 'Job Card not found.' });
    }
    res.status(200).json({ message: 'Job Card deleted permanently.' });
  } catch (error) {
    console.error('Error deleting job card:', error);
    res.status(500).json({ message: 'Failed to delete Job Card.' });
  }
};