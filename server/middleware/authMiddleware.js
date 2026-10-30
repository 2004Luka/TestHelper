import jwt from 'jsonwebtoken';
import Teacher from '../models/Teacher.js';
import Student from '../models/Student.js';

const getJwtSecret = () => process.env.JWT_SECRET;
const jwtOptions = { issuer: 'quizgen-api', audience: 'quizgen-client' };


export const protect = async (req, res, next) => {
  let token = null;
  if (req.cookies?.token && req.cookies.token !== 'none') {
    token = req.cookies.token;
  } else if (req.headers.authorization && /^Bearer\s+/i.test(req.headers.authorization)) {
    token = req.headers.authorization.replace(/^Bearer\s+/i, '').trim();
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret(), jwtOptions);
    if (decoded.role !== 'teacher') {
      return res.status(403).json({ message: 'Teacher access required' });
    }
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
  let token = null;
  if (req.cookies?.studentToken && req.cookies.studentToken !== 'none') {
    token = req.cookies.studentToken;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, student token required' });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret(), jwtOptions);
    if (decoded.role !== 'student') {
      return res.status(403).json({ message: 'Student access required' });
    }
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
  try {
    const studentToken = req.cookies?.studentToken;
    const teacherToken = req.cookies?.token;
    const bearer = /^Bearer\s+/i.test(req.headers?.authorization || '')
      ? req.headers.authorization.replace(/^Bearer\s+/i, '').trim()
      : null;
    const candidates = [studentToken, teacherToken, bearer].filter(Boolean);

    for (const candidate of candidates) {
      try {
        const decoded = jwt.verify(candidate, getJwtSecret(), jwtOptions);
        if (decoded.role === 'student') {
          const student = await Student.findById(decoded.id)
            .select('-password')
            .populate('teacher', 'name subject')
            .populate('class', 'name code');
          if (student) {
            req.student = student;
            break;
          }
        } else if (decoded.role === 'teacher') {
          const teacher = await Teacher.findById(decoded.id).select('-password');
          if (teacher) {
            req.teacher = teacher;
            break;
          }
        }
      } catch {
        // Public quiz routes continue without an invalid optional session.
      }
    }
  } catch {
    // optional, ignore invalid token
  }
  next();
};

