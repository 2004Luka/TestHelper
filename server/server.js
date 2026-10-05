import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db.js';
import quizRoutes from './routes/quizRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

// ⚠️ Server returned error status 500: Internal Server Erpr i dont want to mix up developement and deployement server and client link connections i got this on submission fix it like when i upload to deployment it will still work as well as in development



const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Security HTTP headers
app.use(helmet());

// Prevent NoSQL injection
app.use(mongoSanitize());

// Dynamic & flexible CORS config to support Netlify, Render, and Localhost
const getOrigins = () => {
  if (!process.env.CLIENT_URL) return ['http://localhost:5173'];
  return process.env.CLIENT_URL.split(',').map((url) => url.trim().replace(/\/$/, ''));
};

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. server-to-server, curl, Postman)
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.replace(/\/$/, '');
    const allowed = getOrigins();

    if (
      allowed.includes('*') ||
      allowed.includes(cleanOrigin) ||
      cleanOrigin.endsWith('.netlify.app') ||
      cleanOrigin.includes('localhost') ||
      cleanOrigin.includes('127.0.0.1')
    ) {
      return callback(null, cleanOrigin);
    }

    return callback(new Error(`CORS policy blocked request from origin: ${origin}`));
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

// API Routes (mounted with /api/ and fallback without /api/ for flexible VITE_API_URL config)
app.use('/api/quizzes', quizRoutes);
app.use('/quizzes', quizRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/submissions', submissionRoutes);
app.use('/api/comments', commentRoutes);
app.use('/comments', commentRoutes);

// Health check
app.get(['/api/health', '/health'], (req, res) => res.json({ status: 'ok' }));

// Centralized error handler
app.use(errorHandler);

// Connect DB then start server
connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
});
