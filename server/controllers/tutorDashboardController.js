import TutorWorkspace from '../models/TutorWorkspace.js';
import Student from '../models/Student.js';
import { getStudentClassForTeacher, teacherStudentFilter } from '../utils/quizAccess.js';

const badRequest = (res, message) => res.status(400).json({ success: false, message });
const hasCentPrecision = (amount) => Math.abs(amount * 100 - Math.round(amount * 100)) < 0.00001;

const normalizeWorkspace = async (body, teacherId, teacherSubject) => {
  if (!Array.isArray(body?.groups) || !Array.isArray(body?.students)) {
    return { error: 'Groups and students must be arrays.' };
  }
  const currency = ['GEL', 'USD', 'EUR', 'GBP'].includes(body.currency) ? body.currency : 'GEL';

  const groups = [];
  const groupIds = new Set();
  for (const group of body.groups) {
    const id = typeof group?.id === 'string' ? group.id.trim() : '';
    const name = typeof group?.name === 'string' ? group.name.trim() : '';
    if (!id || !name || name.length > 80 || groupIds.has(id)) {
      return { error: 'Each group needs a unique ID and a name of 1–80 characters.' };
    }
    groupIds.add(id);
    groups.push({ id, name });
  }

  const studentIds = body.students.map((student) => String(student?.studentId || student?.id || ''));
  if (studentIds.some((id) => !/^[a-f\d]{24}$/i.test(id)) || new Set(studentIds).size !== studentIds.length) {
    return { error: 'Choose existing students from your roster.' };
  }
  const availableStudents = await Student.find({ _id: { $in: studentIds }, ...teacherStudentFilter(teacherId) })
    .select('-password')
    .populate('class', 'name code')
    .populate('teacherClasses.class', 'name code')
    .lean();
  if (availableStudents.length !== studentIds.length) return { error: 'A student is not in your roster.' };
  const availableById = new Map(availableStudents.map((student) => [String(student._id), student]));

  const students = [];
  for (const entry of body.students) {
    const studentId = String(entry.studentId || entry.id);
    const source = availableById.get(studentId);
    const courseFee = entry.courseFee === null || entry.courseFee === '' ? null : Number(entry.courseFee);
    const installmentCount = entry.installmentCount === undefined || entry.installmentCount === null || entry.installmentCount === ''
      ? 1
      : Number(entry.installmentCount);
    const groupId = entry.groupId || null;
    if (courseFee !== null && (!Number.isFinite(courseFee) || courseFee < 0 || !hasCentPrecision(courseFee))) {
      return { error: 'Course fees must be valid amounts with no more than two decimal places.' };
    }
    if (!Number.isInteger(installmentCount) || installmentCount < 1 || installmentCount > 36) {
      return { error: 'Installment counts must be between 1 and 36.' };
    }
    if (groupId && !groupIds.has(groupId)) return { error: 'A student references a group that does not exist.' };
    if (!Array.isArray(entry.assessments) || !Array.isArray(entry.payments)) {
      return { error: 'Assessments and payments must be arrays.' };
    }

    const assessments = [];
    for (const assessment of entry.assessments) {
      const assessmentId = typeof assessment?.id === 'string' ? assessment.id.trim() : '';
      const label = typeof assessment?.label === 'string' ? assessment.label.trim() : '';
      const score = Number(assessment?.score);
      if (!assessmentId || !label || label.length > 80 || assessment.score === null || assessment.score === '' || !Number.isFinite(score) || score < 0 || score > 100) {
        return { error: 'Assessment labels are required and scores must be between 0 and 100.' };
      }
      assessments.push({ id: assessmentId, label, score });
    }

    const payments = [];
    let paidCents = 0;
    for (const payment of entry.payments) {
      const paymentId = typeof payment?.id === 'string' ? payment.id.trim() : '';
      const amount = Number(payment?.amount);
      const date = new Date(payment?.date);
      if (!paymentId || !Number.isFinite(amount) || amount <= 0 || !hasCentPrecision(amount) || Number.isNaN(date.getTime())) {
        return { error: 'Payments need a valid amount and date.' };
      }
      paidCents += Math.round(amount * 100);
      payments.push({ id: paymentId, amount, date });
    }
    if (courseFee === null && paidCents > 0) return { error: 'Set a course fee before recording payments.' };
    if (courseFee !== null && paidCents > Math.round(courseFee * 100)) return { error: 'Payments cannot exceed the course fee.' };

    students.push({
      id: studentId,
      studentId: source._id,
      name: source.name.slice(0, 120),
      course: (getStudentClassForTeacher(source, teacherId)?.name || teacherSubject || '').slice(0, 120),
      phone: source.username.slice(0, 40),
      parentContact: '',
      courseFee,
      installmentCount,
      groupId,
      assessments,
      payments,
    });
  }
  return { groups, students, currency };
};

const getWorkspaceData = (workspace, availableStudents, teacherSubject, teacherId) => {
  const recordsById = new Map((workspace?.students || []).filter((student) => student.studentId).map((student) => [String(student.studentId), student]));
  return {
    groups: workspace?.groups || [],
    currency: workspace?.currency || 'GEL',
    students: availableStudents.map((student) => {
      const record = recordsById.get(String(student._id));
      const studentClass = getStudentClassForTeacher(student, teacherId);
      return {
        id: String(student._id),
        studentId: String(student._id),
        name: student.name,
        username: student.username,
        course: studentClass?.name || teacherSubject || '',
        class: studentClass || null,
        courseFee: record?.courseFee ?? null,
        installmentCount: record?.installmentCount || 1,
        groupId: record?.groupId || null,
        assessments: record?.assessments || [],
        payments: (record?.payments || []).map(({ id, amount, date }) => ({ id, amount, date })),
      };
    }),
  };
};

export const getTutorWorkspace = async (req, res, next) => {
  try {
    const [workspace, availableStudents] = await Promise.all([
      TutorWorkspace.findOne({ teacher: req.teacher._id }).lean(),
      Student.find(teacherStudentFilter(req.teacher._id)).select('-password').populate('class', 'name code').populate('teacherClasses.class', 'name code').sort({ createdAt: -1 }).lean(),
    ]);
    res.json({
      success: true,
      data: getWorkspaceData(workspace, availableStudents, req.teacher.subject, req.teacher._id),
    });
  } catch (err) {
    next(err);
  }
};

export const saveTutorWorkspace = async (req, res, next) => {
  try {
    const normalized = await normalizeWorkspace(req.body, req.teacher._id, req.teacher.subject);
    if (normalized.error) return badRequest(res, normalized.error);

    const existing = await TutorWorkspace.findOne({ teacher: req.teacher._id }).select('students').lean();
    const legacyStudents = (existing?.students || []).filter((student) => !student.studentId);

    await TutorWorkspace.findOneAndUpdate(
      { teacher: req.teacher._id },
      { $set: { groups: normalized.groups, students: [...legacyStudents, ...normalized.students], currency: normalized.currency } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    const [workspace, availableStudents] = await Promise.all([
      TutorWorkspace.findOne({ teacher: req.teacher._id }).lean(),
      Student.find(teacherStudentFilter(req.teacher._id)).select('-password').populate('class', 'name code').populate('teacherClasses.class', 'name code').sort({ createdAt: -1 }).lean(),
    ]);
    res.json({ success: true, data: getWorkspaceData(workspace, availableStudents, req.teacher.subject, req.teacher._id) });
  } catch (err) {
    next(err);
  }
};
