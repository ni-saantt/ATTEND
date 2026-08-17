import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import { ENDPOINTS } from '@attend/shared';

export function useColleges(enabled = true) {
  return useQuery({
    queryKey: ['colleges'],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.COLLEGES);
      return data ?? [];
    },
    enabled,
  });
}

export function useDepartments(collegeId: string | null) {
  return useQuery({
    queryKey: ['departments', collegeId],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/departments?college_id=${collegeId}`);
      return data ?? [];
    },
    enabled: !!collegeId,
  });
}

export function useSubjects(departmentId: string | null, isTeacher: boolean) {
  return useQuery({
    queryKey: ['subjects', departmentId, isTeacher],
    queryFn: async () => {
      const url = isTeacher ? '/api/v1/subjects' : `/api/v1/subjects?department_id=${departmentId}`;
      const { data } = await api.get(url);
      return data ?? [];
    },
    enabled: isTeacher || !!departmentId,
  });
}

export function useAttendanceList(subjectId: string | null) {
  return useQuery({
    queryKey: ['attendance-list', subjectId],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/attendance/list?subject_id=${subjectId}`);
      return data ?? [];
    },
    enabled: !!subjectId,
  });
}

export function useSubjectsWithReports(departmentId: string | null) {
  return useQuery({
    queryKey: ['subjects-with-reports', departmentId],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/attendance/subjects-with-reports?department_id=${departmentId}`);
      return data ?? [];
    },
    enabled: !!departmentId,
  });
}

export function useStudents(collegeId: string | null, departmentId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['students', collegeId, departmentId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (collegeId) params.set('college_id', collegeId);
      if (departmentId) params.set('department_id', departmentId);
      const { data } = await api.get(`/api/v1/students?${params.toString()}`);
      return data ?? [];
    },
    enabled,
  });
}

export function useUsers(collegeId: string | null, departmentId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['users', collegeId, departmentId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (collegeId) params.set('college_id', collegeId);
      if (departmentId) params.set('department_id', departmentId);
      const { data } = await api.get(`${ENDPOINTS.USERS}?${params.toString()}`);
      return data ?? [];
    },
    enabled,
  });
}

// Section queries
export function useSections(subjectId: string | null) {
  return useQuery({
    queryKey: ['sections', subjectId],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.subjectSections(subjectId!));
      return data ?? [];
    },
    enabled: !!subjectId,
  });
}

export function useMySections() {
  return useQuery({
    queryKey: ['my-sections'],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.MY_SECTIONS);
      return data ?? [];
    },
  });
}

export function useSectionStudents(sectionId: string | null) {
  return useQuery({
    queryKey: ['section-students', sectionId],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.sectionStudents(sectionId!));
      return data ?? [];
    },
    enabled: !!sectionId,
  });
}

export function useSubjectEnrolledStudentIds(subjectId: string | null) {
  return useQuery({
    queryKey: ['subject-enrolled-student-ids', subjectId],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.subjectEnrolledStudentIds(subjectId!));
      return (data?.student_ids ?? []) as string[];
    },
    enabled: !!subjectId,
  });
}

export function useSectionTeachers(sectionId: string | null) {
  return useQuery({
    queryKey: ['section-teachers', sectionId],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.sectionTeachers(sectionId!));
      return data ?? [];
    },
    enabled: !!sectionId,
  });
}

export function useTeachers(departmentId: string | null) {
  return useQuery({
    queryKey: ['teachers', departmentId],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/users?department_id=${departmentId}&role=TEACHER`);
      return data ?? [];
    },
    enabled: !!departmentId,
  });
}

// Section mutations
export function useCreateSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ subjectId, name }: { subjectId: string; name: string }) => {
      const { data } = await api.post(ENDPOINTS.subjectSections(subjectId), { name });
      return data;
    },
    onSuccess: (_, { subjectId }) => {
      queryClient.invalidateQueries({ queryKey: ['sections', subjectId] });
    },
  });
}

export function useDeleteSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sectionId: string) => {
      await api.delete(ENDPOINTS.sectionById(sectionId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      queryClient.invalidateQueries({ queryKey: ['my-sections'] });
    },
  });
}

export function useAssignTeachersToSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sectionId, teacherIds }: { sectionId: string; teacherIds: string[] }) => {
      const { data } = await api.post(ENDPOINTS.sectionTeachers(sectionId), { teacher_ids: teacherIds });
      return data;
    },
    onSuccess: (_, { sectionId }) => {
      queryClient.invalidateQueries({ queryKey: ['section-teachers', sectionId] });
      queryClient.invalidateQueries({ queryKey: ['my-sections'] });
    },
  });
}

export function useRemoveTeacherFromSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sectionId, teacherId }: { sectionId: string; teacherId: string }) => {
      await api.delete(ENDPOINTS.sectionTeacher(sectionId, teacherId));
    },
    onSuccess: (_, { sectionId }) => {
      queryClient.invalidateQueries({ queryKey: ['section-teachers', sectionId] });
      queryClient.invalidateQueries({ queryKey: ['my-sections'] });
    },
  });
}

export function useAssignStudentsToSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sectionId, studentIds }: { sectionId: string; studentIds: string[] }) => {
      const { data } = await api.post(ENDPOINTS.sectionStudents(sectionId), { student_ids: studentIds });
      return data;
    },
    onSuccess: (_, { sectionId }) => {
      queryClient.invalidateQueries({ queryKey: ['section-students', sectionId] });
      queryClient.invalidateQueries({ queryKey: ['subject-enrolled-student-ids'] });
    },
  });
}

export function useRemoveStudentFromSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sectionId, studentId }: { sectionId: string; studentId: string }) => {
      await api.delete(ENDPOINTS.sectionStudent(sectionId, studentId));
    },
    onSuccess: (_, { sectionId }) => {
      queryClient.invalidateQueries({ queryKey: ['section-students', sectionId] });
      queryClient.invalidateQueries({ queryKey: ['subject-enrolled-student-ids'] });
    },
  });
}
