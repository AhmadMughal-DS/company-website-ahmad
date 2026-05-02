// ============================================================
// AHMAD & CO. Backend API — server.js
// Express server: Contact form + Lead storage
// Security: helmet, rate-limit, CORS, dotenv
// ============================================================

// Load environment variables FIRST (before anything else)
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const path       = require('path');

const contactRoutes = require('./routes/contact');

const app  = express();
const PORT = process.env.PORT || 3001;
const ENV  = process.env.NODE_ENV || 'development';

// ── Security Headers (helmet) ─────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'none'"],
      scriptSrc:   ["'none'"],
      styleSrc:    ["'none'"],
      imgSrc:      ["'none'"],
      connectSrc:  ["'self'"],
      frameSrc:    ["'none'"],
      objectSrc:   ["'none'"],
    }
  },
  crossOriginEmbedderPolicy: false, // API — disable for frontend access
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// ── Trust proxy (for rate limiting behind nginx/docker) ───────
app.set('trust proxy', 1);

// ── Middleware ────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));          // Limit body size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── CORS — allow only frontend domain ─────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'https://ahmadco.tech',
  'http://localhost:8080',
  'http://127.0.0.1:8080'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS policy: origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'x-admin-token'],
  credentials: false
}));

// ── Rate Limiting ─────────────────────────────────────────────
// General API limit
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,       // 15 minutes
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});

// Strict limit for contact form submissions
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,       // 1 hour
  max: 5,                          // Max 5 form submissions per IP per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many submissions. Please try again in an hour.' }
});

// ── Routes ────────────────────────────────────────────────────
app.use('/api', generalLimiter);
app.use('/api/contact', contactLimiter, contactRoutes);

// Health check (public)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AHMAD & CO. Backend',
    env: ENV,
    timestamp: new Date().toISOString()
  });
});

// ── 404 handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  // Don't leak error details in production
  const isDev = ENV === 'development';
  console.error('Server error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: isDev ? err.message : 'Internal server error'
  });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ AHMAD & CO. Backend running on port ${PORT} [${ENV}]`);
  console.log(`📧 Notify email: ${process.env.NOTIFY_EMAIL || '(not set)'}`);
  console.log(`🔒 CORS origins: ${allowedOrigins.join(', ')}`);
  if (!process.env.ADMIN_TOKEN) {
    console.warn('⚠️  WARNING: ADMIN_TOKEN not set — leads endpoint is unprotected!');
  }
});
