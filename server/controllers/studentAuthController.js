import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Class from '../models/Class.js';
import Quiz from '../models/Quiz.js';
import Submission from '../models/Submission.js';
import { evaluateStudentQuizAccess } from '../utils/quizAccess.js';
import { studentRegisterSchema, studentLoginSchema } from '../utils/authValidators.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_quizgen_2026';

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const generateStudentToken = (id) => {
  return jwt.sign({ id, role: 'student' }, JWT_SECRET, { expiresIn: '30d' });
};

const sendStudentTokenResponse = (student, statusCode, res, message = 'Success') => {
  const token = generateStudentToken(student._id);

  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };

  res
    .status(statusCode)
    .cookie('studentToken', token, options)
    .json({
      success: true,
      message,
      token,
      student: {
        id: student._id,
        name: student.name,
        username: student.username,
        teacher: student.teacher,
        class: student.class,
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
    const teacher = await Teacher.findById(req.params.teacherId).select('name subject');
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
    const classes = await Class.find({ teacher: req.params.teacherId }).select('name code description').sort({ name: 1 });
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
        message: parseResult.error.errors[0]?.message || 'Invalid registration input',
      });
    }

    const { name, username, password, teacherId, classId, classCode } = parseResult.data;

    const existing = await Student.findOne({
      username: { $regex: new RegExp(`^${escapeRegex(username)}$`, 'i') },
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'A student with this username already exists' });
    }

    // Verify teacher exists
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Selected teacher does not exist' });
    }

    // Resolve class if provided by classId or classCode
    let resolvedClassId = null;
    if (classId) {
      const cls = await Class.findOne({ _id: classId, teacher: teacherId });
      if (cls) resolvedClassId = cls._id;
    } else if (classCode) {
      const cls = await Class.findOne({ code: classCode.trim().toUpperCase(), teacher: teacherId });
      if (cls) resolvedClassId = cls._id;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const student = await Student.create({
      name,
      username,
      password: hashedPassword,
      teacher: teacher._id,
      class: resolvedClassId,
    });

    const populatedStudent = await Student.findById(student._id)
      .select('-password')
      .populate('teacher', 'name subject')
      .populate('class', 'name code');

    sendStudentTokenResponse(populatedStudent, 201, res, 'Student registered successfully');
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
        message: parseResult.error.errors[0]?.message || 'Invalid login input',
      });
    }

    const { username, password } = parseResult.data;

    const student = await Student.findOne({
      username: { $regex: new RegExp(`^${escapeRegex(username)}$`, 'i') },
    })
      .populate('teacher', 'name subject')
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

// POST /api/students/logout — Clear student cookie
export const logoutStudent = async (req, res) => {
  res.cookie('studentToken', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });
  res.json({ success: true, message: 'Logged out successfully' });
};

// GET /api/students/me — Student profile (Student protected)
export const getStudentMe = async (req, res) => {
  res.json({
    success: true,
    data: req.student,
  });
};

// POST /api/students/join-class — Join/switch class using class code (Student protected)
export const joinClassByCode = async (req, res, next) => {
  try {
    const { classCode } = req.body;
    if (!classCode) {
      return res.status(400).json({ success: false, message: 'Class code is required' });
    }

    const targetClass = await Class.findOne({ code: classCode.trim().toUpperCase() })
      .populate('teacher', 'name subject');

    if (!targetClass) {
      return res.status(404).json({ success: false, message: 'Class with this code was not found' });
    }

    // Update student's class (and teacher if it belongs to a new teacher)
    req.student.class = targetClass._id;
    if (targetClass.teacher?._id) {
      req.student.teacher = targetClass.teacher._id;
    }
    await req.student.save();

    const updated = await Student.findById(req.student._id)
      .select('-password')
      .populate('teacher', 'name subject')
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

// GET /api/students/my-quizzes — List quizzes from student's teacher with open/closed status (Student protected)
export const getStudentQuizzes = async (req, res, next) => {
  try {
    const student = req.student;
    const teacherId = student.teacher?._id || student.teacher;

    if (!teacherId) {
      return res.json({ success: true, data: [] });
    }

    // Fetch active non-deleted quizzes from student's teacher
    const quizzes = await Quiz.find({
      teacher: teacherId,
      isDeleted: false,
    })
      .select('title shareCode isActive accessMode assignedClasses allowedStudents blockedStudents settings createdAt')
      .sort({ createdAt: -1 });

    // Fetch student's submissions for these quizzes
    const submissions = await Submission.find({
      $or: [
        { student: student._id },
        { studentName: student.name },
      ],
    }).sort({ createdAt: -1 });

    const studentClassIdStr = student.class?._id?.toString() || student.class?.toString() || null;
    const studentIdStr = student._id.toString();

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
