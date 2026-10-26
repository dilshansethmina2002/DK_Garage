import mongoose from 'mongoose';
import VehicleValuation from '../models/Valuation.js';

// @desc    Get all valuation reports (Grid/History View)
// @route   GET /api/valuations
export const getValuations = async (req, res) => {
  try {
    const { search } = req.query;
    let query = { isArchived: { $ne: true } };

    if (search) {
      const q = String(search).trim();
      query.$or = [
        { reportNo: { $regex: q, $options: 'i' } },
        { 'identification.registrationNo': { $regex: q, $options: 'i' } },
        { 'identification.chassisNo': { $regex: q, $options: 'i' } },
        { 'identification.engineNo': { $regex: q, $options: 'i' } }
      ];
    }

    const records = await VehicleValuation.find(query).sort({ createdAt: -1 });
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving valuations', error: error.message });
  }
};

// @desc    Get single valuation by reportNo or ID
// @route   GET /api/valuations/:id
export const getValuationById = async (req, res) => {
  try {
    const param = req.params.id;
    const valuation = await VehicleValuation.findOne({
      $or: [{ reportNo: param }, { _id: mongoose.isValidObjectId(param) ? param : null }]
    });

    if (!valuation) {
      return res.status(404).json({ message: 'Valuation report not found.' });
    }
    res.status(200).json(valuation);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching report', error: error.message });
  }
};

// @desc    Create new valuation
// @route   POST /api/valuations
export const createValuation = async (req, res) => {
  try {
    const body = req.body;

    // Sequential report number generation if omitted
    if (!body.reportNo) {
      const last = await VehicleValuation.findOne().sort({ createdAt: -1 });
      const lastNum = last && last.reportNo ? parseInt(last.reportNo.replace(/\D/g, ''), 10) : 957;
      body.reportNo = String(isNaN(lastNum) ? 958 : lastNum + 1);
    }

    const newValuation = await VehicleValuation.create(body);
    res.status(201).json({ message: 'Valuation created successfully', valuation: newValuation });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create valuation', error: error.message });
  }
};

// @desc    Update valuation
// @route   PUT /api/valuations/:id
export const updateValuation = async (req, res) => {
  try {
    const updated = await VehicleValuation.findOneAndUpdate(
      { $or: [{ reportNo: req.params.id }, { _id: req.params.id }] },
      req.body,
      { returnDocument: 'after', runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Valuation not found.' });
    }
    res.status(200).json({ message: 'Valuation updated successfully', valuation: updated });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update valuation', error: error.message });
  }
};

// @desc    Soft Delete valuation
// @route   DELETE /api/valuations/:id
export const deleteValuation = async (req, res) => {
  try {
    const updated = await VehicleValuation.findOneAndUpdate(
      { $or: [{ reportNo: req.params.id }, { _id: req.params.id }] },
      { isArchived: true },
      { returnDocument: 'after' }
    );
    res.status(200).json({ message: 'Valuation report archived successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete report', error: error.message });
  }
};