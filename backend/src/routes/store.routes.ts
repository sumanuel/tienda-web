import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  listStores,
  getStore,
  createStore,
  updateStore,
  deleteStore,
} from '../controllers/storeController';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/stores - Listar tiendas del usuario
router.get('/', listStores);

// GET /api/stores/:id - Obtener una tienda específica
router.get('/:id', getStore);

// POST /api/stores - Crear nueva tienda
router.post('/', createStore);

// PUT /api/stores/:id - Actualizar tienda
router.put('/:id', updateStore);

// DELETE /api/stores/:id - Eliminar tienda
router.delete('/:id', deleteStore);

export default router;
