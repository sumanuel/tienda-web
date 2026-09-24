import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import storeRoutes from './routes/store.routes';
import productRoutes from './routes/product.routes';
import saleRoutes from './routes/sale.routes';
import purchaseRoutes from './routes/purchase.routes';
import purchaseReturnRoutes from './routes/purchaseReturn.routes';
import inventoryRoutes from './routes/inventory.routes';
import customerRoutes from './routes/customer.routes';
import supplierRoutes from './routes/supplier.routes';
import exchangeRateRoutes from './routes/exchangeRateRoutes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();

const defaultAllowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://10.2.0.2:3000',
  'http://10.2.0.2:3001',
];

const envAllowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim().replace(/^"|"$/g, ''))
  .filter(Boolean);

const allowedOrigins = Array.from(
  new Set([...defaultAllowedOrigins, ...envAllowedOrigins])
);

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir herramientas sin origin (curl/postman/SSR)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS bloqueado para origen: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/purchase-returns', purchaseReturnRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/exchange-rates', exchangeRateRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler (debe ser el último middleware)
app.use(errorHandler);

export default app;
