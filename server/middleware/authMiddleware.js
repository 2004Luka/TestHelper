import jwt from 'jsonwebtoken';
import Teacher from '../models/Teacher.js';
import Student from '../models/Student.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_quizgen_2026';

const extractToken = (req) => {
  if (req.cookies && req.cookies.token && req.cookies.token !== 'none') {
    return req.cookies.token;
  }
  if (req.cookies && req.cookies.studentToken && req.cookies.studentToken !== 'none') {
    return req.cookies.studentToken;
  }
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
};

export const protect = async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const teacher = await Teacher.findById(decoded.id).select('-password');

    if (!teacher) {
      return res.status(401).json({ message: 'Teacher account not found or unauthorized' });
    }

    req.teacher = teacher;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
  }
};

export const protectStudent = async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, student token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const student = await Student.findById(decoded.id)
      .select('-password')
      .populate('teacher', 'name subject')
      .populate('class', 'name code');

    if (!student) {
      return res.status(401).json({ message: 'Student account not found' });
    }

    req.student = student;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
  }
};

export const optionalAuth = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role === 'student') {
      const student = await Student.findById(decoded.id).select('-password');
      if (student) req.student = student;
    } else {
      const teacher = await Teacher.findById(decoded.id).select('-password');
      if (teacher) {
        req.teacher = teacher;
      } else {
        const student = await Student.findById(decoded.id).select('-password');
        if (student) req.student = student;
      }
    }
  } catch {
    // optional, ignore invalid token
  }
  next();
};

