import { z } from 'zod';
import mongoose from 'mongoose';

// Safe name pattern: allows Latin, Georgian, numbers, spaces, dots, hyphens, underscores, apostrophes
const safeTextPattern = /^[a-zA-Z0-9\s\u10A0-\u10FF\.\-_',()]+$/;
// Safe username pattern: Latin, Georgian, numbers, dots, hyphens, underscores (no spaces, no special symbols)
const safeUsernamePattern = /^[a-zA-Z0-9_\u10A0-\u10FF\.\-]+$/;

export const teacherRegisterSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name must not exceed 60 characters')
    .regex(safeTextPattern, 'Name contains disallowed characters or HTML tags'),
  subject: z
    .string({ required_error: 'Subject is required' })
    .trim()
    .min(2, 'Subject must be at least 2 characters')
    .max(60, 'Subject must not exceed 60 characters')
    .regex(safeTextPattern, 'Subject contains disallowed characters'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long')
    .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Password must be at most 72 UTF-8 bytes'),
});

export const teacherLoginSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(1, 'Name is required')
    .max(60, 'Name is too long'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required')
    .max(100, 'Password is too long'),
});

export const studentRegisterSchema = z.object({
  name: z
    .string({ required_error: 'Student full name is required' })
    .trim()
    .min(2, 'Student full name must be at least 2 characters')
    .max(80, 'Student full name must not exceed 80 characters')
    .regex(safeTextPattern, 'Student name contains disallowed characters or HTML tags'),
  username: z
    .string({ required_error: 'Username is required' })
    .trim()
    .toLowerCase()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must not exceed 30 characters')
    .regex(safeUsernamePattern, 'Username must only contain letters, numbers, hyphens, dots, or underscores'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long')
    .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Password must be at most 72 UTF-8 bytes'),
  teacherId: z
    .string({ required_error: 'Teacher is required' })
    .trim()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: 'Invalid teacher selection',
    }),
  classId: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine((val) => !val || mongoose.Types.ObjectId.isValid(val), {
      message: 'Invalid class ID',
    }),
  classCode: z
    .string()
    .trim()
    .max(12, 'Class code is too long')
    .regex(/^[a-zA-Z0-9_\-]*$/, 'Class code contains disallowed characters')
    .optional()
    .nullable(),
});

export const studentLoginSchema = z.object({
  username: z
    .string({ required_error: 'Username is required' })
    .trim()
    .min(1, 'Username is required')
    .max(30, 'Username is too long'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required')
    .max(100, 'Password is too long'),
});
