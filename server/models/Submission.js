import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionIndex: Number,
  selectedAnswer: String,
  isCorrect: Boolean,
});

const submissionSchema = new mongoose.Schema(
  {
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    studentName: { type: String, required: true },
    answers: [answerSchema],
    score: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    attemptNumber: { type: Number, default: 1 },
  },
  { timestamps: true }
);

submissionSchema.index({ quizId: 1, studentName: 1 });

export default mongoose.model('Submission', submissionSchema);
