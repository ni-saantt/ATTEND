-- 001_initial_schema.sql
-- Run this in your Supabase SQL Editor

-- 1. Enable pgvector extension (required for Face Recognition embeddings)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create colleges table
CREATE TABLE IF NOT EXISTS colleges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create departments table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create users table with role enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('PLATFORM_ADMIN', 'SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'TEACHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    name VARCHAR(255),
    contact_number VARCHAR(50),
    college_id UUID REFERENCES colleges(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create students table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reg_no VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    primary_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (college_id, reg_no)
);

-- 7. Create face_embeddings table
CREATE TABLE IF NOT EXISTS face_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    embedding vector(512) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    confidence FLOAT NOT NULL,
    face_crop_url TEXT,
    -- Prevent duplicate attendance for same student/subject on same day
    UNIQUE (student_id, subject_id, attendance_date)
);

-- 9. Create subject_teachers join table
CREATE TABLE IF NOT EXISTS subject_teachers (
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (subject_id, teacher_id)
);

-- 10. Create subject_students join table
CREATE TABLE IF NOT EXISTS subject_students (
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    PRIMARY KEY (subject_id, student_id)
);

-- 11. Setup Storage Buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('primary-faces', 'primary-faces', true),
  ('attendance-crops', 'attendance-crops', true),
  ('college-logos', 'college-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Grant public read access to storage objects in these buckets
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id IN ('primary-faces', 'attendance-crops', 'college-logos'));
