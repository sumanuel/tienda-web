import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
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

const app = express();

// Detrás de un proxy (p. ej. el rewrite de Next.js) la IP real viene en
// X-Forwarded-For; indica cuántos proxies confiables hay con TRUST_PROXY=1.
if (process.env.TRUST_PROXY) {
  app.set('trust proxy', Number(process.env.TRUST_PROXY) || true);
}

// Orígenes de desarrollo local; en producción solo se permite FRONTEND_URL
const developmentOrigins = [
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
  new Set([
    ...(process.env.NODE_ENV === 'production' ? [] : developmentOrigins),
    ...envAllowedOrigins,
  ])
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
app.use(helmet());

// Límite general por IP, y uno más estricto para el login y el registro
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta de nuevo en un momento.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  // Por IP + email, para que un atacante no pueda bloquear a todos los usuarios
  keyGenerator: (req) =>
    `${ipKeyGenerator(req.ip ?? '')}|${String(req.body?.email ?? '').toLowerCase()}`,
  message: {
    error:
      'Demasiados intentos. Espera unos minutos antes de volver a intentarlo.',
  },
});
app.use('/api', apiLimiter);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
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
