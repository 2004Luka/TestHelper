import Class from '../models/Class.js';
import Student from '../models/Student.js';
import Quiz from '../models/Quiz.js';
import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
import {
  evaluateStudentQuizAccess,
  getStudentClassForTeacher,
  getStudentTeacherIds,
  teacherClassStudentFilter,
  teacherStudentFilter,
} from '../utils/quizAccess.js';

// GET /api/classes — List teacher's classes with student count (Teacher protected)
export const getTeacherClasses = async (req, res, next) => {
  try {
    const classes = await Class.find({ teacher: req.teacher._id }).sort({ createdAt: -1 });

    const classesWithCount = await Promise.all(
      classes.map(async (cls) => {
        const studentCount = await Student.countDocuments(
          teacherClassStudentFilter(req.teacher._id, cls._id)
        );
        return {
          ...cls.toObject(),
          studentCount,
        };
      })
    );

    res.json({ success: true, data: classesWithCount });
  } catch (err) {
    next(err);
  }
};

// POST /api/classes — Create a new class (Teacher protected)
export const createClass = async (req, res, next) => {
  try {
    const { name, code, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Class name is required' });
    }

    let classCode = code ? code.trim().toUpperCase() : nanoid(6).toUpperCase();

    // Check code uniqueness
    const existing = await Class.findOne({ code: classCode });
    if (existing) {
      if (code) {
        return res.status(400).json({ success: false, message: 'Class code already in use. Please pick another code.' });
      }
      classCode = nanoid(6).toUpperCase();
    }

    const newClass = await Class.create({
      name: name.trim(),
      code: classCode,
      teacher: req.teacher._id,
      description: description ? description.trim() : '',
    });

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: { ...newClass.toObject(), studentCount: 0 },
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/classes/:classId — Delete class (Teacher protected)
export const deleteClass = async (req, res, next) => {
  try {
    const targetClass = await Class.findOne({ _id: req.params.classId, teacher: req.teacher._id });
    if (!targetClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    // Unassign students from this class
    await Student.updateMany(
      { teacher: req.teacher._id, class: targetClass._id },
      { $set: { class: null } }
    );
    await Student.updateMany(
      { teacherClasses: { $elemMatch: { teacher: req.teacher._id, class: targetClass._id } } },
      { $pull: { teacherClasses: { teacher: req.teacher._id, class: targetClass._id } } }
    );

    // Remove from any assigned quizzes
    await Quiz.updateMany(
      { teacher: req.teacher._id, assignedClasses: targetClass._id },
      { $pull: { assignedClasses: targetClass._id } }
    );

    await Class.deleteOne({ _id: targetClass._id });

    res.json({ success: true, message: 'Class deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// GET /api/classes/students — Get all students belonging to teacher (Teacher protected)
export const getTeacherStudents = async (req, res, next) => {
  try {
    const students = await Student.find(teacherStudentFilter(req.teacher._id))
      .select('-password')
      .populate('class', 'name code')
      .populate('teacherClasses.teacher', 'name subject')
      .populate('teacherClasses.class', 'name code')
      .sort({ createdAt: -1 });

    const data = students.map((student) => {
      const record = student.toObject();
      const linkedClass = getStudentClassForTeacher(student, req.teacher._id);
      if (linkedClass) record.class = linkedClass;
      else if (String(student.teacher?._id || student.teacher) !== String(req.teacher._id)) record.class = null;
      return record;
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/classes/students/:studentId/assign — Assign or move student to class (Teacher protected)
export const assignStudentClass = async (req, res, next) => {
  try {
    const { classId } = req.body;
    const student = await Student.findOne({
      _id: req.params.studentId,
      ...teacherStudentFilter(req.teacher._id),
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    student.teacherClasses = (student.teacherClasses || []).filter((item) => {
      const itemTeacherId = item.teacher?._id || item.teacher;
      return itemTeacherId?.toString() !== req.teacher._id.toString();
    });

    if (classId) {
      const cls = await Class.findOne({ _id: classId, teacher: req.teacher._id });
      if (!cls) {
        return res.status(404).json({ success: false, message: 'Class not found' });
      }
      student.teacherClasses.push({ teacher: req.teacher._id, class: cls._id });
      if (String(student.teacher) === req.teacher._id.toString()) student.class = cls._id;
    } else {
      if (String(student.teacher) === req.teacher._id.toString()) student.class = null;
    }

    await student.save();

    const updated = await Student.findById(student._id)
      .select('-password')
      .populate('teacher', 'name subject')
      .populate('teachers', 'name subject')
      .populate('teacherClasses.teacher', 'name subject')
      .populate('teacherClasses.class', 'name code')
      .populate('class', 'name code');

    const updatedData = updated.toObject();
    updatedData.class = getStudentClassForTeacher(updated, req.teacher._id);
    res.json({ success: true, message: 'Student class updated', data: updatedData });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/classes/students/:studentId — Remove student (Teacher protected)
export const removeStudent = async (req, res, next) => {
  try {
    const student = await Student.findOne({
      _id: req.params.studentId,
      ...teacherStudentFilter(req.teacher._id),
    });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const remainingTeacherIds = getStudentTeacherIds(student).filter(
      (id) => id.toString() !== req.teacher._id.toString()
    );
    if (remainingTeacherIds.length > 0) {
      const primaryTeacherId = student.teacher?._id || student.teacher;
      const nextPrimaryClass = getStudentClassForTeacher(student, remainingTeacherIds[0]);
      student.teachers = remainingTeacherIds;
      student.teacherClasses = (student.teacherClasses || []).filter((item) => {
        const itemTeacherId = item.teacher?._id || item.teacher;
        return itemTeacherId?.toString() !== req.teacher._id.toString();
      });
      if (primaryTeacherId?.toString() === req.teacher._id.toString()) {
        student.teacher = remainingTeacherIds[0];
        student.class = nextPrimaryClass?._id || nextPrimaryClass || null;
      }
      await student.save();
    } else {
      await Student.deleteOne({ _id: student._id });
    }
    res.json({ success: true, message: 'Student removed successfully' });
  } catch (err) {
    next(err);
  }
};

// GET /api/classes/quiz-access/:shareCode — Detailed access control for a quiz (Teacher protected)
export const getQuizAccessControl = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ shareCode: req.params.shareCode, teacher: req.teacher._id });
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    // Teacher's classes
    const classes = await Class.find({ teacher: req.teacher._id }).sort({ name: 1 });
    // Teacher's students
    const students = await Student.find(teacherStudentFilter(req.teacher._id))
      .select('name username class teacher teachers teacherClasses')
      .populate('class', 'name code')
      .populate('teacherClasses.teacher', 'name subject')
      .populate('teacherClasses.class', 'name code')
      .sort({ name: 1 });

    const assignedClassIds = (quiz.assignedClasses || []).map((id) => id.toString());
    const allowedStudentIds = (quiz.allowedStudents || []).map((id) => id.toString());
    const blockedStudentIds = (quiz.blockedStudents || []).map((id) => id.toString());

    // Map classes with status
    const classAccessList = classes.map((cls) => ({
      _id: cls._id,
      name: cls.name,
      code: cls.code,
      isOpen: assignedClassIds.includes(cls._id.toString()),
    }));

    // Map students with status
    const studentAccessList = students.map((std) => {
      const sId = std._id.toString();
      const isExplicitlyAllowed = allowedStudentIds.includes(sId);
      const isExplicitlyBlocked = blockedStudentIds.includes(sId);

      // Effective access calculation via priority hierarchy
      const accessEvaluation = evaluateStudentQuizAccess(quiz, std);

      return {
        _id: std._id,
        name: std.name,
        username: std.username,
        class: getStudentClassForTeacher(std, req.teacher._id),
        isExplicitlyAllowed,
        isExplicitlyBlocked,
        effectiveAccess: accessEvaluation.hasAccess,
        accessReason: accessEvaluation.reason,
      };
    });

    res.json({
      success: true,
      data: {
        shareCode: quiz.shareCode,
        title: quiz.title,
        isActive: quiz.isActive,
        accessMode: quiz.accessMode || 'public',
        classes: classAccessList,
        students: studentAccessList,
      },
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/classes/quiz-access/:shareCode — Update access mode, toggle class, or toggle student (Teacher protected)
export const updateQuizAccessControl = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ shareCode: req.params.shareCode, teacher: req.teacher._id });
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    const {
      accessMode,
      toggleClassId,
      openClass,
      toggleStudentId,
      studentAction, // 'open' | 'close' | 'reset'
      openAllClasses,
      closeAllClasses,
    } = req.body;

    if (accessMode && ['public', 'classes', 'restricted'].includes(accessMode)) {
      quiz.accessMode = accessMode;
    }

    // Toggle whole class open or closed
    if (toggleClassId) {
      if (!mongoose.Types.ObjectId.isValid(toggleClassId)) {
        return res.status(400).json({ success: false, message: 'Invalid class ID' });
      }
      const targetClass = await Class.findOne({ _id: toggleClassId, teacher: req.teacher._id }).select('_id');
      if (!targetClass) {
        return res.status(404).json({ success: false, message: 'Class not found' });
      }

      const clsIdStr = toggleClassId.toString();
      const currentAssigned = quiz.assignedClasses.map((id) => id.toString());
      const shouldOpen = typeof openClass === 'boolean' ? openClass : !currentAssigned.includes(clsIdStr);

      if (shouldOpen) {
        if (!currentAssigned.includes(clsIdStr)) {
          quiz.assignedClasses.push(toggleClassId);
        }
        // Hierarchy rule: Opening class clears individual blocks for all students in this class
        const classStudents = await Student.find(
          teacherClassStudentFilter(req.teacher._id, toggleClassId)
        ).select('_id');
        const classStudentIds = new Set(classStudents.map((s) => s._id.toString()));
        quiz.blockedStudents = (quiz.blockedStudents || []).filter((id) => !classStudentIds.has(id.toString()));
      } else {
        quiz.assignedClasses = quiz.assignedClasses.filter((id) => id.toString() !== clsIdStr);
        // Hierarchy rule: Closing class clears allowed overrides for all students in this class
        const classStudents = await Student.find(
          teacherClassStudentFilter(req.teacher._id, toggleClassId)
        ).select('_id');
        const classStudentIds = new Set(classStudents.map((s) => s._id.toString()));
        quiz.allowedStudents = (quiz.allowedStudents || []).filter((id) => !classStudentIds.has(id.toString()));
      }
    }

    // Bulk open or close all classes
    if (openAllClasses) {
      const allClasses = await Class.find({ teacher: req.teacher._id }).select('_id');
      quiz.assignedClasses = allClasses.map((c) => c._id);
      // Hierarchy rule: Opening all classes clears all student blocks in teacher's classes
      const allClassStudents = await Student.find({
        $or: [
          { teacher: req.teacher._id, class: { $in: quiz.assignedClasses } },
          { teacherClasses: { $elemMatch: { teacher: req.teacher._id, class: { $in: quiz.assignedClasses } } } },
        ],
      }).select('_id');
      const allStudentIds = new Set(allClassStudents.map((s) => s._id.toString()));
      quiz.blockedStudents = (quiz.blockedStudents || []).filter((id) => !allStudentIds.has(id.toString()));
    } else if (closeAllClasses) {
      quiz.assignedClasses = [];
      // Hierarchy rule: Closing all classes clears student allowed overrides
      const allClassStudents = await Student.find(teacherStudentFilter(req.teacher._id)).select('_id');
      const allStudentIds = new Set(allClassStudents.map((s) => s._id.toString()));
      quiz.allowedStudents = (quiz.allowedStudents || []).filter((id) => !allStudentIds.has(id.toString()));
    }

    // Toggle specific student open, close, or reset to default class rule
    if (toggleStudentId) {
      if (!mongoose.Types.ObjectId.isValid(toggleStudentId)) {
        return res.status(400).json({ success: false, message: 'Invalid student ID' });
      }
      const targetStudent = await Student.findOne({
        _id: toggleStudentId,
        ...teacherStudentFilter(req.teacher._id),
      }).select('_id');
      if (!targetStudent) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }

      const sIdStr = toggleStudentId.toString();

      // Clear from allowed & blocked first
      quiz.allowedStudents = (quiz.allowedStudents || []).filter((id) => id.toString() !== sIdStr);
      quiz.blockedStudents = (quiz.blockedStudents || []).filter((id) => id.toString() !== sIdStr);

      if (studentAction === 'open') {
        quiz.allowedStudents.push(toggleStudentId);
      } else if (studentAction === 'close') {
        quiz.blockedStudents.push(toggleStudentId);
      }
      // 'reset' leaves it cleared so it inherits class/quiz accessMode
    }

    await quiz.save();

    // Call getQuizAccessControl logic to return refreshed state
    return getQuizAccessControl(req, res, next);
  } catch (err) {
    next(err);
  }
};
