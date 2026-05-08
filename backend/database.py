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
            observation_type TEXT NOT NULL DEFAULT 'formal' CHECK (observation_type IN ('formal', 'informal', 'walkthrough')),
            framework TEXT DEFAULT 'general',
            course_name TEXT,
            room TEXT,
            scores JSONB NOT NULL,
            section_notes JSONB DEFAULT '{}',
            raw_notes TEXT,
            ai_summary TEXT,
            flagged BOOLEAN DEFAULT FALSE,
            status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'acknowledged')),
            created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS performance_reviews (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            teacher_id UUID NOT NULL REFERENCES users(id),
            reviewer_id UUID NOT NULL REFERENCES users(id),
            period TEXT NOT NULL,
            category_scores JSONB NOT NULL,
            final_notes TEXT,
            teacher_response TEXT,
            status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'pending_signoff', 'complete')),
            ai_summary TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS staff_notes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            teacher_id UUID NOT NULL REFERENCES users(id),
            author_id UUID NOT NULL REFERENCES users(id),
            content TEXT NOT NULL,
            tag TEXT NOT NULL CHECK (tag IN ('commendation', 'concern', 'coaching', 'pd', 'general')),
            pinned BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS goals (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            teacher_id UUID NOT NULL REFERENCES users(id),
            set_by UUID NOT NULL REFERENCES users(id),
            title TEXT NOT NULL,
            description TEXT,
            linked_dimension TEXT,
            evidence_type TEXT,
            target_date DATE,
            status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'at_risk', 'achieved', 'not_met')),
            created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS goal_milestones (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            goal_id UUID NOT NULL REFERENCES goals(id),
            description TEXT NOT NULL,
            due_date DATE,
            completed BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS goal_updates (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            goal_id UUID NOT NULL REFERENCES goals(id),
            author_id UUID REFERENCES users(id),
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

    cur.execute("SELECT COUNT(*) as count FROM users")
    if cur.fetchone()["count"] > 0:
        print("Already seeded.")
        cur.close()
        conn.close()
        return

    # ── School ────────────────────────────────────────────────────────────────
    cur.execute("""
        INSERT INTO schools (id, name, district)
        VALUES ('00000000-0000-0000-0000-000000000001', 'Westridge Academy', 'Houston ISD')
    """)

    # ── Users ─────────────────────────────────────────────────────────────────
    cur.execute("""
        INSERT INTO users (id, name, email, role, school_id) VALUES
        ('00000000-0000-0000-0000-000000000010', 'Dr. Sarah Mitchell', 'admin@westridge.edu',  'admin',   '00000000-0000-0000-0000-000000000001'),
        ('00000000-0000-0000-0000-000000000011', 'James Carter',       'jcarter@westridge.edu','teacher', '00000000-0000-0000-0000-000000000001'),
        ('00000000-0000-0000-0000-000000000012', 'Maria Lopez',        'mlopez@westridge.edu', 'teacher', '00000000-0000-0000-0000-000000000001'),
        ('00000000-0000-0000-0000-000000000013', 'David Kim',          'dkim@westridge.edu',   'teacher', '00000000-0000-0000-0000-000000000001'),
        ('00000000-0000-0000-0000-000000000014', 'Priya Nair',         'pnair@westridge.edu',  'teacher', '00000000-0000-0000-0000-000000000001'),
        ('00000000-0000-0000-0000-000000000015', 'Thomas Reed',        'treed@westridge.edu',  'teacher', '00000000-0000-0000-0000-000000000001')
    """)

    # ── Observations: James Carter ────────────────────────────────────────────
    cur.execute("""
        INSERT INTO observations (teacher_id, observer_id, observed_at, observation_type, framework, course_name, room, scores, section_notes, raw_notes, ai_summary, flagged, status) VALUES
        ('00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000010','2026-01-15',
         'formal','gradual_release','English III PreAP','204',
         '{"classroom_environment":3,"instruction":3,"planning":3,"student_engagement":3,"professional_responsibilities":3}',
         '{"lesson_overview":"Objectives posted but vague. Students could not restate the goal when asked.","classroom_management":"Transitions slow. No visible timer or signal used.","student_participation":"Front row dominant. Back rows passive for most of the period."}',
         'James started the semester adequately. Objectives present but vague. Transitions slow. Engagement uneven.',
         'Mr. Carter opened the semester with foundational instructional competency. Lesson objectives lacked specificity and student engagement was unevenly distributed. A solid baseline from which to build.',
         false,'submitted'),

        ('00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000010','2026-02-12',
         'informal','5e','English III PreAP','204',
         '{"classroom_environment":3,"instruction":4,"planning":4,"student_engagement":3,"professional_responsibilities":4}',
         '{"lesson_overview":"Clear objective written and verbally stated. Students restated it accurately.","questioning_strategies":"Good use of open-ended questions during Explore phase. Bloom level: Analyze.","time_management":"Pacing improved. Completed all planned phases with 4 minutes for closure."}',
         'Lesson quality improved noticeably. James used the 5E structure well. Questioning was strong. Transitions still slightly slow.',
         'Mr. Carter demonstrated improved instructional planning using the 5E framework with strong questioning techniques at the analysis level. Transitions remain a minor developmental area.',
         false,'submitted'),

        ('00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000010','2026-03-18',
         'formal','gradual_release','English III PreAP','204',
         '{"classroom_environment":4,"instruction":4,"planning":4,"student_engagement":4,"professional_responsibilities":4}',
         '{"lesson_overview":"Differentiated objectives for two ability groups posted on board.","student_participation":"All students on task. Called on students across the room systematically.","classroom_management":"Routine chart in use. Transitions under 90 seconds consistently."}',
         'Strong observation. Differentiated instruction for two groups. All students on task. Routine chart working well.',
         'Mr. Carter delivered a strong differentiated lesson with systematic student participation and efficient transitions. The classroom routine chart has measurably improved management. A proficient observation across all domains.',
         false,'acknowledged'),

        ('00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000010','2026-04-10',
         'formal','5e','English III PreAP','204',
         '{"classroom_environment":4,"instruction":5,"planning":5,"student_engagement":4,"professional_responsibilities":5}',
         '{"lesson_overview":"Outstanding lesson structure. Objectives tied explicitly to state standards.","questioning_strategies":"Bloom levels 4-6 throughout. Every student questioned at least once.","technology_integration":"Used collaborative Google Doc for the Elaborate phase. Highly effective."}',
         'Best observation yet. Differentiated instruction, Bloom levels 4-6, technology integration. All students engaged.',
         'Mr. Carter delivered his strongest observed lesson, demonstrating distinguished planning and instruction. Technology integration enhanced the Elaborate phase and higher-order questioning was sustained throughout with universal student participation.',
         false,'acknowledged'),

        ('00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000010','2026-05-05',
         'formal','collaborative','English III PreAP','204',
         '{"classroom_environment":5,"instruction":5,"planning":5,"student_engagement":5,"professional_responsibilities":5}',
         '{"lesson_overview":"Co-taught with Thomas Reed. Seamless co-teaching model.","student_participation":"100% participation tracked via exit ticket. Every student contributed.","student_interaction":"High-quality peer discourse. Students building on each other responses."}',
         'Exceptional co-taught lesson with Thomas Reed. 100% participation. Outstanding peer discourse. Distinguished across all domains.',
         'Mr. Carter co-delivered an exceptional lesson demonstrating distinguished performance across all five domains. The collaborative model produced outstanding student discourse and universal participation. This lesson should serve as a school-wide model.',
         false,'acknowledged')
    """)

    # ── Observations: Maria Lopez ─────────────────────────────────────────────
    cur.execute("""
        INSERT INTO observations (teacher_id, observer_id, observed_at, observation_type, framework, course_name, room, scores, section_notes, raw_notes, ai_summary, flagged, status) VALUES
        ('00000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000010','2026-01-20',
         'formal','5e','AP Literature','112',
         '{"classroom_environment":5,"instruction":5,"planning":5,"student_engagement":4,"professional_responsibilities":5}',
         '{"lesson_overview":"Precise learning targets tied to AP exam competencies.","questioning_strategies":"Exclusively Bloom levels 5-6. Students generating and evaluating interpretations.","special_needs":"Two ESL students — Maria provided graphic organizers and check-ins throughout."}',
         'Maria opened the semester at an exceptional level. AP rigor, ESL accommodations, Bloom levels 5-6 throughout.',
         'Ms. Lopez began the semester with distinguished instructional performance. AP-level rigor, thoughtful ESL accommodations, and sustained higher-order questioning reflect a master practitioner.',
         false,'acknowledged'),

        ('00000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000010','2026-02-20',
         'formal','collaborative','AP Literature','112',
         '{"classroom_environment":5,"instruction":5,"planning":5,"student_engagement":5,"professional_responsibilities":5}',
         '{"lesson_overview":"Socratic seminar — student-driven discussion of The Handmaid Tale.","student_participation":"Maria spoke fewer than 10 times in 50 minutes. Students self-facilitated.","student_interaction":"Exceptional peer discourse. Students citing evidence unprompted."}',
         'Flawless Socratic seminar. Maria barely spoke. Students self-facilitated with evidence-based discourse.',
         'Ms. Lopez facilitated a masterful Socratic seminar in which students self-directed the discussion with minimal teacher intervention. Evidence-based peer discourse at this level reflects exceptional instructional development over time.',
         false,'acknowledged'),

        ('00000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000010','2026-03-25',
         'walkthrough','collaborative','AP Literature','112',
         '{"classroom_environment":5,"instruction":5,"planning":5,"student_engagement":5,"professional_responsibilities":5}',
         '{"lesson_overview":"Cooperative jigsaw activity. Each group became expert on one text section.","time_management":"Precise 8-minute rotations with student-managed timers.","technology_integration":"Students used Padlet to document and share group findings in real time."}',
         'Cooperative jigsaw with student-managed timers and Padlet documentation. Flawless execution.',
         'Ms. Lopez executed a cooperative jigsaw activity with distinguished precision. Student-managed timers, real-time digital documentation, and expert-level facilitation reflect a teacher operating at the apex of instructional performance.',
         false,'acknowledged'),

        ('00000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000010','2026-04-15',
         'formal','5e','AP Literature','112',
         '{"classroom_environment":5,"instruction":5,"planning":5,"student_engagement":5,"professional_responsibilities":5}',
         '{"lesson_overview":"AP exam simulation. Maria debriefed with targeted feedback per student.","student_participation":"Individual feedback conferences during the Evaluate phase.","professional_responsibilities":"Maria brought external AP grader rubrics and shared them with students."}',
         'AP simulation with individual student feedback conferences. External rubrics shared. Distinguished in every domain.',
         'Ms. Lopez conducted an AP simulation with individual feedback conferences, demonstrating distinguished instructional leadership. The incorporation of external AP grader rubrics shows exceptional professional initiative.',
         false,'acknowledged'),

        ('00000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000010','2026-05-02',
         'formal','collaborative','AP Literature','112',
         '{"classroom_environment":5,"instruction":5,"planning":5,"student_engagement":5,"professional_responsibilities":5}',
         '{"lesson_overview":"Student-led review panels. Each student presented a 3-minute synthesis.","student_participation":"100% participation. Maria only spoke to redirect time.","student_interaction":"Peer questions were thoughtful and evidence-based throughout."}',
         'Student-led review panels. 100% participation. Maria redirected time only. Peak performance observation.',
         'Ms. Lopez facilitated student-led review panels with universal participation and evidence-based peer questioning. Her instructional presence here is that of a master coach — invisible yet essential. A flawless observation.',
         false,'acknowledged')
    """)

    # ── Observations: David Kim ───────────────────────────────────────────────
    cur.execute("""
        INSERT INTO observations (teacher_id, observer_id, observed_at, observation_type, framework, course_name, room, scores, section_notes, raw_notes, ai_summary, flagged, status) VALUES
        ('00000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000010','2026-01-22',
         'formal','direct_instruction','Algebra I','318',
         '{"classroom_environment":1,"instruction":2,"planning":2,"student_engagement":2,"professional_responsibilities":2}',
         '{"lesson_overview":"No objective posted. When asked, David could not state the lesson goal clearly.","classroom_management":"Three students sleeping. Two on phones. David raised his voice twice with no effect.","student_participation":"Only two students responded to questions. Both front row."}',
         'No objective, three students sleeping, two on phones. David raised his voice twice. Urgent concerns.',
         'Mr. Kim''s first observed lesson raised urgent concerns across all domains. The absence of posted objectives, multiple disengaged students, and ineffective behavioral responses indicate an immediate need for structured coaching intervention.',
         true,'submitted'),

        ('00000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000010','2026-02-08',
         'informal','direct_instruction','Algebra I','318',
         '{"classroom_environment":2,"instruction":2,"planning":2,"student_engagement":2,"professional_responsibilities":2}',
         '{"lesson_overview":"Objective posted this time but students could not restate it.","classroom_management":"Frequent off-task behavior. No consistent routine or signal used.","time_management":"Ran 12 minutes over — bell rang mid-activity with no closure."}',
         'Objective posted but students unaware of it. Frequent disruptions. Ran 12 minutes over bell.',
         'Mr. Kim showed minimal progress from the January observation. While an objective was posted, students were unaware of it, management remained inconsistent, and the lesson ran well past the period without closure.',
         true,'submitted'),

        ('00000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000010','2026-03-14',
         'formal','direct_instruction','Algebra I','318',
         '{"classroom_environment":2,"instruction":3,"planning":3,"student_engagement":2,"professional_responsibilities":3}',
         '{"lesson_overview":"Clear objective posted and verbally stated. Students could restate it.","classroom_management":"Routine chart implemented. Some improvement in transitions but disruptions continue.","questioning_strategies":"Mostly recall-level questions. Limited higher-order thinking observed."}',
         'Objective communicated effectively for first time. Routine chart in use. Management still a major concern.',
         'Mr. Kim demonstrated meaningful improvement in lesson planning with a clearly communicated objective and the introduction of a routine chart. Classroom management and student engagement remain significant developmental priorities.',
         true,'submitted'),

        ('00000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000010','2026-04-20',
         'formal','5e','Algebra I','318',
         '{"classroom_environment":3,"instruction":3,"planning":3,"student_engagement":3,"professional_responsibilities":3}',
         '{"lesson_overview":"5E structure attempted for first time. Phases somewhat blurred but present.","classroom_management":"Transitions under 2 minutes. Fewer disruptions. Routine chart referenced by students.","student_participation":"More students responding. Still front-row dominant but improvement noted."}',
         'First 5E attempt. Transitions faster. Students referencing routine chart. Meaningful across-the-board progress.',
         'Mr. Kim showed meaningful growth in his first 5E lesson attempt. Transitions improved, the routine chart is becoming embedded in classroom culture, and student participation broadened noticeably. A genuine turning point observation.',
         false,'submitted'),

        ('00000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000010','2026-05-06',
         'formal','5e','Algebra I','318',
         '{"classroom_environment":3,"instruction":4,"planning":4,"student_engagement":3,"professional_responsibilities":3}',
         '{"lesson_overview":"Strong 5E lesson. Clear phases with student-generated examples in Elaborate.","classroom_management":"Three disruptions handled calmly and effectively. No voice raising.","student_participation":"Group activity had full participation. Exit ticket showed 80% mastery."}',
         'Strongest observation yet. 5E executed well, group activity with full participation, 80% exit ticket mastery.',
         'Mr. Kim delivered his strongest observed lesson, executing the 5E framework with confidence and achieving 80% mastery on the exit ticket. Classroom management was notably calm and effective. This observation marks a clear positive inflection in his trajectory.',
         false,'submitted')
    """)

    # ── Observations: Priya Nair ──────────────────────────────────────────────
    cur.execute("""
        INSERT INTO observations (teacher_id, observer_id, observed_at, observation_type, framework, course_name, room, scores, section_notes, raw_notes, ai_summary, flagged, status) VALUES
        ('00000000-0000-0000-0000-000000000014','00000000-0000-0000-0000-000000000010','2026-01-28',
         'formal','direct_instruction','Geometry PreAP','221',
         '{"classroom_environment":4,"instruction":4,"planning":4,"student_engagement":3,"professional_responsibilities":4}',
         '{"lesson_overview":"Well-structured direct instruction lesson. Standards clearly aligned.","student_participation":"Strong content delivery but participation clustered in front two rows.","questioning_strategies":"Mostly closed questions. Bloom level: Remember and Understand only."}',
         'Strong content delivery. Participation clustered in front rows. Questioning recall-level only.',
         'Ms. Nair delivered confident and well-aligned instruction with strong planning evident throughout. Student participation was unequally distributed and questioning remained at lower Bloom levels. Broader engagement strategies are the clear developmental focus.',
         false,'submitted'),

        ('00000000-0000-0000-0000-000000000014','00000000-0000-0000-0000-000000000010','2026-02-18',
         'informal','direct_instruction','Geometry PreAP','221',
         '{"classroom_environment":4,"instruction":4,"planning":4,"student_engagement":3,"professional_responsibilities":4}',
         '{"lesson_overview":"Similar structure to January. Priya is consistent but not yet varying her approach.","student_participation":"Same pattern — front row dominant. Back rows minimally engaged.","time_management":"Excellent pacing. Finished with 5-minute structured closure."}',
         'Consistent instruction. Excellent pacing and closure. Engagement pattern unchanged from January.',
         'Ms. Nair demonstrates consistency in planning and pacing but has not yet varied her instructional approach to broaden student participation. The engagement pattern from January persists and warrants targeted intervention.',
         false,'submitted'),

        ('00000000-0000-0000-0000-000000000014','00000000-0000-0000-0000-000000000010','2026-03-22',
         'formal','gradual_release','Geometry PreAP','221',
         '{"classroom_environment":4,"instruction":4,"planning":4,"student_engagement":3,"professional_responsibilities":4}',
         '{"lesson_overview":"Gradual release attempted. I Do and We Do strong. You Do too brief.","student_participation":"Think-pair-share used for first time. Students needed clearer prompts.","questioning_strategies":"Some Bloom level 3 questions appeared. Progress from prior observations."}',
         'Gradual release attempted. Think-pair-share introduced. We Do strong. You Do too brief. Bloom level 3 emerging.',
         'Ms. Nair demonstrated willingness to develop her instructional approach with a gradual release structure and think-pair-share. The independent practice phase was too brief and participation prompts need refinement, but higher-order questioning is emerging.',
         false,'submitted'),

        ('00000000-0000-0000-0000-000000000014','00000000-0000-0000-0000-000000000010','2026-04-22',
         'formal','collaborative','Geometry PreAP','221',
         '{"classroom_environment":4,"instruction":5,"planning":5,"student_engagement":4,"professional_responsibilities":4}',
         '{"lesson_overview":"Gallery walk — eight stations around the room. Every student moved and contributed.","student_participation":"Universal participation verified. Priya tracked contributions on a clipboard.","student_interaction":"High-quality peer discussion at each station. Students explaining to each other."}',
         'Gallery walk with universal participation tracked by clipboard. Students explaining to each other. Major breakthrough.',
         'Ms. Nair led a highly effective gallery walk with verified universal participation and strong peer explanation. Deliberately tracking student contributions reflects a significant shift in instructional intentionality. A breakthrough observation.',
         false,'acknowledged'),

        ('00000000-0000-0000-0000-000000000014','00000000-0000-0000-0000-000000000010','2026-05-04',
         'formal','collaborative','Geometry PreAP','221',
         '{"classroom_environment":5,"instruction":5,"planning":5,"student_engagement":5,"professional_responsibilities":5}',
         '{"lesson_overview":"Student-led review tournament. Students designed the questions.","student_participation":"Every student wrote and presented at least one question.","student_interaction":"Peer feedback on question quality was thoughtful and specific."}',
         'Student-designed review tournament. Every student wrote and presented a question. Distinguished across all domains.',
         'Ms. Nair facilitated a student-designed review tournament in which every student authored and presented questions, with peers providing specific feedback. This represents distinguished performance and a remarkable semester-long growth arc.',
         false,'acknowledged')
    """)

    # ── Observations: Thomas Reed ─────────────────────────────────────────────
    cur.execute("""
        INSERT INTO observations (teacher_id, observer_id, observed_at, observation_type, framework, course_name, room, scores, section_notes, raw_notes, ai_summary, flagged, status) VALUES
        ('00000000-0000-0000-0000-000000000015','00000000-0000-0000-0000-000000000010','2026-01-30',
         'formal','direct_instruction','World History','105',
         '{"classroom_environment":2,"instruction":2,"planning":2,"student_engagement":3,"professional_responsibilities":2}',
         '{"lesson_overview":"No posted objective. Thomas explained the plan verbally but students were unclear.","classroom_management":"Chaotic transitions. Students talking over Thomas multiple times.","time_management":"Ran out of time before the main activity. Bell rang with students mid-setup."}',
         'No objective, chaotic transitions, ran out of time before the main activity. Enthusiastic but unprepared.',
         'Mr. Reed demonstrated genuine enthusiasm for his subject but lacked the foundational planning and management structures needed for effective instruction. Immediate structured coaching support should begin.',
         false,'submitted'),

        ('00000000-0000-0000-0000-000000000015','00000000-0000-0000-0000-000000000010','2026-02-25',
         'informal','direct_instruction','World History','105',
         '{"classroom_environment":2,"instruction":3,"planning":3,"student_engagement":3,"professional_responsibilities":3}',
         '{"lesson_overview":"Objective posted using the template James provided. Clearer than before.","classroom_management":"Students still testing boundaries. Thomas is too lenient on phones.","time_management":"Completed the lesson on time. Used a visible timer for the first time."}',
         'Objective posted using James template. Timer used. Students still testing boundaries. Improvement visible.',
         'Mr. Reed showed early progress in lesson planning using the shared template and introduced a visible timer. Classroom management remains a primary concern as students continue to test limits without consistent consequences.',
         false,'submitted'),

        ('00000000-0000-0000-0000-000000000015','00000000-0000-0000-0000-000000000010','2026-03-20',
         'formal','gradual_release','World History','105',
         '{"classroom_environment":3,"instruction":3,"planning":3,"student_engagement":3,"professional_responsibilities":3}',
         '{"lesson_overview":"Gradual release structure evident. I Do clearly modeled. We Do engaged most students.","classroom_management":"Three anchor routines now visible. Students referencing them independently.","student_participation":"More equitable participation. Cold-calling introduced for first time."}',
         'Gradual release visible. Anchor routines referenced by students. Cold-calling introduced. Steady growth.',
         'Mr. Reed demonstrated steady and measurable growth across all domains. The gradual release structure was evident, anchor routines are becoming embedded, and the introduction of cold-calling signals increasing instructional confidence.',
         false,'submitted'),

        ('00000000-0000-0000-0000-000000000015','00000000-0000-0000-0000-000000000010','2026-04-18',
         'formal','5e','World History','105',
         '{"classroom_environment":3,"instruction":4,"planning":4,"student_engagement":4,"professional_responsibilities":3}',
         '{"lesson_overview":"Thomas used a primary source document as a narrative hook. Students immediately engaged.","student_participation":"High energy from the start. 85% participation tracked.","questioning_strategies":"Bloom level 4 questions used during Explain phase. Real analytical thinking prompted."}',
         'Primary source hook — students immediately engaged. 85% participation. Bloom level 4 questioning. Breakout lesson.',
         'Mr. Reed delivered a standout lesson using a primary source document as a narrative hook, generating immediate student engagement. Higher-order questioning at Bloom level 4 and 85% tracked participation mark this as his most impressive lesson of the year.',
         false,'submitted'),

        ('00000000-0000-0000-0000-000000000015','00000000-0000-0000-0000-000000000010','2026-05-05',
         'formal','collaborative','World History','105',
         '{"classroom_environment":4,"instruction":4,"planning":4,"student_engagement":4,"professional_responsibilities":4}',
         '{"lesson_overview":"Co-taught with James Carter. Thomas led the Explore and Elaborate phases independently.","classroom_management":"Managed 32 students in collaborative groups without incident.","student_participation":"Full participation. Students clearly comfortable with Thomas as a teacher now."}',
         'Co-taught with James. Thomas led Explore and Elaborate independently. 32 students managed well. Major growth.',
         'Mr. Reed co-taught confidently alongside Mr. Carter, independently leading two lesson phases with a class of 32. His management and instructional delivery have both improved dramatically. His semester-long trajectory is one of the most encouraging in the building.',
         false,'submitted')
    """)

    # ── Performance Reviews ───────────────────────────────────────────────────
    cur.execute("""
        INSERT INTO performance_reviews (teacher_id, reviewer_id, period, category_scores, final_notes, status, ai_summary) VALUES
        ('00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000010','Spring 2026',
         '{"instructional_effectiveness":5,"classroom_management":5,"student_engagement":4,"professional_responsibilities":5,"growth_and_improvement":5}',
         'James has had an exceptional semester. He mentored a first-year teacher, differentiated instruction for multiple ability groups, and co-delivered a model lesson. His growth from Q1 to Q2 is remarkable. I am formally nominating him for Teacher of the Year.',
         'complete',
         'Mr. Carter achieved distinguished performance across four of five dimensions in Spring 2026. His instructional growth arc, peer mentorship of Mr. Reed, and co-taught model lesson represent the highest form of professional contribution. A Teacher of the Year nomination is strongly merited.'),

        ('00000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000010','Spring 2026',
         '{"instructional_effectiveness":5,"classroom_management":5,"student_engagement":5,"professional_responsibilities":5,"growth_and_improvement":5}',
         'Maria is the finest educator I have observed in my career as a principal. Perfect scores across every dimension, every observation, every period. She led our school-wide PD, mentored two colleagues informally, and is being recommended for an instructional coaching role at the district level.',
         'complete',
         'Ms. Lopez achieved perfect scores across all five dimensions and all observed periods in Spring 2026. Her leadership of school-wide professional development and informal mentorship of colleagues extends her impact well beyond her own classroom. A district-level instructional coaching recommendation is in progress.'),

        ('00000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000010','Spring 2026',
         '{"instructional_effectiveness":3,"classroom_management":3,"student_engagement":3,"professional_responsibilities":3,"growth_and_improvement":4}',
         'David has shown genuine and measurable improvement over the course of the semester. His May observation was his strongest yet. Growth dimension scores a 4 because his responsiveness to coaching has been consistent and his trajectory is clearly upward. Improvement plan formally closed.',
         'pending_signoff',
         'Mr. Kim demonstrated meaningful growth across all dimensions in Spring 2026, with his May observation marking a clear positive inflection. His consistent responsiveness to coaching warrants a growth score of 4, and the structured improvement plan is being formally closed.'),

        ('00000000-0000-0000-0000-000000000014','00000000-0000-0000-0000-000000000010','Spring 2026',
         '{"instructional_effectiveness":5,"classroom_management":4,"student_engagement":5,"professional_responsibilities":4,"growth_and_improvement":5}',
         'Priya has undergone a transformation this semester. Her student engagement arc — from passive front-row participation in January to a student-designed review tournament in May — is one of the most impressive growth stories I have seen. Recommend for peer observation lead next year.',
         'pending_signoff',
         'Ms. Nair delivered one of the most impressive growth arcs of the semester, transforming student engagement from a persistent weakness to a distinguished strength. Her student-designed review tournament in May stands as a model of instructional innovation. A peer observation lead role is recommended.'),

        ('00000000-0000-0000-0000-000000000015','00000000-0000-0000-0000-000000000010','Spring 2026',
         '{"instructional_effectiveness":4,"classroom_management":4,"student_engagement":4,"professional_responsibilities":3,"growth_and_improvement":5}',
         'Thomas Reed has grown more in one semester than most teachers grow in two years. His co-teaching session with James was outstanding. Growth scores a 5 — this is the most rapid first-year development I have observed. Assigning a mentor formally for next year.',
         'draft',
         'Mr. Reed''s Spring 2026 review reflects exceptional growth velocity for a first-year teacher. His co-teaching session with Mr. Carter was a standout moment, and his growth score of 5 reflects one of the most impressive developmental arcs of the academic year.')
    """)

    # ── Staff Notes ───────────────────────────────────────────────────────────
    cur.execute("""
        INSERT INTO staff_notes (teacher_id, author_id, content, tag, pinned) VALUES
        ('00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000010',
         'James volunteered to mentor Thomas Reed without being asked. Showed real leadership instinct.','commendation',true),
        ('00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000010',
         'Attended district differentiated instruction PD on his own time and implemented it within the week.','pd',false),
        ('00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000010',
         'James mentioned feeling stretched thin with the mentoring load. Checked in — he wants to continue but needs workload monitoring.','coaching',false),
        ('00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000010',
         'Parent called specifically to commend James for how he handled a student conflict. Handled with maturity and care.','commendation',false),
        ('00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000010',
         'Co-teaching session with Thomas went excellently. James prepared a shared lesson plan template that Thomas now uses independently.','coaching',false),

        ('00000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000010',
         'Maria recognized at district level for literacy outcomes. Shared at staff meeting — standing ovation.','commendation',true),
        ('00000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000010',
         'Agreed to lead school-wide cooperative learning PD. Delivered an exceptional 90-minute session with 100% staff positive rating.','pd',false),
        ('00000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000010',
         'Two teachers requested informal observation time in Maria classroom after hearing about the Socratic seminar.','commendation',false),
        ('00000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000010',
         'Maria expressed interest in moving into an instructional coaching role. Forwarded her CV to district HR with a strong personal recommendation.','general',false),

        ('00000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000010',
         'Parent complaint — unclear homework sent home two weeks in a row. Discussed with David. Agreed to weekly parent email.','concern',true),
        ('00000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000010',
         'Second parent complaint in two weeks regarding unclear communication. Flagged formally for improvement plan.','concern',false),
        ('00000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000010',
         'David attended the optional classroom management workshop without being asked. Positive indicator.','pd',false),
        ('00000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000010',
         'Bi-weekly coaching check-in: David is receptive, taking notes, implementing suggestions within days. Attitude has genuinely shifted.','coaching',false),
        ('00000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000010',
         'No parent complaints in April or May. Weekly emails are going out consistently. Improvement plan formally closed.','commendation',false),

        ('00000000-0000-0000-0000-000000000014','00000000-0000-0000-0000-000000000010',
         'Priya requested engagement PD resources proactively. Sent curated articles and a video series on gallery walk structures.','coaching',false),
        ('00000000-0000-0000-0000-000000000014','00000000-0000-0000-0000-000000000010',
         'Gallery walk lesson observed informally by two other teachers who requested to replicate it.','commendation',false),
        ('00000000-0000-0000-0000-000000000014','00000000-0000-0000-0000-000000000010',
         'Priya expressed early frustration about engagement scores. Reminded her that growth is the goal. She took it well.','coaching',false),
        ('00000000-0000-0000-0000-000000000014','00000000-0000-0000-0000-000000000010',
         'Student-led review tournament in May — multiple students told me it was the best class of the year.','commendation',true),

        ('00000000-0000-0000-0000-000000000015','00000000-0000-0000-0000-000000000010',
         'Thomas reached out after his first observation to ask for feedback. Exceptional self-awareness for a first-year teacher.','commendation',false),
        ('00000000-0000-0000-0000-000000000015','00000000-0000-0000-0000-000000000010',
         'Thomas mentioned staying until 7pm most nights. High dedication but sustainability is a concern. Monitoring.','concern',false),
        ('00000000-0000-0000-0000-000000000015','00000000-0000-0000-0000-000000000010',
         'Students clearly like Thomas. High warmth. Needs to channel that relationship capital into consistent structure.','coaching',false),
        ('00000000-0000-0000-0000-000000000015','00000000-0000-0000-0000-000000000010',
         'April primary source lesson was genuinely creative and impressive. Real instinct for engagement.','commendation',false),
        ('00000000-0000-0000-0000-000000000015','00000000-0000-0000-0000-000000000010',
         'Co-teaching with James was a success. Thomas held his own completely. Students responded to the dynamic extremely well.','commendation',true)
    """)

    # ── Goals ─────────────────────────────────────────────────────────────────
    cur.execute("""
        INSERT INTO goals (id, teacher_id, set_by, title, description, linked_dimension, evidence_type, target_date, status) VALUES
        ('00000000-0000-0000-0000-000000000020','00000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000010',
         'Raise Classroom Management to Proficient',
         'Implement three anchor routines with visible classroom anchors. Target: management score of 3 or above in next two formal observations.',
         'classroom_management','observation_score','2026-06-30','in_progress'),

        ('00000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000010',
         'Post and Communicate Objectives Daily',
         'Every lesson begins with a written objective tied to a standard. Verbally communicated and verifiable by students on request.',
         'instructional_effectiveness','observation_score','2026-05-31','achieved'),

        ('00000000-0000-0000-0000-000000000022','00000000-0000-0000-0000-000000000014','00000000-0000-0000-0000-000000000010',
         'Achieve Distinguished Student Engagement',
         'Incorporate at least two interactive structures per lesson. Use a participation tracker to ensure equitable distribution. Target: engagement score of 4+ in all observations.',
         'student_engagement','observation_score','2026-06-15','achieved'),

        ('00000000-0000-0000-0000-000000000023','00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000010',
         'Complete First-Year Teacher Mentorship',
         'Provide bi-weekly check-ins and one co-teaching session for Thomas Reed. Document outcomes and submit a mentorship reflection at end of semester.',
         'professional_responsibilities','reflection','2026-06-30','achieved'),

        ('00000000-0000-0000-0000-000000000024','00000000-0000-0000-0000-000000000015','00000000-0000-0000-0000-000000000010',
         'Develop Consistent Lesson Pacing',
         'Submit weekly lesson plans for admin review. Use a visible timer during every lesson. Target: complete all planned phases within the period for 4 consecutive observations.',
         'planning_and_preparation','observation_score','2026-05-31','in_progress'),

        ('00000000-0000-0000-0000-000000000025','00000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000010',
         'Lead School-Wide Cooperative Learning PD',
         'Design and deliver a 90-minute cooperative learning PD session for all staff. Collect feedback and submit a session summary to admin.',
         'professional_responsibilities','pd_certificate','2026-06-10','achieved'),

        ('00000000-0000-0000-0000-000000000026','00000000-0000-0000-0000-000000000015','00000000-0000-0000-0000-000000000010',
         'Establish Classroom Management Routines',
         'Implement three non-negotiable routines with visible anchor posters. Target: management score of 3+ in next formal observation.',
         'classroom_management','observation_score','2026-06-30','in_progress'),

        ('00000000-0000-0000-0000-000000000027','00000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000010',
         'Improve Parent Communication',
         'Send a clear weekly update email to all parents every Friday. Admin spot-checks monthly. Target: zero parent complaints for 8 consecutive weeks.',
         'professional_responsibilities','reflection','2026-06-30','achieved')
    """)

    # ── Goal Milestones ───────────────────────────────────────────────────────
    cur.execute("""
        INSERT INTO goal_milestones (goal_id, description, due_date, completed) VALUES
        ('00000000-0000-0000-0000-000000000020','Post three anchor routine charts in visible classroom locations','2026-02-28',true),
        ('00000000-0000-0000-0000-000000000020','Achieve management score of 3 in a formal observation','2026-04-30',true),
        ('00000000-0000-0000-0000-000000000020','Achieve management score of 4 in a formal observation','2026-06-30',false),

        ('00000000-0000-0000-0000-000000000022','Use a participation tracker for one full week','2026-03-15',true),
        ('00000000-0000-0000-0000-000000000022','Achieve engagement score of 4 in a formal observation','2026-04-30',true),
        ('00000000-0000-0000-0000-000000000022','Achieve engagement score of 5 in a formal observation','2026-05-31',true),

        ('00000000-0000-0000-0000-000000000023','Complete first bi-weekly check-in with Thomas','2026-02-15',true),
        ('00000000-0000-0000-0000-000000000023','Deliver shared lesson plan template to Thomas','2026-03-01',true),
        ('00000000-0000-0000-0000-000000000023','Complete co-teaching session','2026-05-10',true),
        ('00000000-0000-0000-0000-000000000023','Submit mentorship reflection to admin','2026-06-20',false),

        ('00000000-0000-0000-0000-000000000024','Submit first weekly lesson plan for admin review','2026-02-07',true),
        ('00000000-0000-0000-0000-000000000024','Complete lesson within bell time for 2 consecutive observations','2026-04-30',true),
        ('00000000-0000-0000-0000-000000000024','Complete lesson within bell time for 4 consecutive observations','2026-05-31',false),

        ('00000000-0000-0000-0000-000000000025','Submit PD agenda draft to admin','2026-05-01',true),
        ('00000000-0000-0000-0000-000000000025','Run pilot session with volunteer teachers','2026-05-20',true),
        ('00000000-0000-0000-0000-000000000025','Deliver full school-wide PD session','2026-06-10',true)
    """)

    # ── Goal Updates ──────────────────────────────────────────────────────────
    cur.execute("""
        INSERT INTO goal_updates (goal_id, author_id, content) VALUES
        ('00000000-0000-0000-0000-000000000020','00000000-0000-0000-0000-000000000013','Routine chart is up. Students noticed it immediately and started asking what the signals mean.'),
        ('00000000-0000-0000-0000-000000000020','00000000-0000-0000-0000-000000000010','March observation confirmed management score of 3. First milestone met. Continuing.'),
        ('00000000-0000-0000-0000-000000000020','00000000-0000-0000-0000-000000000013','May observation was my best. Group activity ran smoothly. Targeting 4 next.'),

        ('00000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000013','Posted objective for the first time. Admin confirmed students could restate it during walkthrough.'),
        ('00000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000010','Consistent posting confirmed in three consecutive walkthroughs. Goal achieved.'),

        ('00000000-0000-0000-0000-000000000022','00000000-0000-0000-0000-000000000014','Used participation tracker for a full week. Eye-opening — realized I was calling on the same 6 students.'),
        ('00000000-0000-0000-0000-000000000022','00000000-0000-0000-0000-000000000014','Gallery walk worked. Every student moved and contributed. Engagement score hit 4.'),
        ('00000000-0000-0000-0000-000000000022','00000000-0000-0000-0000-000000000010','May observation: student-designed tournament. Engagement score of 5. Goal fully achieved.'),

        ('00000000-0000-0000-0000-000000000023','00000000-0000-0000-0000-000000000011','First check-in complete. Thomas and I identified pacing and planning as the two priority areas.'),
        ('00000000-0000-0000-0000-000000000023','00000000-0000-0000-0000-000000000011','Shared lesson plan template with Thomas. He used it the next day and said it changed everything.'),
        ('00000000-0000-0000-0000-000000000023','00000000-0000-0000-0000-000000000010','Co-teaching session completed May 5. Thomas led two phases independently. Outstanding result.'),

        ('00000000-0000-0000-0000-000000000024','00000000-0000-0000-0000-000000000015','Submitted first lesson plan. Dr. Mitchell gave written feedback — very helpful for planning the week.'),
        ('00000000-0000-0000-0000-000000000024','00000000-0000-0000-0000-000000000015','Finished within bell time twice in a row. Used a timer and it made a huge difference.'),

        ('00000000-0000-0000-0000-000000000025','00000000-0000-0000-0000-000000000012','PD agenda submitted. Dr. Mitchell approved with minor edits.'),
        ('00000000-0000-0000-0000-000000000025','00000000-0000-0000-0000-000000000012','Pilot session delivered. Teachers loved the jigsaw structure. Ready for the full staff session.'),
        ('00000000-0000-0000-0000-000000000025','00000000-0000-0000-0000-000000000010','Full PD delivered June 10. 100% positive feedback. Goal complete.'),

        ('00000000-0000-0000-0000-000000000027','00000000-0000-0000-0000-000000000013','Sent first weekly email. Clear, on time, no jargon. Parents responded positively.'),
        ('00000000-0000-0000-0000-000000000027','00000000-0000-0000-0000-000000000010','Eight consecutive weeks with no parent complaints. Improvement plan formally closed. Goal achieved.')
    """)

    conn.commit()
    cur.close()
    conn.close()
    print("Seeded successfully.")