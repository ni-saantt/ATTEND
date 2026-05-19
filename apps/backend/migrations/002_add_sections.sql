-- Migration: Add Sections Support
-- Run this in your Supabase SQL Editor

-- 1. Create sections table
CREATE TABLE IF NOT EXISTS sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subject_id, name)
);

-- 2. Create section_teachers join table
CREATE TABLE IF NOT EXISTS section_teachers (
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (section_id, teacher_id)
);

-- 3. Create section_students join table
CREATE TABLE IF NOT EXISTS section_students (
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  PRIMARY KEY (section_id, student_id)
);

-- 4. Add section_id to attendance table
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES sections(id);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sections_subject_id ON sections(subject_id);
CREATE INDEX IF NOT EXISTS idx_section_teachers_teacher_id ON section_teachers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_section_students_student_id ON section_students(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_section_id ON attendance(section_id);

-- 6. Enable Row Level Security (RLS) on new tables
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_students ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for sections
CREATE POLICY "Users can view sections in their department" ON sections
  FOR SELECT USING (
    subject_id IN (
      SELECT s.id FROM subjects s
      JOIN departments d ON s.department_id = d.id
      JOIN users u ON (u.department_id = d.id OR u.college_id = d.college_id)
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "Department admins can manage sections" ON sections
  FOR ALL USING (
    subject_id IN (
      SELECT s.id FROM subjects s
      WHERE s.department_id IN (
        SELECT department_id FROM users WHERE id = auth.uid() AND role IN ('DEPARTMENT_ADMIN', 'SUPER_ADMIN', 'PLATFORM_ADMIN')
      )
    )
  );

-- 8. Create RLS policies for section_teachers
CREATE POLICY "Users can view section_teachers" ON section_teachers
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage section_teachers" ON section_teachers
  FOR ALL USING (
    section_id IN (
      SELECT sec.id FROM sections sec
      JOIN subjects sub ON sec.subject_id = sub.id
      WHERE sub.department_id IN (
        SELECT department_id FROM users WHERE id = auth.uid() AND role IN ('DEPARTMENT_ADMIN', 'SUPER_ADMIN', 'PLATFORM_ADMIN')
      )
    )
  );

-- 9. Create RLS policies for section_students
CREATE POLICY "Users can view section_students" ON section_students
  FOR SELECT USING (true);

CREATE POLICY "Teachers and admins can manage section_students" ON section_students
  FOR ALL USING (
    section_id IN (
      SELECT st.section_id FROM section_teachers st WHERE st.teacher_id = auth.uid()
      UNION
      SELECT sec.id FROM sections sec
      JOIN subjects sub ON sec.subject_id = sub.id
      WHERE sub.department_id IN (
        SELECT department_id FROM users WHERE id = auth.uid() AND role IN ('DEPARTMENT_ADMIN', 'SUPER_ADMIN', 'PLATFORM_ADMIN')
      )
    )
  );
