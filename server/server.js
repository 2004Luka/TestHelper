import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db.js';
import quizRoutes from './routes/quizRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import classRoutes from './routes/classRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

const getAllowedOrigins = () => {
  const configuredOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map((origin) => origin.trim()).filter(Boolean)
    : isProduction ? [] : ['http://localhost:5173'];

  return configuredOrigins.map((origin) => {
    let parsedOrigin;
    try {
      parsedOrigin = new URL(origin);
    } catch {
      throw new Error('CLIENT_URL must contain comma-separated valid origins');
    }

    if (parsedOrigin.origin !== origin.replace(/\/$/, '') || (isProduction && parsedOrigin.protocol !== 'https:')) {
      throw new Error('CLIENT_URL must contain exact origins; production origins must use HTTPS');
    }
    return parsedOrigin.origin;
  });
};

const allowedOrigins = getAllowedOrigins();
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32 || /^change_this|^replace_with/i.test(jwtSecret)) {
  throw new Error('JWT_SECRET must be a private random value with at least 32 characters');
}
if (isProduction && allowedOrigins.length === 0) {
  throw new Error('CLIENT_URL must list the exact HTTPS frontend origin(s) in production');
}

// Trust reverse proxy (Render, Heroku, etc.) for rate limiting and IP detection
app.set('trust proxy', 1);

// Middleware
// Security HTTP headers
app.use(helmet());
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Cookie parser
app.use(cookieParser());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    return callback(null, allowedOrigins.includes(origin));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Refuse insecure API traffic in production. The hosting proxy must preserve X-Forwarded-Proto.
app.use((req, res, next) => {
  if (isProduction && !req.secure) {
    return res.status(426).json({ success: false, message: 'HTTPS is required' });
  }
  next();
});

// CORS alone does not block state-changing requests; validate browser origins as a CSRF defense.
app.use((req, res, next) => {
  const origin = req.get('origin');
  const changesState = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  if (changesState && origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ success: false, message: 'Request origin is not allowed' });
  }
  next();
});

app.use(morgan('dev'));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // Limit each IP to 150 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' }
});
// Cover both the canonical /api paths and the legacy route aliases below.
app.use(apiLimiter);

// Throttle failed login attempts by client IP. Use a shared store when running multiple API instances.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes' }
});
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many registration attempts. Please try again later' }
});
app.use([
  '/api/auth/login',
  '/auth/login',
  '/api/students/login',
  '/students/login',
], loginLimiter);
app.use([
  '/api/auth/register',
  '/auth/register',
  '/api/students/register',
  '/students/register',
], registrationLimiter);

// Apply request limits before parsing bodies, then sanitize parsed JSON/query input.
app.use(express.json({ limit: '1mb' }));
app.use(mongoSanitize());

// API Routes (mounted with /api/ and fallback without /api/ for flexible VITE_API_URL config)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/quizzes', quizRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/submissions', submissionRoutes);
app.use('/api/comments', commentRoutes);
app.use('/comments', commentRoutes);
app.use('/api/students', studentRoutes);
app.use('/students', studentRoutes);
app.use('/api/classes', classRoutes);
app.use('/classes', classRoutes);

// Health check
app.get(['/api/health', '/health'], (req, res) => res.json({ status: 'ok' }));

// Centralized error handler
app.use(errorHandler);

// Connect DB then start server
connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
});
