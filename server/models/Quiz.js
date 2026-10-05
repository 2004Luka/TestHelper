import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  type: { type: String, enum: ['mcq', 'truefalse', 'fillin'], default: 'mcq' },
  options: [String],
  correctAnswer: { type: String, required: true },
});

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    questions: [questionSchema],
    shareCode: { type: String, unique: true, required: true },
    isActive: { type: Boolean, default: true },
    settings: {
      timeLimit: { type: Number, default: 0 }, // 0 = no limit, value in minutes
      shuffleQuestions: { type: Boolean, default: false },
      showScoreImmediately: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export default mongoose.model('Quiz', quizSchema);
