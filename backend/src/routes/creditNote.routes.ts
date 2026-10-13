import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  listCreditNotes,
  getCreditNote,
  refundCreditNote,
} from '../controllers/creditNoteController';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/credit-notes - Listar notas de crédito
router.get('/', listCreditNotes);

// GET /api/credit-notes/:id - Obtener una nota de crédito
router.get('/:id', getCreditNote);

// POST /api/credit-notes/:id/refund - Registrar un reembolso del proveedor
router.post('/:id/refund', refundCreditNote);

export default router;
