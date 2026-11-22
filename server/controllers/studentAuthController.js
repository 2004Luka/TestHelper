import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { z } from 'zod';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Class from '../models/Class.js';
import Quiz from '../models/Quiz.js';
import Submission from '../models/Submission.js';
import TutorWorkspace from '../models/TutorWorkspace.js';
import {
  evaluateStudentQuizAccess,
  getStudentTeacherIds,
  teacherStudentFilter,
} from '../utils/quizAccess.js';
import { studentRegisterSchema, studentLoginSchema } from '../utils/authValidators.js';

const getJwtSecret = () => process.env.JWT_SECRET;
const jwtOptions = { issuer: 'quizgen-api', audience: 'quizgen-client' };
const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/',
});

const studentPasswordResetSchema = z.object({
  token: z.string().length(64).regex(/^[a-f0-9]{64}$/i),
  password: studentRegisterSchema.shape.password,
});

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const generateStudentToken = (student) => {
  return jwt.sign(
    { id: student._id, role: 'student', sessionVersion: student.sessionVersion || 0 },
    getJwtSecret(),
    { ...jwtOptions, expiresIn: '7d' }
  );
};

const sendStudentTokenResponse = (student, statusCode, res, message = 'Success') => {
  const token = generateStudentToken(student);
  const teachers = [...new Map(
    [...(student.teachers || []), student.teacher]
      .filter(Boolean)
      .map((teacher) => [String(teacher?._id || teacher), teacher])
  ).values()];

  res
    .status(statusCode)
    .clearCookie('token', getCookieOptions())
    .cookie('studentToken', token, { ...getCookieOptions(), maxAge: 7 * 24 * 60 * 60 * 1000 })
    .json({
      success: true,
      message,
      student: {
        id: student._id,
        name: student.name,
        username: student.username,
        teacher: student.teacher,
        teachers,
        class: student.class,
        teacherClasses: student.teacherClasses || [],
      },
    });
};

// GET /api/students/teachers — Public list of teachers for registration dropdown
export const getPublicTeachers = async (req, res, next) => {
  try {
    const teachers = await Teacher.find({ showInRegistrationList: { $ne: false } })
      .select('name subject createdAt')
      .sort({ name: 1 });
    res.json({ success: true, data: teachers });
  } catch (err) {
    next(err);
  }
};

// GET /api/students/teachers/:teacherId — Public details for direct link registration
export const getTeacherPublicInfo = async (req, res, next) => {
  try {
    const teacher = await Teacher.findOne({
      _id: req.params.teacherId,
      showInRegistrationList: { $ne: false },
    }).select('name subject');
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    res.json({ success: true, data: teacher });
  } catch (err) {
    next(err);
  }
};

// GET /api/students/teachers/:teacherId/classes — Public list of classes for a chosen teacher
export const getTeacherClassesPublic = async (req, res, next) => {
  try {
    const teacher = await Teacher.findOne({
      _id: req.params.teacherId,
      showInRegistrationList: { $ne: false },
    }).select('_id');
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    const classes = await Class.find({ teacher: req.params.teacherId }).select('name -_id').sort({ name: 1 });
    res.json({ success: true, data: classes });
  } catch (err) {
    next(err);
  }
};

// POST /api/students/register — Register new student
export const registerStudent = async (req, res, next) => {
  try {
    const parseResult = studentRegisterSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: (parseResult.error.issues?.[0] || parseResult.error.errors?.[0])?.message || 'Invalid registration input',
      });
    }

    const { name, username, password, teacherId, classCode } = parseResult.data;

    const existing = await Student.findOne({
      username: { $regex: new RegExp(`^${escapeRegex(username)}$`, 'i') },
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'A student with this username already exists' });
    }

    let teacher = teacherId
      ? await Teacher.findOne({ _id: teacherId, showInRegistrationList: { $ne: false } })
      : null;
    if (teacherId && !teacher) {
      return res.status(404).json({ success: false, message: 'Selected teacher is unavailable' });
    }

    let resolvedClass = null;
    if (classCode) {
      const classFilter = { code: classCode.trim().toUpperCase() };
      if (teacher) classFilter.teacher = teacher._id;
      resolvedClass = await Class.findOne(classFilter).populate('teacher', 'name subject');
      if (resolvedClass && !teacher) {
        teacher = resolvedClass.teacher;
      }
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const student = await Student.create({
      name,
      username,
      password: hashedPassword,
      teacher: teacher?._id || null,
      teachers: teacher ? [teacher._id] : [],
      teacherClasses: resolvedClass && teacher ? [{ teacher: teacher._id, class: resolvedClass._id }] : [],
      class: resolvedClass?._id || null,
    });

    const populatedStudent = await Student.findById(student._id)
      .select('-password')
      .populate('teacher', 'name subject')
      .populate('teachers', 'name subject')
      .populate('teacherClasses.teacher', 'name subject')
      .populate('teacherClasses.class', 'name code')
      .populate('class', 'name code');

    sendStudentTokenResponse(populatedStudent, 201, res, 'Student registered successfully');
  } catch (err) {
    next(err);
  }
};

// POST /api/students/teachers/enroll — Add a teacher to the signed-in student's account
export const addStudentTeacher = async (req, res, next) => {
  try {
    const { teacherId } = req.body || {};
    if (!mongoose.isValidObjectId(teacherId)) {
      return res.status(400).json({ success: false, message: 'Choose a valid teacher.' });
    }

    const teacher = await Teacher.findOne({
      _id: teacherId,
      showInRegistrationList: { $ne: false },
    }).select('name subject');
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found.' });
    }

    const student = await Student.findById(req.student._id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const linkedTeacherIds = getStudentTeacherIds(student);
    student.teachers = linkedTeacherIds;
    const alreadyLinked = linkedTeacherIds.some(
      (id) => id.toString() === teacher._id.toString()
    );
    if (!alreadyLinked) student.teachers = [...linkedTeacherIds, teacher._id];
    if (!student.teacher) student.teacher = teacher._id;
    await student.save();

    const updated = await Student.findById(student._id)
      .select('-password')
      .populate('teacher', 'name subject')
      .populate('teachers', 'name subject')
      .populate('teacherClasses.teacher', 'name subject')
      .populate('teacherClasses.class', 'name code')
      .populate('class', 'name code');

    res.json({
      success: true,
      message: alreadyLinked ? 'You already follow this teacher.' : 'Teacher added successfully.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/students/login — Log in student
export const loginStudent = async (req, res, next) => {
  try {
    const parseResult = studentLoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: (parseResult.error.issues?.[0] || parseResult.error.errors?.[0])?.message || 'Invalid login input',
      });
    }

    const { username, password } = parseResult.data;

    const student = await Student.findOne({
      username: { $regex: new RegExp(`^${escapeRegex(username)}$`, 'i') },
    })
      .select('+password')
      .populate('teacher', 'name subject')
      .populate('teachers', 'name subject')
      .populate('teacherClasses.teacher', 'name subject')
      .populate('teacherClasses.class', 'name code')
      .populate('class', 'name code');

    if (!student) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    sendStudentTokenResponse(student, 200, res, 'Login successful');
  } catch (err) {
    next(err);
  }
};

// POST /api/students/teacher/:studentId/password-reset — Create a short-lived reset link
export const createStudentPasswordResetLink = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.studentId)) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    const student = await Student.findOneAndUpdate(
      {
        _id: req.params.studentId,
        ...teacherStudentFilter(req.teacher._id),
      },
      {
        $set: {
          passwordResetTokenHash: createHash('sha256').update(token).digest('hex'),
          passwordResetExpires: expiresAt,
        },
      }
    );
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.status(201).json({
      success: true,
      data: { token, expiresAt },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/students/password-reset — Consume a reset token and update the password
export const resetStudentPassword = async (req, res, next) => {
  try {
    const parsed = studentPasswordResetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'Password reset link is invalid or expired' });
    }

    const tokenHash = createHash('sha256').update(parsed.data.token).digest('hex');
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const student = await Student.findOneAndUpdate(
      {
        passwordResetTokenHash: tokenHash,
        passwordResetExpires: { $gt: new Date() },
      },
      {
        $set: { password: passwordHash },
        $unset: { passwordResetTokenHash: 1, passwordResetExpires: 1 },
        $inc: { sessionVersion: 1 },
      }
    );

    if (!student) {
      return res.status(400).json({ success: false, message: 'Password reset link is invalid or expired' });
    }

    res
      .clearCookie('studentToken', getCookieOptions())
      .json({ success: true, message: 'Password updated. Please sign in.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/students/logout — Clear student cookie
export const logoutStudent = async (req, res, next) => {
  try {
    if (req.student?._id) {
      await Student.updateOne({ _id: req.student._id }, { $inc: { sessionVersion: 1 } });
    }
    res
      .clearCookie('studentToken', getCookieOptions())
      .json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// GET /api/students/me — Student profile (Student protected)
export const getStudentMe = async (req, res, next) => {
  try {
    const teacherId = req.student.teacher?._id || req.student.teacher;
    const workspace = teacherId
      ? await TutorWorkspace.findOne({ teacher: teacherId }).select('students currency').lean()
      : null;
    const finance = workspace?.students?.find((record) => String(record.studentId) === String(req.student._id));
    const data = req.student.toObject();
    data.billing = finance?.courseFee !== null && finance?.courseFee !== undefined
      ? {
          courseFee: finance.courseFee,
          installmentCount: finance.installmentCount,
          payments: (finance.payments || []).map(({ id, amount, date }) => ({ id, amount, date })),
          currency: workspace.currency || 'GEL',
        }
      : null;
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// POST /api/students/join-class — Join/switch class using class code (Student protected)
export const joinClassByCode = async (req, res, next) => {
  try {
    const { classCode } = req.body;
    if (!classCode) {
      return res.status(400).json({ success: false, message: 'Class code is required' });
    }

    const targetClass = await Class.findOne({
      code: classCode.trim().toUpperCase(),
    })
      .populate('teacher', 'name subject');

    if (!targetClass) {
      return res.status(404).json({ success: false, message: 'Class with this code was not found' });
    }

    const student = await Student.findById(req.student._id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    const targetTeacherId = targetClass.teacher?._id || targetClass.teacher;
    const linkedTeacherIds = getStudentTeacherIds(student);
    student.teachers = linkedTeacherIds;
    const alreadyLinked = linkedTeacherIds.some(
      (id) => id.toString() === targetTeacherId.toString()
    );
    if (!alreadyLinked) student.teachers = [...linkedTeacherIds, targetTeacherId];
    if (!student.teacher) student.teacher = targetTeacherId;

    student.teacherClasses = (student.teacherClasses || []).filter((item) => {
      const linkedTeacherId = item.teacher?._id || item.teacher;
      return linkedTeacherId?.toString() !== targetTeacherId.toString();
    });
    student.teacherClasses.push({ teacher: targetTeacherId, class: targetClass._id });
    const primaryTeacherId = student.teacher?._id || student.teacher;
    if (primaryTeacherId?.toString() === targetTeacherId.toString()) {
      student.class = targetClass._id;
    }
    await student.save();

    const updated = await Student.findById(req.student._id)
      .select('-password')
      .populate('teacher', 'name subject')
      .populate('teachers', 'name subject')
      .populate('teacherClasses.teacher', 'name subject')
      .populate('teacherClasses.class', 'name code')
      .populate('class', 'name code');

    res.json({
      success: true,
      message: `Successfully joined ${targetClass.name}`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/students/my-quizzes — List quizzes from linked teachers with open/closed status (Student protected)
export const getStudentQuizzes = async (req, res, next) => {
  try {
    const student = req.student;
    const teacherIds = getStudentTeacherIds(student);

    if (teacherIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Fetch active non-deleted quizzes from all linked teachers
    const quizzes = await Quiz.find({
      teacher: { $in: teacherIds },
      isDeleted: false,
    })
      .select('teacher title shareCode isActive accessMode assignedClasses allowedStudents blockedStudents settings createdAt')
      .populate('teacher', 'name subject')
      .sort({ createdAt: -1 });

    // Fetch student's submissions for these quizzes
    const submissions = await Submission.find({
      student: student._id,
    }).sort({ createdAt: -1 });

    const formattedQuizzes = quizzes.map((quiz) => {
      const accessEvaluation = evaluateStudentQuizAccess(quiz, student);
      const isOpen = accessEvaluation.hasAccess;
      const accessReason = accessEvaluation.reason;

      // Find submissions for this quiz
      const quizSubmissions = submissions.filter((s) => s.quizId?.toString() === quiz._id.toString());
      const latestSubmission = quizSubmissions[0] || null;
      const bestScore = quizSubmissions.length > 0
        ? Math.max(...quizSubmissions.map((s) => s.score || 0))
        : null;

      return {
        _id: quiz._id,
        teacherId: quiz.teacher?._id || quiz.teacher,
        teacherName: quiz.teacher?.name || '',
        teacherSubject: quiz.teacher?.subject || '',
        title: quiz.title,
        shareCode: quiz.shareCode,
        isOpen,
        accessReason,
        timeLimit: quiz.settings?.timeLimit || 0,
        createdAt: quiz.createdAt,
        submissionsCount: quizSubmissions.length,
        latestScore: latestSubmission ? latestSubmission.score : null,
        bestScore,
        totalQuestions: latestSubmission ? latestSubmission.totalQuestions : null,
        percentage: latestSubmission ? latestSubmission.percentage : null,
      };
    });

    res.json({ success: true, data: formattedQuizzes });
  } catch (err) {
    next(err);
  }
};
