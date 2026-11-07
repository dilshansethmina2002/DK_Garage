import express from 'express';
import {
  createQuotation,
  getAllQuotations,
  getQuotationById,
  updateQuotation,
  deleteQuotation,
  getQuotationSuggestions
} from '../controllers/quotationController.js';

const quotationRouter = express.Router();

quotationRouter.get('/suggestions', getQuotationSuggestions);
quotationRouter.post('/', createQuotation);
quotationRouter.get('/', getAllQuotations);
quotationRouter.get('/:id', getQuotationById);
quotationRouter.put('/:id', updateQuotation);
quotationRouter.delete('/:id', deleteQuotation);

export default quotationRouter;