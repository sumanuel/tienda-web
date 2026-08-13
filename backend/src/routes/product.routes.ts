import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
} from '../controllers/productController';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/products/categories - Obtener categorías únicas
router.get('/categories', getCategories);

// GET /api/products - Listar productos (con filtros opcionales)
router.get('/', listProducts);

// GET /api/products/:id - Obtener un producto específico
router.get('/:id', getProduct);

// POST /api/products - Crear nuevo producto
router.post('/', createProduct);

// PUT /api/products/:id - Actualizar producto
router.put('/:id', updateProduct);

// DELETE /api/products/:id - Eliminar producto
router.delete('/:id', deleteProduct);

export default router;
