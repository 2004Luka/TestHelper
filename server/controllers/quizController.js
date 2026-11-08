import Quiz from '../models/Quiz.js';
import Submission from '../models/Submission.js';
import Comment from '../models/Comment.js';
import {
  parseTestDocument,
  parseAnswerKey,
  mergeQuestionsWithAnswers,
} from '../utils/wordParser.js';
import { nanoid } from 'nanoid';
import fs from 'fs/promises';
import path from 'path';
import { evaluateStudentQuizAccess } from '../utils/quizAccess.js';

const MAX_BACKGROUND_IMAGE_BYTES = 5 * 1024 * 1024;

const detectImageMime = (buffer) => {
  if (!buffer || buffer.length < 12) return null;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }
  // WebP: RIFF .... WEBP
  if (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  // GIF: GIF87a or GIF89a
  const gifHeader = buffer.toString('ascii', 0, 6);
  if (gifHeader === 'GIF87a' || gifHeader === 'GIF89a') {
    return 'image/gif';
  }
  // BMP: BM (0x42, 0x4D)
  if (buffer[0] === 0x42 && buffer[1] === 0x4d) {
    return 'image/bmp';
  }
  // AVIF: bytes 4-12 contain ftypavif or ftypavis
  const ftyp = buffer.toString('ascii', 4, 12);
  if (ftyp.includes('avif') || ftyp.includes('avis')) {
    return 'image/avif';
  }
  // HEIC / HEIF: bytes 4-12 contain ftypheic, ftypmif1, ftypmsf1, etc.
  if (ftyp.includes('heic') || ftyp.includes('heif') || ftyp.includes('mif1') || ftyp.includes('msf1')) {
    return 'image/heic';
  }
  // TIFF: II*\0 (little endian) or MM\0* (big endian)
  if (
    (buffer[0] === 0x49 && buffer[1] === 0x49 && buffer[2] === 0x2a && buffer[3] === 0x00) ||
    (buffer[0] === 0x4d && buffer[1] === 0x4d && buffer[2] === 0x00 && buffer[3] === 0x2a)
  ) {
    return 'image/tiff';
  }
  return null;
};

// POST /api/quizzes — Create quiz from two uploaded Word files (Teacher protected)
export const createQuiz = async (req, res, next) => {
  try {
    const { title, settings, quizType } = req.body;
    const testFile = req.files?.testFile?.[0];
    const answerFile = req.files?.answerFile?.[0];
    const imageFile = req.files?.imageFile?.[0];

    if ((imageFile?.size || 0) > MAX_BACKGROUND_IMAGE_BYTES) {
      return res.status(413).json({
        success: false,
        message: 'Background image must be 5 MB or smaller after compression',
      });
    }

    const isImageQuiz = quizType === 'image' || Boolean(imageFile);

    if (isImageQuiz && !imageFile) {
      return res
        .status(400)
        .json({ success: false, message: 'Background image is required for image tests' });
    }

    if (!testFile || !answerFile) {
      return res
        .status(400)
        .json({ success: false, message: 'Both test and answer files are required' });
    }

    const questions = await parseTestDocument(testFile.path);
    const answers = await parseAnswerKey(answerFile.path);

    if (questions.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'No questions found in the test file. Check formatting.' });
    }

    const mergedQuestions = mergeQuestionsWithAnswers(questions, answers);
    const shareCode = nanoid(8);

    let parsedSettings = {};
    if (settings) {
      if (typeof settings === 'string') {
        try {
          parsedSettings = JSON.parse(settings);
        } catch (e) {
          parsedSettings = {};
        }
      } else if (typeof settings === 'object') {
        parsedSettings = settings;
      }
    }

    // Persist compressed image in database so any student on any device can access it
    let storedImage = '';
    if (imageFile) {
      const buffer = await fs.readFile(imageFile.path);
      const verifiedMime = detectImageMime(buffer);
      if (!verifiedMime) {
        return res.status(400).json({
          success: false,
          message: 'Invalid image file. Upload a genuine PNG, JPEG, or WebP image.',
        });
      }
      storedImage = `data:${verifiedMime};base64,${buffer.toString('base64')}`;
    }

    const quiz = await Quiz.create({
      teacher: req.teacher?._id,
      title: title || 'Untitled Quiz',
      quizType: isImageQuiz ? 'image' : 'standard',
      backgroundImage: storedImage,
      questions: mergedQuestions,
      shareCode,
      settings: parsedSettings,
    });

    const responseQuiz = quiz.toObject();
    delete responseQuiz.backgroundImage;
    res.status(201).json({ success: true, data: responseQuiz });
  } catch (err) {
    next(err);
  } finally {
    const uploadedFiles = Object.values(req.files || {}).flat();
    await Promise.all(uploadedFiles.map((file) => fs.unlink(file.path).catch(() => {})));
  }
};

// GET /api/quizzes — List teacher's own quizzes with submission counts (Teacher protected)
export const getAllQuizzes = async (req, res, next) => {
  try {
    if (!req.teacher?._id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const isDeletedQuery = req.query.deleted === 'true' || req.query.status === 'deleted';
    const filter = {
      teacher: req.teacher._id,
      isDeleted: isDeletedQuery ? true : { $ne: true },
    };

    const sortOrder = isDeletedQuery ? { deletedAt: -1, updatedAt: -1 } : { createdAt: -1 };

    const quizzes = await Quiz.find(filter)
      .select('-backgroundImage')
      .sort(sortOrder)
      .lean();

    const withStats = await Promise.all(
      quizzes.map(async (quiz) => {
        const submissionCount = await Submission.countDocuments({ quizId: quiz._id });
        return { ...quiz, submissionCount };
      })
    );

    const activeCount = await Quiz.countDocuments({
      teacher: req.teacher._id,
      isDeleted: { $ne: true },
    });
    const deletedCount = await Quiz.countDocuments({
      teacher: req.teacher._id,
      isDeleted: true,
    });

    res.json({
      success: true,
      data: withStats,
      activeCount,
      deletedCount,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/quizzes/code/:shareCode — Student-safe quiz (no correct answers) (Public)
export const getQuizByCode = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ shareCode: req.params.shareCode });

    if (!quiz || quiz.isDeleted) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    const isOwnerTeacher = Boolean(
      req.teacher?._id && quiz.teacher && req.teacher._id.toString() === quiz.teacher.toString()
    );

    if (!isOwnerTeacher) {
      if (req.student) {
        const studentTeacherId = req.student.teacher?._id || req.student.teacher;
        if (studentTeacherId?.toString() !== quiz.teacher?.toString()) {
          return res.status(403).json({ success: false, message: 'This quiz is not available to your account' });
        }
      }
      // Check access using priority hierarchy
      const accessEvaluation = evaluateStudentQuizAccess(quiz, req.student);
      if (!accessEvaluation.hasAccess) {
        return res.status(403).json({
          success: false,
          requiresLogin: accessEvaluation.requiresLogin,
          accessDenied: true,
          message: accessEvaluation.message,
        });
      }
    }

    // Auto-migrate legacy file-based background image into MongoDB Data URI
    let bgImage = quiz.backgroundImage || '';
    if (bgImage && !bgImage.startsWith('data:') && !bgImage.startsWith('http')) {
      const normalized = bgImage.replace(/\\/g, '/');
      const candidatePaths = [
        path.resolve('uploads', path.basename(normalized)),
      ];
      for (const p of candidatePaths) {
        try {
          const buf = await fs.readFile(p);
          const ext = path.extname(p).toLowerCase();
          const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
          bgImage = `data:${mime};base64,${buf.toString('base64')}`;
          quiz.backgroundImage = bgImage;
          await quiz.save();
          break;
        } catch {}
      }
    }

    // Return an explicit student-safe shape; never expose teacher or roster IDs.
    const backgroundImage = bgImage
      ? bgImage.startsWith('http')
        ? bgImage
        : `/api/quizzes/${quiz.shareCode}/image`
      : '';
    const safe = {
      _id: quiz._id,
      title: quiz.title,
      shareCode: quiz.shareCode,
      quizType: quiz.quizType || 'standard',
      backgroundImage,
      isActive: quiz.isActive,
      settings: quiz.settings,
      accessMode: quiz.accessMode,
      createdAt: quiz.createdAt,
      questions: quiz.questions.map((question) => {
        const safeQuestion = question.toObject();
        delete safeQuestion.correctAnswer;
        return safeQuestion;
      }),
    };

    res.json({ success: true, data: safe });
  } catch (err) {
    next(err);
  }
};

// GET /api/quizzes/:shareCode/image — Fetch an image for an authorized quiz participant
export const getQuizImage = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ shareCode: req.params.shareCode });
    if (!quiz || quiz.isDeleted || !quiz.backgroundImage) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    const isOwnerTeacher = Boolean(
      req.teacher?._id && quiz.teacher && req.teacher._id.toString() === quiz.teacher.toString()
    );

    if (!isOwnerTeacher) {
      if (req.student) {
        const studentTeacherId = req.student.teacher?._id || req.student.teacher;
        if (studentTeacherId?.toString() !== quiz.teacher?.toString()) {
          return res.status(403).json({ success: false, message: 'This quiz is not available to your account' });
        }
      }

      const accessEvaluation = evaluateStudentQuizAccess(quiz, req.student);
      if (!accessEvaluation.hasAccess) {
        return res.status(403).json({
          success: false,
          requiresLogin: accessEvaluation.requiresLogin,
          accessDenied: true,
          message: accessEvaluation.message,
        });
      }
    }

    if (quiz.backgroundImage.startsWith('data:image/')) {
      const parts = quiz.backgroundImage.split(';base64,');
      const mime = parts[0].replace('data:', '') || 'image/jpeg';
      const allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/bmp',
        'image/avif',
        'image/heic',
        'image/heif',
        'image/tiff',
      ];
      if (!allowedMimes.includes(mime) || !parts[1]) {
        return res.status(415).json({ success: false, message: 'Unsupported image format' });
      }
      const buffer = Buffer.from(parts[1], 'base64');
      res.set('Content-Type', mime);
      res.set('X-Content-Type-Options', 'nosniff');
      res.set('Cache-Control', 'private, no-store');
      return res.send(buffer);
    }

    const normalized = quiz.backgroundImage.replace(/\\/g, '/');
    const candidatePaths = [
      path.resolve('uploads', path.basename(normalized)),
    ];

    for (const p of candidatePaths) {
      try {
        await fs.access(p);
        res.set('X-Content-Type-Options', 'nosniff');
        res.set('Cache-Control', 'private, no-store');
        return res.sendFile(p);
      } catch {}
    }

    return res.status(404).json({ success: false, message: 'Image file not found on server' });
  } catch (err) {
    next(err);
  }
};

// GET /api/quizzes/:shareCode/full — Teacher view with answers (Teacher protected)
export const getFullQuiz = async (req, res, next) => {
  try {
    if (!req.teacher?._id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const quiz = await Quiz.findOne({
      shareCode: req.params.shareCode,
      teacher: req.teacher._id,
    }).select('-backgroundImage');
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found or unauthorized' });
    }
    res.json({ success: true, data: quiz });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/quizzes/:shareCode/toggle — Enable/disable quiz link (Teacher protected)
export const toggleQuiz = async (req, res, next) => {
  try {
    if (!req.teacher?._id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const quiz = await Quiz.findOne({
      shareCode: req.params.shareCode,
      teacher: req.teacher._id,
    });
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found or unauthorized' });
    }

    quiz.isActive = !quiz.isActive;
    await quiz.save();

    res.json({ success: true, data: quiz });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/quizzes/:shareCode — Soft delete first time; permanent delete if already in deleted section (Teacher protected)
export const deleteQuiz = async (req, res, next) => {
  try {
    if (!req.teacher?._id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const quiz = await Quiz.findOne({
      shareCode: req.params.shareCode,
      teacher: req.teacher._id,
    });
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found or unauthorized' });
    }

    const forcePermanent = req.query.permanent === 'true';

    // If quiz is already soft-deleted or permanent delete requested, remove permanently with all related data
    if (quiz.isDeleted || forcePermanent) {
      await Quiz.findByIdAndDelete(quiz._id);
      await Submission.deleteMany({ quizId: quiz._id });
      await Comment.deleteMany({ quizId: quiz._id });

      return res.json({
        success: true,
        message: 'Quiz permanently deleted',
        permanent: true,
      });
    }

    // First time deletion: soft-delete into Recently Deleted section, preserving submissions and data
    quiz.isDeleted = true;
    quiz.deletedAt = new Date();
    await quiz.save();

    res.json({
      success: true,
      message: 'Quiz moved to recently deleted',
      permanent: false,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/quizzes/:shareCode/restore — Restore a soft-deleted quiz (Teacher protected)
export const restoreQuiz = async (req, res, next) => {
  try {
    if (!req.teacher?._id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const quiz = await Quiz.findOne({
      shareCode: req.params.shareCode,
      teacher: req.teacher._id,
    });
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found or unauthorized' });
    }

    quiz.isDeleted = false;
    quiz.deletedAt = null;
    await quiz.save();

    res.json({ success: true, message: 'Quiz restored successfully', data: quiz });
  } catch (err) {
    next(err);
  }
};
