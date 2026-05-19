/**
 * Types are re-exported from schemas for Zod-inferred types.
 * Legacy interfaces kept for backward compatibility - prefer schemas.
 */
export type { User, College, Department, Subject, Section, Student, LoginResponse, AttendanceRecord } from './schemas';
export type { Role } from './roles';

export interface Attendance {
  id: string;
  student_id: string;
  subject_id: string;
  section_id: string | null;
  timestamp: string;
  confidence: number;
  face_crop_url: string | null;
}

export interface SectionWithSubject {
  id: string;
  subject_id: string;
  name: string;
  subject_name?: string;
  created_at: string;
}

export interface SubjectWithSections {
  subject_id: string;
  subject_name: string;
  sections: Array<{
    id: string;
    name: string;
    created_at?: string;
  }>;
}

export interface RecognitionResult {
  student_id: string;
  student_name: string;
  reg_no: string;
  confidence: number;
  reference_image_url: string;
  face_crop_base64?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
