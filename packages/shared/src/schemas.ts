import { z } from 'zod';

const roleEnum = z.enum([
  'PLATFORM_ADMIN',
  'SUPER_ADMIN',
  'DEPARTMENT_ADMIN',
  'TEACHER',
]);

// Auth
export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: roleEnum,
  name: z.string().nullable().optional(),
  contact_number: z.string().nullable().optional(),
  college_id: z.string().nullable(),
  college_name: z.string().nullable().optional(),
  college_logo_url: z.string().nullable().optional(),
  department_id: z.string().nullable(),
  created_at: z.coerce.string().default(''),
});

export const loginResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  user: userSchema,
});

// College
export const createCollegeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  logo_url: z.union([z.string().url(), z.literal('')]).optional(),
});

export const collegeSchema = z.object({
  id: z.string(),
  name: z.string(),
  created_at: z.string(),
});

// Department
export const createDepartmentSchema = z.object({
  college_id: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
});

export const departmentSchema = z.object({
  id: z.string(),
  college_id: z.string(),
  name: z.string(),
  created_at: z.string(),
});

// Subject
export const createSubjectSchema = z.object({
  department_id: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  teacher_ids: z.array(z.string().uuid()).optional(),
});

export const subjectSchema = z.object({
  id: z.string(),
  department_id: z.string(),
  name: z.string(),
  created_at: z.string(),
});

// Section
export const createSectionSchema = z.object({
  name: z.string().min(1, 'Section name is required').max(50, 'Section name too long'),
});

export const sectionSchema = z.object({
  id: z.string(),
  subject_id: z.string(),
  name: z.string(),
  created_at: z.string(),
});

export const assignTeachersSchema = z.object({
  teacher_ids: z.array(z.string().uuid()),
});

export const assignStudentsSchema = z.object({
  student_ids: z.array(z.string().uuid()),
});

// Student
export const createStudentSchema = z.object({
  reg_no: z.string().min(1, 'Registration number is required'),
  name: z.string().min(1, 'Name is required'),
  college_id: z.string().min(1, 'College is required'),
  department_id: z.string().min(1, 'Department is required'),
});

export const studentSchema = z.object({
  id: z.string(),
  reg_no: z.string(),
  name: z.string(),
  college_id: z.string(),
  department_id: z.string(),
  primary_image_url: z.string().nullable(),
  created_at: z.string(),
});

// User creation
export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: roleEnum,
  name: z.string().optional(),
  contact_number: z.string().optional(),
  college_id: z.string().uuid().nullable().optional(),
  department_id: z.string().uuid().nullable().optional(),
});

// Attendance
export const attendanceRecordSchema = z.object({
  student_id: z.string(),
  subject_id: z.string(),
  section_id: z.string().optional().nullable(),
  confidence: z.number(),
  face_crop_base64: z.string().optional().nullable(),
});

export const confirmAttendanceSchema = z.object({
  records: z.array(attendanceRecordSchema),
});

// Inferred types
export type LoginInput = z.infer<typeof loginSchema>;
export type User = z.infer<typeof userSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type College = z.infer<typeof collegeSchema>;
export type Department = z.infer<typeof departmentSchema>;
export type Subject = z.infer<typeof subjectSchema>;
export type Section = z.infer<typeof sectionSchema>;
export type Student = z.infer<typeof studentSchema>;
export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>;
