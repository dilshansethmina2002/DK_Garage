import mongoose from 'mongoose';
import VehicleValuation from '../models/Valuation.js';

// Recursive helper to clean empty strings and fix numeric/date fields
const sanitizeValuationPayload = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(sanitizeValuationPayload);
  } else if (obj !== null && typeof obj === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value === '') {
        // Drop empty string dates or empty optional values so Mongoose doesn't fail CastError
        continue;
      }
      cleaned[key] = sanitizeValuationPayload(value);
    }
    return cleaned;
  }
  return obj;
};

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
      $or: [
        { reportNo: param },
        { _id: mongoose.isValidObjectId(param) ? param : null }
      ]
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
    let body = sanitizeValuationPayload(req.body);

    // Auto-generate report number if missing or whitespace
    if (!body.reportNo || String(body.reportNo).trim() === '') {
      const last = await VehicleValuation.findOne().sort({ createdAt: -1 });
      const lastNum = last && last.reportNo ? parseInt(last.reportNo.replace(/\D/g, ''), 10) : 957;
      body.reportNo = String(isNaN(lastNum) ? 958 : lastNum + 1);
    }

    // Ensure financial number values are coerced properly
    if (body.evaluationTab2) {
      body.evaluationTab2.marketValue = Number(body.evaluationTab2.marketValue) || 0;
      body.evaluationTab2.forcedSaleValue = Number(body.evaluationTab2.forcedSaleValue) || 0;
      body.evaluationTab2.travelingCharge = Number(body.evaluationTab2.travelingCharge) || 0;
      body.evaluationTab2.valuationCharge = Number(body.evaluationTab2.valuationCharge) || 0;
    }

    const newValuation = await VehicleValuation.create(body);
    res.status(201).json({ message: 'Valuation created successfully', valuation: newValuation });
  } catch (error) {
    console.error("Valuation Creation Failed:", error);

    // If it's a Mongoose validation or duplicate key issue, return 400 with details
    if (error.name === 'ValidationError' || error.code === 11000) {
      return res.status(400).json({
        message: error.code === 11000 ? `Report No already exists.` : error.message,
        error: error.message
      });
    }

    res.status(500).json({ message: 'Failed to create valuation', error: error.message });
  }
};

// @desc    Update valuation
// @route   PUT /api/valuations/:id
export const updateValuation = async (req, res) => {
  try {
    const param = req.params.id;
    const body = sanitizeValuationPayload(req.body);

    if (body.evaluationTab2) {
      body.evaluationTab2.marketValue = Number(body.evaluationTab2.marketValue) || 0;
      body.evaluationTab2.forcedSaleValue = Number(body.evaluationTab2.forcedSaleValue) || 0;
      body.evaluationTab2.travelingCharge = Number(body.evaluationTab2.travelingCharge) || 0;
      body.evaluationTab2.valuationCharge = Number(body.evaluationTab2.valuationCharge) || 0;
    }

    const query = {
      $or: [
        { reportNo: param },
        { _id: mongoose.isValidObjectId(param) ? param : null }
      ]
    };

    const updated = await VehicleValuation.findOneAndUpdate(
      query,
      body,
      { returnDocument: 'after', runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Valuation not found.' });
    }
    res.status(200).json({ message: 'Valuation updated successfully', valuation: updated });
  } catch (error) {
    console.error("Valuation Update Failed:", error);
    res.status(500).json({ message: 'Failed to update valuation', error: error.message });
  }
};

// @desc    Soft Delete valuation
// @route   DELETE /api/valuations/:id
export const deleteValuation = async (req, res) => {
  try {
    const param = req.params.id;
    const query = {
      $or: [
        { reportNo: param },
        { _id: mongoose.isValidObjectId(param) ? param : null }
      ]
    };

    const updated = await VehicleValuation.findOneAndUpdate(
      query,
      { isArchived: true },
      { returnDocument: 'after' }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Valuation not found.' });
    }

    res.status(200).json({ message: 'Valuation report archived successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete report', error: error.message });
  }
};