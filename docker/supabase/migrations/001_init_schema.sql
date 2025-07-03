-- Migration initiale pour Docker
-- Schéma extrait de Supabase

-- Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Schéma education
CREATE SCHEMA IF NOT EXISTS education;
CREATE TABLE education.attendance_records (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    attendance_id UUID,
    student_id UUID,
    is_present BOOLEAN NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE education.attendance_records ADD PRIMARY KEY (id);
CREATE TABLE education.attendances (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    presence_rate NUMERIC(5,2) DEFAULT 0,
    total_students INTEGER DEFAULT 0,
    last_update TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE,
    course_id UUID NOT NULL
);
ALTER TABLE education.attendances ADD PRIMARY KEY (id);
CREATE TABLE education.behavior_records (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    behavior_id UUID NOT NULL,
    student_id UUID NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE education.behavior_records ADD PRIMARY KEY (id);
CREATE TABLE education.behaviors (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    course_session_id UUID NOT NULL,
    date DATE NOT NULL,
    behavior_rate NUMERIC NOT NULL DEFAULT '0'::numeric,
    total_students INTEGER DEFAULT 0,
    last_update TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE education.behaviors ADD PRIMARY KEY (id);
CREATE TABLE education.courses (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    mongo_id TEXT,
    academic_year INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    deleted_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE education.courses ADD PRIMARY KEY (id);
CREATE UNIQUE INDEX courses_pkey1 ON education.courses USING btree (id);
CREATE UNIQUE INDEX courses_mongo_id_key ON education.courses USING btree (mongo_id);
CREATE TABLE education.courses_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    course_id UUID,
    mongo_id TEXT,
    course_session_mongo_id TEXT,
    subject TEXT NOT NULL,
    level TEXT NOT NULL,
    stats_average_attendance NUMERIC,
    stats_average_grade NUMERIC,
    stats_average_behavior NUMERIC,
    stats_last_updated TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE education.courses_sessions ADD PRIMARY KEY (id);
CREATE UNIQUE INDEX courses_sessions_pkey1 ON education.courses_sessions USING btree (id);
CREATE UNIQUE INDEX courses_sessions_mongo_id_key ON education.courses_sessions USING btree (mongo_id);
CREATE TABLE education.courses_sessions_students (
    id UUID NOT NULL,
    course_sessions_id UUID,
    mongo_student_id TEXT,
    student_id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE education.courses_sessions_students ADD PRIMARY KEY (id);
CREATE UNIQUE INDEX courses_sessions_students_pkey1 ON education.courses_sessions_students USING btree (id);
CREATE TABLE education.courses_sessions_timeslot (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    course_sessions_id UUID,
    day_of_week TEXT NOT NULL,
    start_time TIME WITHOUT TIME ZONE NOT NULL,
    end_time TIME WITHOUT TIME ZONE NOT NULL,
    classroom_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE education.courses_sessions_timeslot ADD PRIMARY KEY (id);
CREATE UNIQUE INDEX courses_sessions_timeslot_pkey1 ON education.courses_sessions_timeslot USING btree (id);
CREATE TABLE education.courses_teacher (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    course_id UUID,
    mongo_teacher_id TEXT,
    teacher_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE education.courses_teacher ADD PRIMARY KEY (id);
CREATE UNIQUE INDEX courses_teacher_mongo_teacher_id_key ON education.courses_teacher USING btree (mongo_teacher_id);
CREATE UNIQUE INDEX courses_teacher_pkey1 ON education.courses_teacher USING btree (id);
CREATE TABLE education.grades (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    mongo_id TEXT,
    course_session_id UUID,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    type TEXT NOT NULL,
    is_draft BOOLEAN DEFAULT false,
    stats_average_grade NUMERIC,
    stats_highest_grade NUMERIC,
    stats_lowest_grade NUMERIC,
    stats_absent_count INTEGER,
    stats_total_students INTEGER,
    last_update TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE education.grades ADD PRIMARY KEY (id);
CREATE UNIQUE INDEX grades_pkey1 ON education.grades USING btree (id);
CREATE TABLE education.grades_records (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    grade_id UUID NOT NULL,
    mongo_student_id TEXT,
    student_id UUID NOT NULL,
    value NUMERIC,
    is_absent BOOLEAN NOT NULL DEFAULT false,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE education.grades_records ADD PRIMARY KEY (id);
CREATE TABLE education.grades_teachers_migration (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    course_session_id UUID,
    mongo_teacher_id TEXT NOT NULL,
    teacher_id UUID,
    original_grade TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE education.grades_teachers_migration ADD PRIMARY KEY (id);
CREATE UNIQUE INDEX grades_teachers_migration_pkey1 ON education.grades_teachers_migration USING btree (id);
CREATE TABLE education.holidays (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    academic_year TEXT NOT NULL,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    type TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    deleted_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE education.holidays ADD PRIMARY KEY (id);
CREATE TABLE education.schedule_configs (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    academic_year TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    deleted_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE education.schedule_configs ADD PRIMARY KEY (id);
CREATE UNIQUE INDEX schedule_configs_academic_year_key ON education.schedule_configs USING btree (academic_year);
CREATE TABLE education.schedule_days (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL,
    day_of_week TEXT NOT NULL,
    start_time TIME WITHOUT TIME ZONE NOT NULL,
    end_time TIME WITHOUT TIME ZONE NOT NULL,
    type TEXT NOT NULL,
    order_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE education.schedule_days ADD PRIMARY KEY (id);
CREATE TABLE education.users (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    mongo_id TEXT,
    auth_id_email UUID,
    auth_id_gmail UUID,
    email TEXT,
    secondary_email TEXT,
    has_invalid_email BOOLEAN DEFAULT false,
    firstname TEXT NOT NULL,
    lastname TEXT NOT NULL,
    role TEXT,
    phone TEXT,
    date_of_birth DATE,
    gender TEXT,
    type TEXT,
    subjects TEXT[],
    school_year TEXT,
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE,
    stats_model TEXT,
    student_stats_id UUID,
    teacher_stats_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    parent2_auth_id_email UUID DEFAULT gen_random_uuid(),
    parent2_auth_id_gmail UUID DEFAULT gen_random_uuid()
);
ALTER TABLE education.users ADD PRIMARY KEY (id);
CREATE UNIQUE INDEX users_mongo_id_key ON education.users USING btree (mongo_id);

-- Schéma logs
CREATE SCHEMA IF NOT EXISTS logs;
CREATE TABLE logs.connection_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID,
    firstname TEXT,
    lastname TEXT,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    is_successful BOOLEAN NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    user_agent TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE logs.connection_logs ADD PRIMARY KEY (id);

-- Schéma stats
CREATE SCHEMA IF NOT EXISTS stats;
CREATE TABLE stats.global_stats (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    total_students INTEGER DEFAULT 0,
    total_teachers INTEGER DEFAULT 0,
    average_attendance_rate NUMERIC DEFAULT 0,
    presence_rate NUMERIC DEFAULT 0,
    last_update TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE stats.global_stats ADD PRIMARY KEY (id);
CREATE TABLE stats.student_stats (
    absences_rate NUMERIC(5,2),
    absences_count BIGINT,
    behavior_average NUMERIC(3,2),
    last_activity TIMESTAMP WITH TIME ZONE,
    last_update TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE stats.student_stats ADD PRIMARY KEY (id);
CREATE TABLE stats.student_stats_absences (
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    reason TEXT DEFAULT ''::text,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    student_stats_id UUID NOT NULL,
    course_session_id UUID NOT NULL,
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE stats.student_stats_absences ADD PRIMARY KEY (id);
CREATE TABLE stats.student_stats_absences_backup_20250215 (
    date TIMESTAMP WITH TIME ZONE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    id UUID,
    student_stats_id UUID,
    course_session_id UUID,
    is_active BOOLEAN,
    deleted_at TIMESTAMP WITH TIME ZONE
);
CREATE TABLE stats.student_stats_grades (
    student_stats_id UUID NOT NULL,
    subject TEXT NOT NULL,
    average NUMERIC(4,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE stats.student_stats_grades ADD PRIMARY KEY (id);
CREATE UNIQUE INDEX student_stats_grades_subject_unique ON stats.student_stats_grades USING btree (student_stats_id, subject);
CREATE TABLE stats.teacher_gender_distribution (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    teacher_stats_id UUID NOT NULL,
    count_masculin INTEGER DEFAULT 0,
    count_feminin INTEGER DEFAULT 0,
    count_undefined INTEGER DEFAULT 0,
    percentage_masculin TEXT DEFAULT '0'::text,
    percentage_feminin TEXT DEFAULT '0'::text,
    percentage_undefined TEXT DEFAULT '0'::text,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE stats.teacher_gender_distribution ADD PRIMARY KEY (id);
CREATE INDEX teacher_gender_distribution_teacher_stats_id_idx ON stats.teacher_gender_distribution USING btree (teacher_stats_id);
CREATE TABLE stats.teacher_stats (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    is_active BOOLEAN DEFAULT true,
    user_id UUID NOT NULL,
    total_students INTEGER DEFAULT 0,
    min_age INTEGER DEFAULT 0,
    max_age INTEGER DEFAULT 0,
    average_age NUMERIC DEFAULT 0,
    last_update TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    deleted_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE stats.teacher_stats ADD PRIMARY KEY (id);
CREATE INDEX teacher_stats_last_update_idx ON stats.teacher_stats USING btree (last_update DESC);
CREATE UNIQUE INDEX teacher_stats_user_id_idx ON stats.teacher_stats USING btree (user_id);

-- Schéma config
CREATE SCHEMA IF NOT EXISTS config;
CREATE TABLE config.app_config (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    academic_year_start DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE config.app_config ADD PRIMARY KEY (id);
CREATE UNIQUE INDEX app_config_academic_year_start_key ON config.app_config USING btree (academic_year_start);
CREATE TABLE config.themes (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL,
    user_type TEXT NOT NULL,
    button_variants TEXT,
    card_header TEXT,
    loader TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE config.themes ADD PRIMARY KEY (id);
CREATE UNIQUE INDEX themes_config_user_type_key ON config.themes USING btree (config_id, user_type);

-- Schéma public
CREATE SCHEMA IF NOT EXISTS public;
ALTER TABLE education.attendance_records ADD CONSTRAINT attendance_records_attendance_id_fkey FOREIGN KEY (attendance_id) REFERENCES education.attendances(id);
ALTER TABLE education.attendance_records ADD CONSTRAINT attendance_records_student_id_fkey FOREIGN KEY (student_id) REFERENCES education.users(id);
ALTER TABLE education.attendances ADD CONSTRAINT attendances_course_id_fkey FOREIGN KEY (course_id) REFERENCES education.courses(id);
ALTER TABLE education.behavior_records ADD CONSTRAINT behavior_records_behavior_id_fkey FOREIGN KEY (behavior_id) REFERENCES education.behaviors(id);
ALTER TABLE education.behavior_records ADD CONSTRAINT behavior_records_student_id_fkey FOREIGN KEY (student_id) REFERENCES education.users(id);
ALTER TABLE education.behaviors ADD CONSTRAINT behaviors_course_session_id_fkey FOREIGN KEY (course_session_id) REFERENCES education.courses_sessions(id);
ALTER TABLE education.courses_sessions ADD CONSTRAINT courses_sessions_course_id_fkey1 FOREIGN KEY (course_id) REFERENCES education.courses(id);
ALTER TABLE education.courses_sessions_students ADD CONSTRAINT courses_sessions_students_course_sessions_id_fkey1 FOREIGN KEY (course_sessions_id) REFERENCES education.courses_sessions(id);
ALTER TABLE education.courses_sessions_timeslot ADD CONSTRAINT courses_sessions_timeslot_course_sessions_id_fkey1 FOREIGN KEY (course_sessions_id) REFERENCES education.courses_sessions(id);
ALTER TABLE education.courses_teacher ADD CONSTRAINT courses_teacher_course_id_fkey1 FOREIGN KEY (course_id) REFERENCES education.courses(id);
ALTER TABLE education.courses_teacher ADD CONSTRAINT courses_teacher_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES education.users(id);
ALTER TABLE education.grades ADD CONSTRAINT grades_course_session_id_fkey1 FOREIGN KEY (course_session_id) REFERENCES education.courses_sessions(id);
ALTER TABLE education.grades_records ADD CONSTRAINT grades_records_grade_id_fkey FOREIGN KEY (grade_id) REFERENCES education.grades(id);
ALTER TABLE education.grades_records ADD CONSTRAINT grades_records_student_id_fkey FOREIGN KEY (student_id) REFERENCES education.users(id);
ALTER TABLE education.grades_teachers_migration ADD CONSTRAINT grades_teachers_migration_course_session_id_fkey1 FOREIGN KEY (course_session_id) REFERENCES education.courses_sessions(id);
ALTER TABLE education.grades_teachers_migration ADD CONSTRAINT grades_teachers_migration_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES education.users(id);
ALTER TABLE education.schedule_days ADD CONSTRAINT schedule_days_config_id_fkey FOREIGN KEY (config_id) REFERENCES education.schedule_configs(id);
ALTER TABLE stats.student_stats_absences ADD CONSTRAINT student_stats_absences_student_stats_id_fkey FOREIGN KEY (student_stats_id) REFERENCES stats.student_stats(id);
ALTER TABLE stats.student_stats_grades ADD CONSTRAINT student_stats_grades_student_stats_id_fkey FOREIGN KEY (student_stats_id) REFERENCES stats.student_stats(id);
ALTER TABLE stats.teacher_gender_distribution ADD CONSTRAINT teacher_gender_distribution_teacher_stats_id_fkey FOREIGN KEY (teacher_stats_id) REFERENCES stats.teacher_stats(id);
ALTER TABLE config.themes ADD CONSTRAINT themes_config_id_fkey FOREIGN KEY (config_id) REFERENCES config.app_config(id);

-- Politiques RLS temporairement supprimées - à réactiver après installation de GoTrue
-- CREATE POLICY "Admins_can_access_all_course_sessions" ON education.courses_sessions FOR ALL USING ((EXISTS ( SELECT 1
--    FROM education.users u
--   WHERE ((u.id = auth.uid()) AND (u.role = 'admin'::text)))));
-- CREATE POLICY "Teachers_can_access_their_course_sessions" ON education.courses_sessions FOR ALL USING ((EXISTS ( SELECT 1
--    FROM education.courses_teacher ct
--   WHERE ((ct.course_id = courses_sessions.course_id) AND (ct.teacher_id = auth.uid())))));
