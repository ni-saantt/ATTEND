-- Migration: Enforce one section per student per subject
-- A student cannot be in two different sections of the same subject.
-- Run in Supabase SQL Editor after 001_add_sections.sql

CREATE OR REPLACE FUNCTION check_one_section_per_student_per_subject()
RETURNS TRIGGER AS $$
DECLARE
  new_subject_id UUID;
  existing_section_id UUID;
BEGIN
  SELECT subject_id INTO new_subject_id FROM sections WHERE id = NEW.section_id;
  IF new_subject_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if this student is already in another section of the same subject
  SELECT ss.section_id INTO existing_section_id
  FROM section_students ss
  JOIN sections s ON s.id = ss.section_id
  WHERE ss.student_id = NEW.student_id
    AND s.subject_id = new_subject_id
    AND ss.section_id != NEW.section_id
  LIMIT 1;

  IF existing_section_id IS NOT NULL THEN
    RAISE EXCEPTION 'Student is already in another section of this subject. A student can only be in one section per subject.'
      USING ERRCODE = 'unique_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_one_section_per_student_per_subject ON section_students;
CREATE TRIGGER trigger_one_section_per_student_per_subject
  BEFORE INSERT OR UPDATE ON section_students
  FOR EACH ROW
  EXECUTE FUNCTION check_one_section_per_student_per_subject();
