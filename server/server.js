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

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Security HTTP headers
app.use(helmet());

// Prevent NoSQL injection
app.use(mongoSanitize());

// Strict CORS config
app.use(cors({ 
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(morgan('dev'));
// Limit payload size to 1MB (was 10MB) to mitigate DOS
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

// API Routes
app.use('/api/quizzes', quizRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/comments', commentRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Centralized error handler
app.use(errorHandler);

// Connect DB then start server
connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
});
