import jwt from 'jsonwebtoken';
import Teacher from '../models/Teacher.js';
import Student from '../models/Student.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_quizgen_2026';


export const protect = async (req, res, next) => {
  let token = null;
  if (req.cookies?.token && req.cookies.token !== 'none') {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role === 'student') {
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
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role && decoded.role !== 'student') {
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
    const bearer = req.headers?.authorization?.startsWith('Bearer')
      ? req.headers.authorization.split(' ')[1]
      : null;

    const checkStudent = async (tok) => {
      if (!tok || tok === 'none') return false;
      try {
        const decoded = jwt.verify(tok, JWT_SECRET);
        const student = await Student.findById(decoded.id)
          .select('-password')
          .populate('teacher', 'name subject')
          .populate('class', 'name code');
        if (student) {
          req.student = student;
          return true;
        }
      } catch {}
      return false;
    };

    const checkTeacher = async (tok) => {
      if (!tok || tok === 'none') return false;
      try {
        const decoded = jwt.verify(tok, JWT_SECRET);
        if (decoded.role === 'student') return false;
        const teacher = await Teacher.findById(decoded.id).select('-password');
        if (teacher) {
          req.teacher = teacher;
          return true;
        }
      } catch {}
      return false;
    };

    if (studentToken) await checkStudent(studentToken);
    if (teacherToken) await checkTeacher(teacherToken);
    if (bearer && !req.student && !req.teacher) {
      const isStd = await checkStudent(bearer);
      if (!isStd) await checkTeacher(bearer);
    }
  } catch {
    // optional, ignore invalid token
  }
  next();
};

