import mongoose from 'mongoose';

const assessmentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true, trim: true, maxlength: 80 },
    score: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    amount: { type: Number, required: true, min: 0.01 },
    date: { type: Date, required: true },
  },
  { _id: false }
);

const groupSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    course: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 40 },
    parentContact: { type: String, trim: true, maxlength: 120, default: '' },
    courseFee: { type: Number, min: 0, default: null },
    installmentCount: { type: Number, required: true, min: 1, max: 36, default: 1 },
    groupId: { type: String, default: null },
    assessments: { type: [assessmentSchema], default: [] },
    payments: { type: [paymentSchema], default: [] },
  },
  { _id: false }
);

const tutorWorkspaceSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
      unique: true,
      index: true,
    },
    currency: { type: String, enum: ['GEL', 'USD', 'EUR', 'GBP'], default: 'GEL' },
    groups: { type: [groupSchema], default: [] },
    students: { type: [studentSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model('TutorWorkspace', tutorWorkspaceSchema);
