import JobCard from '../models/JobCard.js';
import Customer from '../models/Customer.js';
import Vehicle from '../models/Vehicle.js';

// Helper: Calculate financials on the server to prevent client-side tampering
const calculateSecureFinancials = (lineItems = [], applyGST = false) => {
  let totalActualCost = 0;
  const todayStr = new Date().toISOString().split('T')[0];

  const sanitizedItems = Array.isArray(lineItems)
    ? lineItems
        .filter(item => item && item.name && String(item.name).trim() !== '')
        .map(item => {
          const costPrice = Math.max(0, Number(item.costPrice) || 0);
          const rate = Math.max(0, Number(item.rate) || 0);
          totalActualCost += costPrice;

          return {
            date: item.date ? String(item.date).trim() : todayStr,
            type: item.type === 'Part' ? 'Part' : 'Service',
            name: String(item.name).trim().slice(0, 200),
            costPrice,
            rate
          };
        })
    : [];

  const subtotal = sanitizedItems.reduce((sum, item) => sum + item.rate, 0);
  const tax = applyGST ? Number((subtotal * 0.18).toFixed(2)) : 0;
  const totalCost = Number((subtotal + tax).toFixed(2));
  const grossProfit = Number((subtotal - totalActualCost).toFixed(2));

  return { 
    sanitizedItems, 
    totalActualCost: Number(totalActualCost.toFixed(2)), 
    subtotal: Number(subtotal.toFixed(2)), 
    tax, 
    totalCost, 
    grossProfit 
  };
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
    jobId: job.jobId,
    vehicle: job.vehicle
      ? `${job.vehicle.make || ''} ${job.vehicle.model || ''} - ${job.vehicle.licensePlate || 'NO-PLATE'}`.trim()
      : 'Unknown Vehicle - NO-PLATE',
    customer: job.customer?.name || 'Unknown Customer',
    customerPhone: job.customer?.phone || 'N/A',
    customerRequests: job.customerRequests || job.notes || '',
    notes: job.notes || job.customerRequests || '',
    mechanics: mechanicsList,
    mechanic: mechanicsList.join(', ') || 'Unassigned',
    priority: job.priority || 'Medium',
    status: job.status,
    jobDate: job.jobDate,
    deliveryDate: job.deliveryDate,
    lineItems: job.lineItems || [],
    applyGST: Boolean(job.applyGST),
    totalActualCost: job.totalActualCost || 0,
    subtotal: job.subtotal || 0,
    tax: job.tax || 0,
    totalCost: job.totalCost || 0,
    grossProfit: job.grossProfit !== undefined ? job.grossProfit : (job.totalCost || 0) - (job.totalActualCost || 0),
    createdAt: job.createdAt
  };
};

// @desc    Get all job cards
// @route   GET /api/jobs
// @access  Private
export const getAllJobs = async (req, res) => {
  try {
    const jobs = await JobCard.find({ isDeleted: { $ne: true } })
      .populate('customer', 'name phone')
      .populate('vehicle', 'make model licensePlate')
      .sort({ createdAt: -1 });

    res.status(200).json(jobs.map(formatJobResponse));
  } catch (error) {
    res.status(500).json({ message: 'Server Error loading job cards.' });
  }
};

export const getActiveJobs = async (req, res) => {
  try {
    const activeJobs = await JobCard.find({ 
      status: { $ne: 'Completed' },
      isDeleted: { $ne: true }
    })
      .populate('customer', 'name phone')
      .populate('vehicle', 'make model licensePlate')
      .sort({ createdAt: -1 });

    res.status(200).json(activeJobs.map(formatJobResponse));
  } catch (error) {
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
      customerRequests,
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

    // 4. Calculate financials securely (with item-level dates & profit)
    const { 
      sanitizedItems, 
      totalActualCost, 
      subtotal, 
      tax, 
      totalCost, 
      grossProfit 
    } = calculateSecureFinancials(lineItems, Boolean(applyGST));

    // Consolidate customer complaint text
    const cleanCustomerRequests = customerRequests ? String(customerRequests).trim() : '';
    const cleanNotes = notes ? String(notes).trim() : cleanCustomerRequests;

    // 5. Create Job Card document
    const newJob = await JobCard.create({
      jobId: newJobId,
      customer: customer._id,
      vehicle: vehicle._id,
      customerRequests: cleanCustomerRequests,
      notes: cleanNotes,
      mechanics: assignedMechanics,
      mechanic: assignedMechanics.join(', '),
      priority: priority || 'Medium',
      status: status || 'Pending Inspection',
      jobDate: jobDate || Date.now(),
      deliveryDate: deliveryDate || null,
      lineItems: sanitizedItems,
      applyGST: Boolean(applyGST),
      totalActualCost,
      subtotal,
      tax,
      totalCost,
      grossProfit
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
      customerRequests,
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

    // Calculate financials securely with item dates and gross profit
    const { 
      sanitizedItems, 
      totalActualCost, 
      subtotal, 
      tax, 
      totalCost, 
      grossProfit 
    } = calculateSecureFinancials(lineItems, Boolean(applyGST));

    const updatedJob = await JobCard.findOneAndUpdate(
      { jobId },
      {
        customerRequests: customerRequests !== undefined ? String(customerRequests).trim() : existingJob.customerRequests,
        notes: notes !== undefined ? String(notes).trim() : existingJob.notes,
        mechanics: assignedMechanics,
        mechanic: assignedMechanics.join(', '),
        priority: priority || existingJob.priority,
        status: status || existingJob.status,
        jobDate: jobDate || existingJob.jobDate,
        deliveryDate: deliveryDate || existingJob.deliveryDate,
        lineItems: sanitizedItems,
        applyGST: Boolean(applyGST),
        totalActualCost,
        subtotal,
        tax,
        totalCost,
        grossProfit
      },
      { returnDocument: 'after', runValidators: true }
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
      { returnDocument: 'after', runValidators: true }
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
// @desc    Soft-delete / Archive a Job Card
// @route   DELETE /api/jobs/:jobId
// @access  Private (Admin only)
export const deleteJob = async (req, res) => {
  try {
    const updatedJob = await JobCard.findOneAndUpdate(
      { jobId: req.params.jobId },
      { 
        isDeleted: true,
        deletedAt: new Date(),
        status: 'Cancelled' // optional: marks status clearly
      },
      { returnDocument: 'after' }
    );

    if (!updatedJob) {
      return res.status(404).json({ message: 'Job Card not found.' });
    }

    res.status(200).json({ message: 'Job Card archived successfully without losing vehicle history.' });
  } catch (error) {
    console.error('Error archiving job card:', error);
    res.status(500).json({ message: 'Failed to archive Job Card.' });
  }
};

// @desc    Get complete service history for a specific vehicle by license plate
// @route   GET /api/jobs/vehicle-history/:licensePlate
// @access  Private
export const getVehicleServiceHistory = async (req, res) => {
  try {
    const rawPlate = String(req.params.licensePlate || '').trim().toUpperCase();
    const cleanPlate = rawPlate.replace(/[^A-Z0-9 -]/g, '');
    const compactPlate = cleanPlate.replace(/[^A-Z0-9]/g, '');

    // 1. Find the vehicle record
    const allVehicles = await Vehicle.find().populate('owner', 'name phone');
    const vehicle = allVehicles.find(
      v => (v.licensePlate || '').toUpperCase().replace(/[^A-Z0-9]/g, '') === compactPlate
    );

    // 2. Query all job cards associated with this vehicle (by ObjectId or plate string fallback)
    const query = vehicle
      ? { $or: [{ vehicle: vehicle._id }, { 'vehicle.licensePlate': cleanPlate }] }
      : { 'vehicle.licensePlate': cleanPlate };

    // In getVehicleServiceHistory:
    // Queries all work history regardless of whether the operational card was archived
    const jobs = await JobCard.find(query)
      .populate('customer', 'name phone')
      .populate('vehicle', 'make model licensePlate mileage')
      .sort({ createdAt: -1 });

    // 3. Compute aggregate history metrics
    let totalLifetimeSpend = 0;
    let totalLaborHours = 0;
    const partsReplacedList = [];

    jobs.forEach(job => {
      totalLifetimeSpend += Number(job.totalCost || job.subtotal || 0);
      totalLaborHours += Number(job.laborHours || 0);

      if (Array.isArray(job.lineItems)) {
        job.lineItems.forEach(item => {
          if (item.type === 'Part') {
            partsReplacedList.push({
              name: item.name,
              rate: item.rate,
              date: item.date || job.jobDate || job.createdAt,
              jobId: job.jobId
            });
          }
        });
      }
    });

    res.status(200).json({
      vehicle: vehicle || {
        licensePlate: cleanPlate,
        make: jobs[0]?.vehicle?.make || 'Unknown',
        model: jobs[0]?.vehicle?.model || 'Vehicle',
        owner: jobs[0]?.customer || null
      },
      metrics: {
        totalVisits: jobs.length,
        totalLifetimeSpend: Number(totalLifetimeSpend.toFixed(2)),
        totalLaborHours: Number(totalLaborHours.toFixed(1)),
        firstVisit: jobs[jobs.length - 1]?.jobDate || jobs[jobs.length - 1]?.createdAt || null,
        lastVisit: jobs[0]?.jobDate || jobs[0]?.createdAt || null
      },
      partsReplaced: partsReplacedList,
      history: jobs
    });
  } catch (error) {
    console.error('Error fetching vehicle service history:', error);
    res.status(500).json({ message: 'Server error retrieving vehicle history.', error: error.message });
  }
};