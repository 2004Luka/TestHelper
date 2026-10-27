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

// Trust reverse proxy (Render, Heroku, etc.) for rate limiting and IP detection
app.set('trust proxy', 1);

// Middleware
// Security HTTP headers
app.use(helmet());

// Cookie parser
app.use(cookieParser());

// Prevent NoSQL injection
app.use(mongoSanitize());

// Dynamic & flexible CORS config to support Netlify, Render, and Localhost
const getOrigins = () => {
  if (!process.env.CLIENT_URL) return ['http://localhost:5173'];
  return process.env.CLIENT_URL.split(',').map((url) => url.trim().replace(/\/$/, ''));
};

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. server-to-server, curl, Postman, health checks)
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.replace(/\/$/, '');
    const allowed = getOrigins();

    // Allow configured origins, all .netlify.app deployments, or localhost
    if (
      allowed.includes('*') ||
      allowed.includes(cleanOrigin) ||
      cleanOrigin.endsWith('.netlify.app') ||
      cleanOrigin.includes('localhost') ||
      cleanOrigin.includes('127.0.0.1')
    ) {
      return callback(null, cleanOrigin);
    }

    // Reject unallowed origins gracefully without throwing an unhandled 500 error
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(morgan('dev'));
// Limit payload size to 1MB to mitigate DOS
app.use(express.json({ limit: '1mb' }));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // Limit each IP to 150 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api/', apiLimiter);

// Strict rate limiting on authentication to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Max 20 attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again after 15 minutes' }
});
app.use([
  '/api/auth/login',
  '/api/auth/register',
  '/auth/login',
  '/auth/register',
  '/api/students/login',
  '/api/students/register',
  '/students/login',
  '/students/register',
], authLimiter);

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
