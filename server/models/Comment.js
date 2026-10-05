import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    submissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission' },
    author: { type: String, required: true },
    role: { type: String, enum: ['teacher', 'student'], required: true },
    message: { type: String, required: true },
    questionIndex: { type: Number, default: -1 }, // -1 = general comment
  },
  { timestamps: true }
);

commentSchema.index({ quizId: 1 });

export default mongoose.model('Comment', commentSchema);
