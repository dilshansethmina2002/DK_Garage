import Quotation from '../models/Quotation.js';

// @desc    Create new quotation
// @route   POST /api/quotations
export const createQuotation = async (req, res) => {
  try {
    const payload = { ...req.body };

    const cleanVehicleNo = String(payload.vehicleNo || '').trim().toUpperCase().replace(/\s+/g, '-');

    // Generate base number if missing
    if (!payload.quotationNo || String(payload.quotationNo).trim() === '') {
      const count = await Quotation.countDocuments();
      const seq = 1001 + count;
      payload.quotationNo = cleanVehicleNo ? `QTN-${seq}-${cleanVehicleNo}` : `QTN-${seq}`;
    } else {
      let qNo = String(payload.quotationNo).trim().toUpperCase();
      // Ensure the vehicle number is appended if not already present
      if (cleanVehicleNo && !qNo.endsWith(cleanVehicleNo)) {
        payload.quotationNo = `${qNo}-${cleanVehicleNo}`;
      } else {
        payload.quotationNo = qNo;
      }
    }

    const quotation = new Quotation(payload);
    const savedQuotation = await quotation.save();
    
    res.status(201).json(savedQuotation);
  } catch (error) {
    console.error("Quotation Save Error:", error);
    res.status(400).json({ 
      message: error.code === 11000 ? 'Quotation with this identifier already exists.' : error.message 
    });
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


export const getQuotationSuggestions = async (req, res) => {
  try {
    const [removeAndRefix, realigning, repainting, spareParts] = await Promise.all([
      Quotation.distinct('removeAndRefix.description'),
      Quotation.distinct('realigning.description'),
      Quotation.distinct('repainting.description'),
      Quotation.distinct('spareParts.description')
    ]);

    // Clean out empty strings, nulls, and trim values
    const cleanUnique = (list) =>
      [...new Set((list || [])
        .map(item => (typeof item === 'string' ? item.trim() : ''))
        .filter(item => item.length > 0)
      )].sort((a, b) => a.localeCompare(b));

    res.status(200).json({
      removeAndRefix: cleanUnique(removeAndRefix),
      realigning: cleanUnique(realigning),
      repainting: cleanUnique(repainting),
      spareParts: cleanUnique(spareParts)
    });
  } catch (error) {
    console.error('Failed to fetch suggestions:', error);
    res.status(500).json({ message: 'Failed to retrieve item suggestions' });
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