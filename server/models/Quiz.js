import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionNumber: { type: Number },
  questionText: { type: String, required: true },
  type: { type: String, enum: ['mcq', 'truefalse', 'fillin'], default: 'mcq' },
  options: [String],
  correctAnswer: { type: String, default: '' },
});

const quizSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: false,
      index: true,
    },
    title: { type: String, required: true },
    questions: [questionSchema],
    shareCode: { type: String, unique: true, required: true },
    isActive: { type: Boolean, default: true },
    settings: {
      timeLimit: { type: Number, default: 0 }, // 0 = no limit, value in minutes
      showScoreImmediately: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export default mongoose.model('Quiz', quizSchema);
