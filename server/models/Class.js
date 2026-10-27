import mongoose from 'mongoose';

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Class name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Class code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Class', classSchema);
