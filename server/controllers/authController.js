import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Teacher from '../models/Teacher.js';
import Quiz from '../models/Quiz.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_quizgen_2026';

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
};

// Helper function to send token in HTTP-Only cookie & JSON response
const sendTokenResponse = (teacher, statusCode, res, message = 'Success') => {
  const token = generateToken(teacher._id);

  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      message,
      token,
      teacher: {
        id: teacher._id,
        name: teacher.name,
        subject: teacher.subject,
      },
    });
};

// @desc Register a new teacher
// @route POST /api/auth/register
export const registerTeacher = async (req, res, next) => {
  try {
    const { name, subject, password } = req.body;

    if (!name || !subject || !password) {
      return res.status(400).json({ message: 'Please provide name, subject, and password' });
    }

    const trimmedName = name.trim();
    const existingTeacher = await Teacher.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
    });

    if (existingTeacher) {
      return res.status(400).json({ message: 'A teacher with this name already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const teacher = await Teacher.create({
      name: trimmedName,
      subject: subject.trim(),
      password: hashedPassword,
    });

    // Check if this is the first registered teacher.
    // Automatically assign all existing unowned quizzes to the first teacher.
    const totalTeachers = await Teacher.countDocuments();
    if (totalTeachers === 1) {
      await Quiz.updateMany(
        { $or: [{ teacher: { $exists: false } }, { teacher: null }] },
        { $set: { teacher: teacher._id } }
      );
    }

    sendTokenResponse(teacher, 201, res, 'Registration successful');
  } catch (error) {
    next(error);
  }
};

// @desc Log in teacher
// @route POST /api/auth/login
export const loginTeacher = async (req, res, next) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({ message: 'Please provide name and password' });
    }

    const teacher = await Teacher.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    });

    if (!teacher) {
      return res.status(401).json({ message: 'Invalid teacher name or password' });
    }

    const isMatch = await bcrypt.compare(password, teacher.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid teacher name or password' });
    }

    sendTokenResponse(teacher, 200, res, 'Login successful');
  } catch (error) {
    next(error);
  }
};

// @desc Log out teacher & clear cookie
// @route POST /api/auth/logout
export const logoutTeacher = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });
  res.json({ success: true, message: 'Logged out successfully' });
};

// @desc Get logged-in teacher profile
// @route GET /api/auth/me
export const getMe = async (req, res) => {
  res.json({
    id: req.teacher._id,
    name: req.teacher.name,
    subject: req.teacher.subject,
  });
};
