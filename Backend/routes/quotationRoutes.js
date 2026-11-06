import express from 'express';
import {
  createQuotation,
  getAllQuotations,
  getQuotationById,
  updateQuotation,
  deleteQuotation
} from '../controllers/quotationController.js';

const quotationRouter = express.Router();

quotationRouter.post('/', createQuotation);
quotationRouter.get('/', getAllQuotations);
quotationRouter.get('/:id', getQuotationById);
quotationRouter.put('/:id', updateQuotation);
quotationRouter.delete('/:id', deleteQuotation);

export default quotationRouter;