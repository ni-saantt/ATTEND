export const API_BASE = process.env.EXPO_PUBLIC_API_URL || process.env.VITE_API_URL || 'http://localhost:8000';

export const ENDPOINTS = {
  LOGIN: '/api/v1/auth/login',
  ME: '/api/v1/auth/me',
  VERIFY_EMAIL: '/api/v1/auth/verify-email',
  RESEND_VERIFICATION: '/api/v1/auth/resend-verification',
  COLLEGES: '/api/v1/colleges',
  COLLEGE_UPLOAD_LOGO: '/api/v1/colleges/upload-logo',
  collegeById: (id: string) => `/api/v1/colleges/${id}`,
  USERS: '/api/v1/users',
  userById: (id: string) => `/api/v1/users/${id}`,
  DEPARTMENTS: '/api/v1/departments',
  departmentById: (id: string) => `/api/v1/departments/${id}`,
  SUBJECTS: '/api/v1/subjects',
  subjectById: (id: string) => `/api/v1/subjects/${id}`,
  
  // Sections
  subjectSections: (subjectId: string) => `/api/v1/subjects/${subjectId}/sections`,
  subjectEnrolledStudentIds: (subjectId: string) => `/api/v1/subjects/${subjectId}/enrolled-student-ids`,
  sectionById: (sectionId: string) => `/api/v1/sections/${sectionId}`,
  sectionTeachers: (sectionId: string) => `/api/v1/sections/${sectionId}/teachers`,
  sectionTeacher: (sectionId: string, teacherId: string) => `/api/v1/sections/${sectionId}/teachers/${teacherId}`,
  sectionStudents: (sectionId: string) => `/api/v1/sections/${sectionId}/students`,
  sectionStudent: (sectionId: string, studentId: string) => `/api/v1/sections/${sectionId}/students/${studentId}`,
  MY_SECTIONS: '/api/v1/my-sections',
  
  STUDENTS: '/api/v1/students',
  STUDENTS_GENERATE_EMBEDDINGS: '/api/v1/students/generate-embeddings',
  studentById: (id: string) => `/api/v1/students/${id}`,
  addStudentFace: (id: string) => `/api/v1/students/${id}/add-face`,
  ENROLL_STUDENT: '/api/v1/students/enroll',
  RECOGNIZE: '/api/v1/recognize',
  RECOGNIZE_TEST: '/api/v1/recognize/test',
  RECOGNIZE_STREAM_START: '/api/v1/recognize/stream/start',
  RECOGNIZE_STREAM: '/api/v1/recognize/stream',
  RECOGNIZE_STREAM_END: '/api/v1/recognize/stream/end',
  ATTENDANCE: '/api/v1/attendance',
  ATTENDANCE_REPORT: '/api/v1/attendance/report',
  ATTENDANCE_REPORT_SIMPLE_EXCEL: '/api/v1/attendance/report/simple-excel',
  ATTENDANCE_REPORT_SIMPLE_PDF: '/api/v1/attendance/report/simple-pdf',
  ATTENDANCE_SUBJECTS_WITH_REPORTS: '/api/v1/attendance/subjects-with-reports',
  attendanceList: (subjectId: string, sectionId?: string) => 
    `/api/v1/attendance/list?subject_id=${subjectId}${sectionId ? `&section_id=${sectionId}` : ''}`,
  attendanceById: (id: string) => `/api/v1/attendance/${id}`,
  attendanceDeleteReport: (subjectId: string) => `/api/v1/attendance/report/subject/${subjectId}`,
  ADMIN_STATS: '/api/v1/admin/stats',
} as const;

export function subjectStudentsUrl(subjectId: string) {
  return `/api/v1/subjects/${subjectId}/students`;
}
