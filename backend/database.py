import psycopg2
import psycopg2.extras
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


def get_conn():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False
    return conn


def init_db():
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        CREATE EXTENSION IF NOT EXISTS "pgcrypto";

        CREATE TABLE IF NOT EXISTS schools (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            district TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('admin', 'teacher')),
            school_id UUID REFERENCES schools(id),
            created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS observations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            teacher_id UUID NOT NULL REFERENCES users(id),
            observer_id UUID NOT NULL REFERENCES users(id),
            observed_at DATE NOT NULL,
            scores JSONB NOT NULL,
            raw_notes TEXT,
            ai_summary TEXT,
            flagged BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS performance_reviews (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            teacher_id UUID NOT NULL REFERENCES users(id),
            reviewer_id UUID NOT NULL REFERENCES users(id),
            period TEXT NOT NULL,
            category_scores JSONB NOT NULL,
            final_notes TEXT,
            status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'acknowledged')),
            ai_summary TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS staff_notes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            teacher_id UUID NOT NULL REFERENCES users(id),
            author_id UUID NOT NULL REFERENCES users(id),
            content TEXT NOT NULL,
            tag TEXT NOT NULL CHECK (tag IN ('positive', 'concern', 'neutral')),
            created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS goals (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            teacher_id UUID NOT NULL REFERENCES users(id),
            set_by UUID NOT NULL REFERENCES users(id),
            title TEXT NOT NULL,
            description TEXT,
            target_date DATE,
            status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'achieved')),
            created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS goal_updates (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            goal_id UUID NOT NULL REFERENCES goals(id),
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        );
    """)

    conn.commit()
    cur.close()
    conn.close()
    print("DB initialized.")


def seed_db():
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # Check if already seeded
    cur.execute("SELECT COUNT(*) as count FROM users")
    if cur.fetchone()["count"] > 0:
        print("Already seeded.")
        cur.close()
        conn.close()
        return

    cur.execute("""
        INSERT INTO schools (id, name, district)
        VALUES ('00000000-0000-0000-0000-000000000001', 'Lincoln Elementary', 'Houston ISD')
    """)

    cur.execute("""
        INSERT INTO users (id, name, email, role, school_id) VALUES
        ('00000000-0000-0000-0000-000000000010', 'Sarah Mitchell', 'admin@lincoln.edu', 'admin', '00000000-0000-0000-0000-000000000001'),
        ('00000000-0000-0000-0000-000000000011', 'James Carter', 'jcarter@lincoln.edu', 'teacher', '00000000-0000-0000-0000-000000000001'),
        ('00000000-0000-0000-0000-000000000012', 'Maria Lopez', 'mlopez@lincoln.edu', 'teacher', '00000000-0000-0000-0000-000000000001'),
        ('00000000-0000-0000-0000-000000000013', 'David Kim', 'dkim@lincoln.edu', 'teacher', '00000000-0000-0000-0000-000000000001'),
        ('00000000-0000-0000-0000-000000000014', 'Priya Nair', 'pnair@lincoln.edu', 'teacher', '00000000-0000-0000-0000-000000000001')
    """)

    cur.execute("""
        INSERT INTO observations (teacher_id, observer_id, observed_at, scores, raw_notes, ai_summary, flagged) VALUES
        ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000010', '2026-04-10',
         '{"instruction": 4, "management": 3, "engagement": 4}',
         'James had a strong lesson structure. Students were mostly engaged but a few off-task moments during group work.',
         'Mr. Carter demonstrated solid instructional delivery with clear objectives. Classroom management showed minor gaps during transitions. Student engagement was generally high.',
         false),
        ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000010', '2026-04-15',
         '{"instruction": 5, "management": 5, "engagement": 5}',
         'Excellent class. Maria had every student participating. Smooth transitions, clear expectations.',
         'Ms. Lopez delivered an exemplary lesson with full student participation and seamless classroom management. A model observation across all categories.',
         false),
        ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000010', '2026-04-20',
         '{"instruction": 2, "management": 2, "engagement": 2}',
         'Lesson objectives were unclear. Several students disengaged early. David struggled with transitions.',
         'Mr. Kim''s lesson lacked clear objectives and structure, leading to early student disengagement. Classroom management and instructional delivery both require targeted improvement.',
         true),
        ('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000010', '2026-04-22',
         '{"instruction": 4, "management": 4, "engagement": 3}',
         'Priya had a well-planned lesson. Some students were quieter than expected but content delivery was strong.',
         'Ms. Nair demonstrated strong instructional planning and classroom management. Student engagement was adequate but could benefit from more interactive strategies.',
         false)
    """)

    cur.execute("""
        INSERT INTO performance_reviews (teacher_id, reviewer_id, period, category_scores, final_notes, status, ai_summary) VALUES
        ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000010', 'Q1 2026',
         '{"professionalism": 4, "collaboration": 4, "instruction": 4, "growth": 3}',
         'James is a reliable and professional teacher. Encourages peer collaboration. Room to grow in reflective practice.',
         'submitted',
         'Mr. Carter is a dependable educator who demonstrates consistent professionalism and supports collaborative school culture. Continued focus on reflective practice and instructional risk-taking is recommended for ongoing growth.'),
        ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000010', 'Q1 2026',
         '{"professionalism": 3, "collaboration": 3, "instruction": 2, "growth": 2}',
         'David needs significant support in instructional planning and classroom management. Has shown willingness to improve.',
         'submitted',
         'Mr. Kim requires structured support in core instructional competencies. While he has demonstrated openness to feedback, targeted intervention in lesson planning and classroom management is essential this quarter.')
    """)

    cur.execute("""
        INSERT INTO staff_notes (teacher_id, author_id, content, tag) VALUES
        ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000010',
         'James volunteered to mentor a new teacher this semester. Great initiative.', 'positive'),
        ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000010',
         'Parent complaint received regarding unclear homework instructions. Discussed with David directly.', 'concern'),
        ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000010',
         'Maria was recognized at the district level for her literacy program outcomes.', 'positive'),
        ('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000010',
         'Priya requested additional PD resources on student engagement strategies.', 'neutral')
    """)

    cur.execute("""
        INSERT INTO goals (id, teacher_id, set_by, title, description, target_date, status) VALUES
        ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000010',
         'Improve Classroom Management Score',
         'Raise classroom management observation score from 2 to 4 by end of Q2 through structured routines and consistent expectations.',
         '2026-06-30', 'in_progress'),
        ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000010',
         'Develop Clear Lesson Objectives',
         'Every lesson plan must include a written objective shared with students at the start of class.',
         '2026-05-31', 'not_started'),
        ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000010',
         'Increase Student Engagement',
         'Incorporate at least two interactive activities per lesson to raise engagement scores.',
         '2026-06-15', 'in_progress')
    """)

    cur.execute("""
        INSERT INTO goal_updates (goal_id, content) VALUES
        ('00000000-0000-0000-0000-000000000020',
         'Implemented a class routine chart on the board. First week went better — fewer transition issues.'),
        ('00000000-0000-0000-0000-000000000020',
         'Had a follow-up check-in. David is using a timer for transitions. Students responding well.'),
        ('00000000-0000-0000-0000-000000000022',
         'Priya tried a think-pair-share activity. Reported higher energy in the room.')
    """)

    conn.commit()
    cur.close()
    conn.close()
    print("Seeded successfully.")