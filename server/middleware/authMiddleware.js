import jwt from 'jsonwebtoken';
import Teacher from '../models/Teacher.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_quizgen_2026';

export const protect = async (req, res, next) => {
  let token;

  // Check HTTP-Only cookie first, then fallback to Authorization header
  if (req.cookies && req.cookies.token && req.cookies.token !== 'none') {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const teacher = await Teacher.findById(decoded.id).select('-password');

    if (!teacher) {
      return res.status(401).json({ message: 'Teacher account no longer exists' });
    }

    req.teacher = teacher;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
  }
};
