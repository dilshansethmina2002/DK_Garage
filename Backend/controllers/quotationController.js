import Quotation from '../models/Quotation.js';

// @desc    Create new quotation
// @route   POST /api/quotations
export const createQuotation = async (req, res) => {
  try {
    // Generate a quotation number if not provided (e.g., QTN-17042024-1234)
    if (!req.body.quotationNo) {
      req.body.quotationNo = `QTN-${Date.now().toString().slice(-6)}`;
    }

    const quotation = new Quotation(req.body);
    const savedQuotation = await quotation.save();
    
    res.status(201).json(savedQuotation);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to create quotation' });
  }
};

// @desc    Get all quotations
// @route   GET /api/quotations
export const getAllQuotations = async (req, res) => {
  try {
    // Sort by newest first
    const quotations = await Quotation.find().sort({ createdAt: -1 });
    res.status(200).json(quotations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch quotations' });
  }
};

// @desc    Get single quotation by ID
// @route   GET /api/quotations/:id
export const getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }
    res.status(200).json(quotation);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching quotation' });
  }
};

// @desc    Update quotation
// @route   PUT /api/quotations/:id
export const updateQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    
    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    // Object.assign applies the updates, allowing the 'pre save' hook to recalculate totals
    Object.assign(quotation, req.body);
    const updatedQuotation = await quotation.save();

    res.status(200).json(updatedQuotation);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to update quotation' });
  }
};

// @desc    Delete quotation
// @route   DELETE /api/quotations/:id
export const deleteQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findByIdAndDelete(req.params.id);
    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }
    res.status(200).json({ message: 'Quotation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete quotation' });
  }
};