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
            subjects JSONB DEFAULT '[]',
            schedule JSONB DEFAULT '[]',
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

    cur.execute("""
        INSERT INTO schools (id, name, district)
        VALUES ('00000000-0000-0000-0000-000000000001', 'Westridge Academy', 'Houston ISD')
    """)

    # schedule format: [{period, time, course, room, days}]
    cur.execute("""
        INSERT INTO users (id, name, email, role, school_id, subjects, schedule) VALUES
        ('00000000-0000-0000-0000-000000000010',
         'Dr. Sarah Mitchell', 'admin@westridge.edu', 'admin',
         '00000000-0000-0000-0000-000000000001',
         '[]', '[]'),

        ('00000000-0000-0000-0000-000000000011',
         'James Carter', 'jcarter@westridge.edu', 'teacher',
         '00000000-0000-0000-0000-000000000001',
         '["English III PreAP", "English III", "AP Language & Composition"]',
         '[
           {"period": "1st", "time": "7:45 – 8:35", "course": "English III PreAP", "room": "204", "days": "Mon–Fri"},
           {"period": "2nd", "time": "8:40 – 9:30", "course": "English III", "room": "204", "days": "Mon–Fri"},
           {"period": "3rd", "time": "9:35 – 10:25", "course": "English III PreAP", "room": "204", "days": "Mon–Fri"},
           {"period": "4th", "time": "10:30 – 11:20", "course": "Conference", "room": "204", "days": "Mon–Fri"},
           {"period": "5th", "time": "11:25 – 12:15", "course": "AP Language & Composition", "room": "204", "days": "Mon–Fri"},
           {"period": "6th", "time": "12:20 – 13:10", "course": "English III", "room": "204", "days": "Mon–Fri"},
           {"period": "7th", "time": "13:15 – 14:05", "course": "Mentor Period / PLC", "room": "204", "days": "Tue–Thu"}
         ]'),

        ('00000000-0000-0000-0000-000000000012',
         'Maria Lopez', 'mlopez@westridge.edu', 'teacher',
         '00000000-0000-0000-0000-000000000001',
         '["AP Literature & Composition", "English IV PreAP", "Dual Credit English"]',
         '[
           {"period": "1st", "time": "7:45 – 8:35", "course": "AP Literature & Composition", "room": "112", "days": "Mon–Fri"},
           {"period": "2nd", "time": "8:40 – 9:30", "course": "AP Literature & Composition", "room": "112", "days": "Mon–Fri"},
           {"period": "3rd", "time": "9:35 – 10:25", "course": "Conference", "room": "112", "days": "Mon–Fri"},
           {"period": "4th", "time": "10:30 – 11:20", "course": "English IV PreAP", "room": "112", "days": "Mon–Fri"},
           {"period": "5th", "time": "11:25 – 12:15", "course": "Dual Credit English", "room": "112", "days": "Mon–Fri"},
           {"period": "6th", "time": "12:20 – 13:10", "course": "AP Literature & Composition", "room": "112", "days": "Mon–Fri"},
           {"period": "7th", "time": "13:15 – 14:05", "course": "Instructional Coaching / PD Lead", "room": "Library", "days": "Wed"}
         ]'),

        ('00000000-0000-0000-0000-000000000013',
         'David Kim', 'dkim@westridge.edu', 'teacher',
         '00000000-0000-0000-0000-000000000001',
         '["Algebra I", "Algebra I Support"]',
         '[
           {"period": "1st", "time": "7:45 – 8:35", "course": "Algebra I", "room": "318", "days": "Mon–Fri"},
           {"period": "2nd", "time": "8:40 – 9:30", "course": "Algebra I Support", "room": "318", "days": "Mon–Fri"},
           {"period": "3rd", "time": "9:35 – 10:25", "course": "Algebra I", "room": "318", "days": "Mon–Fri"},
           {"period": "4th", "time": "10:30 – 11:20", "course": "Algebra I", "room": "318", "days": "Mon–Fri"},
           {"period": "5th", "time": "11:25 – 12:15", "course": "Conference", "room": "318", "days": "Mon–Fri"},
           {"period": "6th", "time": "12:20 – 13:10", "course": "Algebra I Support", "room": "318", "days": "Mon–Fri"},
           {"period": "7th", "time": "13:15 – 14:05", "course": "Tutoring / Office Hours", "room": "318", "days": "Mon, Wed, Fri"}
         ]'),

        ('00000000-0000-0000-0000-000000000014',
         'Priya Nair', 'pnair@westridge.edu', 'teacher',
         '00000000-0000-0000-0000-000000000001',
         '["Geometry PreAP", "Geometry", "Math UIL Sponsor"]',
         '[
           {"period": "1st", "time": "7:45 – 8:35", "course": "Geometry PreAP", "room": "221", "days": "Mon–Fri"},
           {"period": "2nd", "time": "8:40 – 9:30", "course": "Geometry", "room": "221", "days": "Mon–Fri"},
           {"period": "3rd", "time": "9:35 – 10:25", "course": "Geometry PreAP", "room": "221", "days": "Mon–Fri"},
           {"period": "4th", "time": "10:30 – 11:20", "course": "Geometry PreAP", "room": "221", "days": "Mon–Fri"},
           {"period": "5th", "time": "11:25 – 12:15", "course": "Conference", "room": "221", "days": "Mon–Fri"},
           {"period": "6th", "time": "12:20 – 13:10", "course": "Geometry", "room": "221", "days": "Mon–Fri"},
           {"period": "7th", "time": "13:15 – 14:05", "course": "Math UIL Practice", "room": "221", "days": "Tue, Thu"}
         ]'),

        ('00000000-0000-0000-0000-000000000015',
         'Thomas Reed', 'treed@westridge.edu', 'teacher',
         '00000000-0000-0000-0000-000000000001',
         '["World History", "AP World History"]',
         '[
           {"period": "1st", "time": "7:45 – 8:35", "course": "World History", "room": "105", "days": "Mon–Fri"},
           {"period": "2nd", "time": "8:40 – 9:30", "course": "World History", "room": "105", "days": "Mon–Fri"},
           {"period": "3rd", "time": "9:35 – 10:25", "course": "AP World History", "room": "105", "days": "Mon–Fri"},
           {"period": "4th", "time": "10:30 – 11:20", "course": "Conference", "room": "105", "days": "Mon–Fri"},
           {"period": "5th", "time": "11:25 – 12:15", "course": "World History", "room": "105", "days": "Mon–Fri"},
           {"period": "6th", "time": "12:20 – 13:10", "course": "World History", "room": "105", "days": "Mon–Fri"},
           {"period": "7th", "time": "13:15 – 14:05", "course": "Mentorship w/ J. Carter", "room": "204", "days": "Mon, Wed"}
         ]')
    """)

    # ── Observations: James Carter ─────────────────────────────────────────────
    cur.execute("""INSERT INTO observations (teacher_id, observer_id, observed_at, observation_type, framework, course_name, room, scores, section_notes, raw_notes, ai_summary, flagged, status) VALUES
    ('00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000010','2026-01-15',
     'formal','gradual_release','English III PreAP','204',
     '{"classroom_environment":3,"instruction":3,"planning":3,"student_engagement":3,"professional_responsibilities":3}',
     '{"lesson_overview":"The stated objective was posted as ''Students will analyze author purpose'' but lacked measurable criteria. When I paused and asked three students what the goal of the lesson was, only one could partially restate it. The lesson plan was shared with me beforehand and showed the correct standard alignment, but the translation from plan to classroom communication fell short.","lesson_structure":"Mr. Carter used a gradual release model: he modeled a short passage analysis (I Do), then moved students into pairs for guided practice (We Do). The You Do phase was shortened due to pacing — students had only 6 minutes to work independently before the bell. The I Do phase was strong and clearly rehearsed, but transitions into We Do were slow, costing roughly 4 minutes of instructional time.","student_participation":"Participation was clustered. I tracked which students responded during the We Do phase and noted that 8 of the 24 students answered questions or volunteered comments. The remaining 16 were largely passive. Students in the back two rows had zero observed contributions.","questioning_strategies":"Questions were predominantly at Bloom levels 1 and 2 (recall and comprehension). No analytical or evaluative questions were observed. A stronger question like ''Why might the author have chosen this structure rather than a straightforward narrative?'' was a missed opportunity at several natural pause points.","classroom_management":"Two students were observed off-task on their phones for extended periods. Transition from I Do to We Do took 4 minutes 20 seconds — students were unsure where to sit for partner work and there was no signal or routine to guide them. No visible behavior chart or routine anchor was present in the room.","time_management":"The lesson plan indicated a 5-minute closure activity, but the period ended before it could begin. The pacing issue originated in the We Do setup."}',
     'James opened the semester with an adequate but underdeveloped lesson. Objectives were posted but not made meaningful to students, and participation was heavily skewed toward a small group of volunteers. Transitions were slow and there was no visible classroom management system in place.',
     'Mr. Carter opened the semester with foundational instructional competency. Lesson objectives lacked specificity, student engagement was unevenly distributed across the room, and transition management requires structured routines. The modeled I Do phase was a genuine strength.',
     false,'submitted'),

    ('00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000010','2026-03-18',
     'formal','5e','English III PreAP','204',
     '{"classroom_environment":4,"instruction":4,"planning":4,"student_engagement":4,"professional_responsibilities":4}',
     '{"lesson_overview":"Mr. Carter posted a two-part objective: ''Students will evaluate the rhetorical strategies in a persuasive essay and construct a written claim with textual evidence.'' Both parts were written on the board and verbally stated at the start of class. When I asked a student mid-lesson what the goal was, she restated it accurately and added, ''We''re supposed to find proof for our claim.'' This is a meaningful improvement — students are internalizing the purpose of the work.","lesson_structure":"The 5E structure was clearly executed. Engage (3 min): a controversial headline projected with the prompt ''Do you agree?'' — immediate hands up. Explore (8 min): students annotated a short op-ed in pairs. Explain (12 min): Mr. Carter unpacked three rhetorical strategies with excellent questioning. Elaborate (15 min): students wrote their own claim paragraphs. Evaluate (5 min): two students shared claims with structured class feedback. All phases completed with time to spare.","student_participation":"19 of 24 students contributed at least once during the Explain or Elaborate debrief. Mr. Carter used cold-calling for the first time — he called on three students who had not yet spoken and they responded substantively. The routine chart on the wall appears to be working — students moved into pairs in under 90 seconds.","questioning_strategies":"Question quality has improved significantly. During the Explain phase: ''What does the author gain by opening with an emotional appeal before presenting data — why not lead with the data?'' This is Bloom level 5 (evaluate). A student responded with a nuanced answer about audience trust, and Mr. Carter built on it rather than moving on.","classroom_management":"The routine chart is visible and referenced — I observed two students check it independently during the transition to Elaborate. One student was off-task briefly; Mr. Carter addressed it with a quiet proximity move rather than a verbal reprimand.","time_management":"All phases completed. Closure included two student presentations with peer feedback. No instructional time lost to transitions."}',
     'Significant improvement across all domains. Mr. Carter implemented the 5E model with fidelity, achieved meaningful student participation across the room, and demonstrated higher-order questioning for the first time. The classroom management system is visibly embedded.',
     'Mr. Carter delivered a strong differentiated lesson with systematic student participation and efficient transitions. The classroom routine chart has measurably improved management and the shift to higher-order questioning reflects genuine instructional growth.',
     false,'acknowledged'),

    ('00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000010','2026-05-05',
     'formal','collaborative','English III PreAP','204',
     '{"classroom_environment":5,"instruction":5,"planning":5,"student_engagement":5,"professional_responsibilities":5}',
     '{"lesson_overview":"Co-taught with Thomas Reed. The objective — ''Students will construct and defend a literary argument using the PEEL structure with peer critique'' — was posted, verbally stated, and referenced three separate times during the lesson by both teachers. Students were asked to self-assess against the objective on an exit ticket. Every exit ticket reviewed showed accurate self-reflection. One student wrote: ''I think I got the Point and Evidence parts but my Explanation needs more depth.'' That level of metacognitive awareness in a junior English class is rare.","lesson_structure":"The collaborative model was seamlessly divided: Mr. Carter facilitated the mini-lesson on PEEL structure (8 min), Mr. Reed managed group rotations (20 min), and they co-facilitated the full-class share-out (12 min). The handoffs were invisible — students barely registered that a different teacher was leading.","student_participation":"100% participation confirmed via exit ticket — every student submitted a completed written claim. During the share-out, 11 students volunteered to read their claim aloud. The quality of peer critique was exceptional: ''Your evidence is good but your explanation assumes the reader already agrees with you'' — one peer comment recorded verbatim.","questioning_strategies":"Both teachers used Bloom levels 4-6 throughout. Mr. Carter: ''If you removed the evidence from your argument and kept only the claim, would the reader still be persuaded? Why or why not?'' Mr. Reed: ''What would a reader who disagreed with your claim say, and how does your argument account for that?''","classroom_management":"Zero off-task behavior observed across 40 minutes. The routines are so embedded at this point that management is essentially invisible.","technology_integration":"Students used a shared Google Doc for peer critique. Each student''s claim paragraph was visible to their assigned peer reviewer, who left written comments in real time. Mr. Carter projected one student''s document (with permission) to model constructive critique for the class."}',
     'This was the finest co-taught lesson I have observed in my career at Westridge. Mr. Carter and Mr. Reed operated as a single instructional unit, students demonstrated genuine literary reasoning, and the exit ticket data confirmed universal mastery.',
     'Mr. Carter co-delivered an exceptional lesson demonstrating distinguished performance across all five domains. The collaborative model produced outstanding student discourse and universal participation. This lesson should serve as a school-wide model.',
     false,'acknowledged')
    """)

    # ── Maria Lopez observations ───────────────────────────────────────────────
    cur.execute("""INSERT INTO observations (teacher_id, observer_id, observed_at, observation_type, framework, course_name, room, scores, section_notes, raw_notes, ai_summary, flagged, status) VALUES
    ('00000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000010','2026-02-20',
     'formal','collaborative','AP Literature','112',
     '{"classroom_environment":5,"instruction":5,"planning":5,"student_engagement":5,"professional_responsibilities":5}',
     '{"lesson_overview":"The Socratic seminar was structured around the central question: ''In The Handmaid''s Tale, does Offred''s survival constitute resistance or complicity?'' Ms. Lopez posted this question three days in advance and asked students to arrive with at least three textual references prepared. Every student I spoke to before class could articulate their position and cite specific passages. The preparation structure alone reflects distinguished planning.","lesson_structure":"Ms. Lopez opened with a 3-minute grounding reminder of Socratic norms — no interrupting, build on others'' ideas, cite evidence before making claims — and then said, ''It''s yours.'' For the next 44 minutes, she spoke fewer than 10 times. Students self-selected speakers, managed the discussion flow, and redirected each other when claims lacked evidence.","student_participation":"All 22 students contributed at least one substantive comment. I tracked contribution count and no student spoke more than 4 times, suggesting Ms. Lopez had explicitly coached equitable participation in advance. One student who rarely speaks in other classes delivered a two-minute analysis comparing Offred''s actions to Hannah Arendt''s concept of the ''banality of evil.'' The room went quiet. Other students asked follow-up questions unprompted.","questioning_strategies":"Ms. Lopez''s interventions were exclusively facilitative: ''Can someone push back on that?'' and ''Does the text support that reading or are we projecting?'' She never answered a question — she redirected every question back to the group. This is a masterclass in Socratic facilitation.","classroom_management":"The seminar circle was arranged before students arrived. Name tents identified each speaker. Norms were on the board. Not a single behavioral issue in 47 minutes.","special_needs":"Two ESL students (recently reclassified) participated fully. Ms. Lopez had provided them with a graphic organizer pre-filled with their prepared quotes the day before, which allowed them to enter the discussion with confidence rather than searching for references in real time."}',
     'This was not a good lesson. This was an extraordinary lesson. The level of student-driven intellectual discourse I observed — juniors debating Hannah Arendt in relation to Atwood without being prompted — is what AP Literature is supposed to produce.',
     'Ms. Lopez facilitated a masterful Socratic seminar in which students self-directed discussion with minimal teacher intervention. Evidence-based peer discourse at this level reflects exceptional instructional development over time.',
     false,'acknowledged'),

    ('00000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000010','2026-05-02',
     'formal','collaborative','AP Literature','112',
     '{"classroom_environment":5,"instruction":5,"planning":5,"student_engagement":5,"professional_responsibilities":5}',
     '{"lesson_overview":"Student-led review panels for the AP exam. Each of six groups was assigned a different literary concept and tasked with presenting a 5-minute synthesis panel and fielding three questions from the class. Ms. Lopez''s only instruction: ''Teach us something we don''t know yet.'' The bar was set high and every group met it.","lesson_structure":"Panel presentations rotated across 40 minutes. Ms. Lopez circulated with a clipboard but never intervened. At the end, she asked each panel one follow-up question — each one designed to push the panel beyond what they had prepared.","student_participation":"Every student presented, every student fielded at least one peer question, and every student asked at least one question of another panel. 100% active participation for 50 minutes without it feeling forced.","questioning_strategies":"Peer questions were remarkable: ''You said Conrad uses darkness as a symbol of moral ambiguity, but couldn''t the same imagery be read as colonial fear of the Other? How do you account for that reading?'' This was a student question. Ms. Lopez''s follow-up questions pushed even further.","professional_responsibilities":"Ms. Lopez circulated with a rubric she designed herself — a four-point scale assessing clarity of claim, quality of evidence, depth of analysis, and responsiveness to peer questions. She had already shared this rubric with students two weeks earlier.","classroom_management":"Six panel groups rotating through 50 minutes with zero management issues. The culture of this classroom is its own management system."}',
     'Another peak performance observation. Ms. Lopez is operating at a level that I will use as the standard for instructional excellence at this school.',
     'Ms. Lopez facilitated student-led review panels with universal participation and evidence-based peer questioning. Her instructional presence here is that of a master coach. A flawless observation.',
     false,'acknowledged')
    """)

    # ── David Kim observations ─────────────────────────────────────────────────
    cur.execute("""INSERT INTO observations (teacher_id, observer_id, observed_at, observation_type, framework, course_name, room, scores, section_notes, raw_notes, ai_summary, flagged, status) VALUES
    ('00000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000010','2026-01-22',
     'formal','direct_instruction','Algebra I','318',
     '{"classroom_environment":1,"instruction":2,"planning":2,"student_engagement":2,"professional_responsibilities":2}',
     '{"lesson_overview":"No learning objective was posted on the board. When I arrived, the projector showed a blank slide with the date. I asked Mr. Kim before class what the lesson goal was; he said ''We''re reviewing linear equations'' but could not articulate what students would be able to do by the end. There is a significant gap between planning documentation and classroom execution.","lesson_structure":"The lesson had no discernible structure. Mr. Kim wrote three equations on the board and began solving them while narrating. After 12 minutes, he asked students to ''try one on their own'' but did not specify which problem or provide guidance on where to start. Three students opened their notebooks; the rest did nothing.","student_participation":"Of 28 students, I observed active on-task behavior from approximately 6 (front two rows). Three students were sleeping — one with his head on the desk for the entire 47 minutes. Two students were on their phones continuously.","questioning_strategies":"The only questions observed were procedural: ''Does anyone know what to do next?'' and ''Who can tell me what this equals?'' Both were answered by the same two students. No higher-order questions were attempted.","classroom_management":"Mr. Kim raised his voice twice — once when a student talked over him, and once when a student loudly asked another for a pencil. Both verbal escalations had no visible effect; the behavior continued. There is no posted routine chart, no behavioral signal system, and no evidence of established classroom norms.","time_management":"The bell rang while Mr. Kim was still mid-problem on the board. No closure, no summary, no exit ticket. Students began packing up 5 minutes before the bell and Mr. Kim did not redirect them."}',
     'This observation requires an urgent follow-up conversation. Three sleeping students, two on phones, only six actively on task. There is no classroom management system in place. Mr. Kim will be placed on a structured coaching plan beginning next week.',
     'Mr. Kim''s first observed lesson raised urgent concerns across all domains. The absence of posted objectives, multiple disengaged students, and ineffective behavioral responses indicate an immediate need for structured coaching intervention.',
     true,'submitted'),

    ('00000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000010','2026-03-14',
     'formal','direct_instruction','Algebra I','318',
     '{"classroom_environment":2,"instruction":3,"planning":3,"student_engagement":2,"professional_responsibilities":3}',
     '{"lesson_overview":"An objective was posted for the first time: ''I can solve two-step linear equations and check my solution.'' Mr. Kim read it aloud at the start of class. When I asked two students what they were supposed to be able to do, both could restate the objective. This is genuine progress.","lesson_structure":"Mr. Kim followed a cleaner instructional sequence: a worked example on the board (8 min), a guided problem in pairs (10 min), and independent practice (15 min). The structure is present but execution is uneven. Transition from pairs to independent work was disorganized — four minutes elapsed before everyone settled.","student_participation":"Approximately 13 of 28 students were on task during independent practice. The routine chart is on the board but was not referenced during class. Mr. Kim redirected a phone use incident calmly this time, without raising his voice. That is a meaningful behavioral change.","questioning_strategies":"Mr. Kim used slightly better questioning: ''Before you solve, what''s your first step and why?'' This is approaching Bloom level 3. Most questions were still recall-level, but the deliberate ''why'' prompt is an improvement.","classroom_management":"Fewer disruptions than January, but management remains a primary concern. The routine chart exists but is not yet functional — it needs to be explicitly taught, not simply posted.","time_management":"The lesson ended with 3 minutes of closure — Mr. Kim asked students to write one thing they understood and one thing they were still confused about on a sticky note. He collected them. This is the first evidence of formative assessment I have observed."}',
     'Meaningful improvement since January. The objective is posted and communicated, the lesson has a discernible structure, and Mr. Kim is making better behavioral choices. Continuing bi-weekly coaching sessions.',
     'Mr. Kim demonstrated meaningful improvement in lesson planning with a clearly communicated objective and the introduction of a routine chart. Classroom management and student engagement remain significant developmental priorities.',
     true,'submitted'),

    ('00000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000010','2026-05-06',
     'formal','5e','Algebra I','318',
     '{"classroom_environment":3,"instruction":4,"planning":4,"student_engagement":3,"professional_responsibilities":3}',
     '{"lesson_overview":"Mr. Kim posted a two-part objective: ''I can set up and solve a system of equations from a word problem'' and ''I can explain my solution process to a partner.'' Both parts were written in student-friendly language. When I asked four students what they were learning, all four could restate the objective, and two volunteered the connection to the upcoming STAAR benchmark.","lesson_structure":"The 5E model was implemented with confidence. Engage (4 min): a relatable word problem about buying concert tickets — students were immediately interested. Explore (10 min): pairs worked to identify unknowns. Explain (8 min): Mr. Kim used student work from Explore to anchor the explanation. Elaborate (12 min): groups solved a harder application problem. Evaluate (4 min): each student explained to a partner.","student_participation":"Full group participation during Elaborate — all 28 students engaged. Exit ticket results: 22 of 28 students correctly set up and solved the system (79% mastery). Four months ago I would not have predicted this outcome.","questioning_strategies":"Mr. Kim asked: ''Marcus set up his equations differently than the board — is his method also correct? How do we know?'' This invited analytical comparison. Three students engaged with Marcus''s method and concluded it was valid. Bloom level 4.","classroom_management":"Three disruptions handled calmly — no voice raising, no phone incidents. The routines are embedded enough to support collaborative work now.","time_management":"All 5E phases completed with time for closure. The exit ticket was administered and collected with 2 minutes to spare."}',
     'This is Mr. Kim''s strongest observation of the year. The 5E structure was executed with genuine skill, 79% mastery on the exit ticket is a real academic result, and classroom management has reached a level that allows collaborative learning to function. The improvement plan is being formally closed.',
     'Mr. Kim delivered his strongest observed lesson, executing the 5E framework with confidence and achieving 79% mastery on the exit ticket. Classroom management was notably calm and effective. This observation marks a clear positive inflection.',
     false,'submitted')
    """)

    # ── Priya Nair observations ────────────────────────────────────────────────
    cur.execute("""INSERT INTO observations (teacher_id, observer_id, observed_at, observation_type, framework, course_name, room, scores, section_notes, raw_notes, ai_summary, flagged, status) VALUES
    ('00000000-0000-0000-0000-000000000014','00000000-0000-0000-0000-000000000010','2026-01-28',
     'formal','direct_instruction','Geometry PreAP','221',
     '{"classroom_environment":4,"instruction":4,"planning":4,"student_engagement":3,"professional_responsibilities":4}',
     '{"lesson_overview":"Objective clearly posted: ''Students will prove triangle congruence using SSS and SAS postulates with formal two-column proofs.'' Ms. Nair restated it verbally and connected it to the upcoming unit assessment. The lesson plan was well-structured and submitted on time.","lesson_structure":"Direct instruction with a strong I Do phase — Ms. Nair walked through two complete proofs on the board, narrating her thinking clearly. The We Do phase involved students completing a proof while Ms. Nair worked through it simultaneously. The structure is sound; the weakness is in how participation is distributed.","student_participation":"Participation is heavily clustered. I tracked student responses during the I Do and We Do phases: 7 of 26 students answered questions or volunteered. The remaining 19 were compliant but not verbally engaged. When I asked Ms. Nair after class about her strategy for reaching quieter students, she said ''they seem to understand'' — which is not the same as verifying understanding.","questioning_strategies":"Questions were primarily closed: ''What theorem are we applying here?'' and ''What goes in statement 3?'' These are recall-level (Bloom 1-2). The missed opportunity is in leveraging content knowledge to push students to reason rather than recall.","classroom_management":"Excellent. The room is organized, expectations are clear, and students comply immediately. Transitions take under 60 seconds. Ms. Nair''s classroom management is already at a proficient-to-distinguished level.","time_management":"Lesson completed with 4 minutes of structured closure. Students reviewed one proof with a partner and identified any errors. Professional pacing throughout."}',
     'Ms. Nair runs an excellent classroom. The instruction is clear, the content is rigorous, and the management is seamless. The one consistent area for development is student participation — too many students are passively compliant rather than actively engaged.',
     'Ms. Nair delivered confident and well-aligned instruction with strong planning evident throughout. Student participation was unequally distributed and questioning remained at lower Bloom levels. Broader engagement strategies are the clear developmental focus.',
     false,'submitted'),

    ('00000000-0000-0000-0000-000000000014','00000000-0000-0000-0000-000000000010','2026-05-04',
     'formal','collaborative','Geometry PreAP','221',
     '{"classroom_environment":5,"instruction":5,"planning":5,"student_engagement":5,"professional_responsibilities":5}',
     '{"lesson_overview":"Student-led review tournament structured as a team competition. Each of four teams designed five review questions covering the semester''s content, swapped question sets with another team, and competed to answer them under timed conditions. Ms. Nair''s instructions: ''Your questions have to be hard enough to challenge the other team but answerable with what we''ve studied. If your question is too easy or has an error, your team loses a point.'' This constraint forced students to think like teachers.","lesson_structure":"Question design phase (15 min): teams collaborated to write five questions with answer keys. Ms. Nair circulated and rejected four questions that were too easy or contained errors. Competition phase (20 min): teams exchanged sets and worked under a visible 2-minute timer per question. Debrief phase (10 min): disputed answers argued in front of the class.","student_participation":"Every student was engaged for all 45 minutes. During the debrief, students argued mathematical positions in front of the class voluntarily. One student challenged Ms. Nair''s ruling with a legitimate counterargument; she paused, reconsidered, and changed her ruling. The class erupted.","questioning_strategies":"Ms. Nair''s questions during the debrief: ''Your team says the answer is 42 degrees — walk us through every step of your proof, including which theorem you used and why it applies here.'' One student gave an incorrect justification; Ms. Nair did not correct it but asked the class, ''Does everyone agree with that reasoning?'' Three students immediately identified the error.","professional_responsibilities":"The question sets designed by students were collected by Ms. Nair at the end of class to identify gaps in understanding before the final exam. The activity generated both engagement and diagnostic data simultaneously.","classroom_management":"The competitive structure created energy that could have become disruptive but did not. Ms. Nair enforced tournament rules consistently — one team lost a point for a procedural violation and accepted it without protest."}',
     'Priya has completely transformed her approach to student engagement since January. The student-led tournament today was the best geometry lesson I have ever observed. Students were designing questions, arguing proofs, and challenging my rulings.',
     'Ms. Nair facilitated a student-designed review tournament in which every student authored and presented questions with peers providing specific feedback. This represents distinguished performance and a remarkable semester-long growth arc.',
     false,'acknowledged')
    """)

    # ── Thomas Reed observations ───────────────────────────────────────────────
    cur.execute("""INSERT INTO observations (teacher_id, observer_id, observed_at, observation_type, framework, course_name, room, scores, section_notes, raw_notes, ai_summary, flagged, status) VALUES
    ('00000000-0000-0000-0000-000000000015','00000000-0000-0000-0000-000000000010','2026-01-30',
     'formal','direct_instruction','World History','105',
     '{"classroom_environment":2,"instruction":2,"planning":2,"student_engagement":3,"professional_responsibilities":2}',
     '{"lesson_overview":"No learning objective was posted. Mr. Reed explained verbally that ''today we''re talking about the causes of WWI'' but did not connect this to a measurable student outcome. The enthusiasm Mr. Reed brings to the content is genuine and noticeable — students are responsive to his energy — but energy is not a substitute for instructional clarity.","lesson_structure":"Mr. Reed began with a story about the assassination of Franz Ferdinand that was genuinely compelling — students were leaning in. However, the narrative ran 18 minutes without a student task or accountability structure. When he transitioned to a primary source document, he had 15 minutes left and the main activity required 25 minutes. The bell rang with students mid-task.","student_participation":"Participation during the story was actually high — students were asking questions spontaneously. This suggests strong rapport and genuine student interest. The problem is that this participation was unstructured — when the activity began, engagement dropped significantly because the task was ambiguous.","classroom_management":"Transitions were chaotic. When Mr. Reed asked students to get out their maps, it took 7 minutes and involved students borrowing materials, three students leaving to get pencils, and ongoing side conversations. No transition signal, no established routine.","time_management":"The lesson ended with students mid-activity. No closure, no connection back to the learning goal. Mr. Reed needs to plan with the clock in mind, not add time estimates after planning the content."}',
     'Thomas has real gifts as a teacher — the story he told about Franz Ferdinand had 28 teenagers genuinely riveted. But gifts without structure produce chaotic classrooms and incomplete lessons. Coaching starts next week.',
     'Mr. Reed demonstrated genuine enthusiasm for his subject but lacked the foundational planning and management structures needed for effective instruction. Immediate structured coaching support should begin.',
     false,'submitted'),

    ('00000000-0000-0000-0000-000000000015','00000000-0000-0000-0000-000000000010','2026-05-05',
     'formal','collaborative','World History','105',
     '{"classroom_environment":4,"instruction":4,"planning":4,"student_engagement":4,"professional_responsibilities":4}',
     '{"lesson_overview":"Co-taught with James Carter. The objective — ''Students will analyze primary source evidence to construct a historical argument about the causes of WWII'' — was posted, verbally stated, and tied to the AP World History framework. Mr. Reed told students: ''By the end of today you''re going to have a written argument that you could defend in a Socratic seminar. That''s the bar.''","lesson_structure":"Mr. Reed led the Explore and Elaborate phases independently while Mr. Carter circulated and supported. Explore (15 min): groups analyzed one of four primary sources and completed a structured annotation guide. Elaborate (20 min): groups shared their analysis and built a joint claim paragraph. Share-out (10 min): four groups presented claims; class challenged with counterevidence.","student_participation":"Full group engagement during Explore and Elaborate. Students challenged each other with specific evidence: ''Your claim says economic depression caused rearmament, but our source shows rearmament started before the depression deepened — how do you account for that?'' Mr. Reed fielded this by redirecting to the class rather than answering himself.","classroom_management":"Mr. Reed managed 32 students in collaborative groups across 45 minutes without a single management incident. The anchor routines he established in February are so embedded that he barely references them — students self-regulate.","questioning_strategies":"Mr. Reed''s questions during Elaborate: ''If you had to argue the opposite position using only the evidence in front of you, what would you say?'' This is Bloom level 6 — it requires students to construct an argument they may disagree with. Four months ago his questions were exclusively recall-level.","student_interaction":"Students cited specific documents, challenged each other''s interpretations, and built on prior comments. One student said: ''I want to go back to what Marcus said about the Treaty of Versailles — I think he''s right but for a different reason.'' Building on prior comments is a seminar skill that takes months to develop."}',
     'Thomas Reed has grown more in one semester than most teachers grow in two years. The co-teaching session today was a genuine partnership. He managed 32 students, generated historical discourse I expect in an AP classroom, and never needed James for the phases he led.',
     'Mr. Reed co-taught confidently alongside Mr. Carter, independently leading two lesson phases with a class of 32. His management and instructional delivery have both improved dramatically.',
     false,'submitted')
    """)

    # ── Performance Reviews ────────────────────────────────────────────────────
    cur.execute("""
        INSERT INTO performance_reviews (teacher_id, reviewer_id, period, category_scores, final_notes, status, ai_summary) VALUES
        ('00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000010','Spring 2026',
         '{"instructional_effectiveness":5,"classroom_management":5,"student_engagement":4,"professional_responsibilities":5,"growth_and_improvement":5}',
         'James Carter has delivered one of the strongest semesters I have observed in my tenure at Westridge. He entered the year with solid foundational skills and a genuine willingness to grow, and over six months he has become one of the most capable instructors in the building. His progression from the January observation — where participation was clustered and transitions were slow — to the May co-teaching lesson, which I am recommending as a school-wide model, reflects the kind of intentional, reflective development that defines professional excellence. Beyond his own classroom, James voluntarily took on the mentorship of Thomas Reed, designed a co-teaching lesson plan from scratch, and attended district PD on his own time. He has earned a Teacher of the Year nomination and I am submitting it this week.',
         'complete',
         'Mr. Carter achieved distinguished performance across all five dimensions in Spring 2026. His instructional growth arc, peer mentorship of Mr. Reed, and co-taught model lesson represent the highest form of professional contribution. A Teacher of the Year nomination is strongly merited.'),

        ('00000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000010','Spring 2026',
         '{"instructional_effectiveness":5,"classroom_management":5,"student_engagement":5,"professional_responsibilities":5,"growth_and_improvement":5}',
         'Maria Lopez is the finest educator I have had the privilege of evaluating in my career. Every observation this semester was a masterclass. She does not teach to compliance — she teaches to independence. Her Socratic seminar in February was the best single lesson I have observed at this school. She led our school-wide PD session, informally mentored two colleagues, and has been nominated for an instructional coaching role at the district level.',
         'complete',
         'Ms. Lopez achieved perfect scores across all five dimensions in Spring 2026. Her leadership of school-wide professional development and informal mentorship of colleagues extends her impact well beyond her own classroom. A district-level instructional coaching recommendation is in progress.'),

        ('00000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000010','Spring 2026',
         '{"instructional_effectiveness":3,"classroom_management":3,"student_engagement":3,"professional_responsibilities":3,"growth_and_improvement":4}',
         'David Kim''s semester has been a story of genuine, hard-earned growth. He entered the year with significant concerns across all domains — the January observation documented three sleeping students, no posted objective, and ineffective classroom management. What followed was a semester of consistent coaching engagement, visible implementation of feedback, and measurable improvement in every domain. His May observation — 79% exit ticket mastery, 5E structure executed with skill, zero voice raising — would not have seemed possible in January. The improvement plan is formally closed.',
         'pending_signoff',
         'Mr. Kim demonstrated meaningful growth across all dimensions in Spring 2026, with his May observation marking a clear positive inflection. His consistent responsiveness to coaching warrants a growth score of 4, and the structured improvement plan is being formally closed.'),

        ('00000000-0000-0000-0000-000000000014','00000000-0000-0000-0000-000000000010','Spring 2026',
         '{"instructional_effectiveness":5,"classroom_management":4,"student_engagement":5,"professional_responsibilities":4,"growth_and_improvement":5}',
         'Priya Nair has undergone one of the most impressive instructional transformations I have observed. She entered the semester as a technically strong teacher with a significant blind spot — passive student participation — and she addressed it with a deliberate, sustained commitment that produced extraordinary results. The student-led tournament in May, where students were designing proof questions and challenging my rulings with counterarguments, was a level of mathematical engagement that would be exceptional in any classroom.',
         'pending_signoff',
         'Ms. Nair delivered one of the most impressive growth arcs of the semester, transforming student engagement from a persistent weakness to a distinguished strength. Her student-designed review tournament in May stands as a model of instructional innovation.'),

        ('00000000-0000-0000-0000-000000000015','00000000-0000-0000-0000-000000000010','Spring 2026',
         '{"instructional_effectiveness":4,"classroom_management":4,"student_engagement":4,"professional_responsibilities":3,"growth_and_improvement":5}',
         'Thomas Reed is a first-year teacher and I am giving him a growth score of 5. That is not a mistake. The arc from January to May is extraordinary: from no posted objective, chaotic transitions, and a lesson that ended mid-activity, to co-teaching a collaborative lesson with full student participation, higher-order questioning, and zero management incidents. He sought feedback after every observation, implemented suggestions within days, and maintained a disposition of genuine openness to coaching. I am formally assigning him a mentor for next year.',
         'draft',
         'Mr. Reed''s Spring 2026 review reflects exceptional growth velocity for a first-year teacher. His co-teaching session with Mr. Carter was a standout moment, and his growth score of 5 reflects one of the most impressive developmental arcs of the academic year.')
    """)

    # ── Staff Notes ────────────────────────────────────────────────────────────
    cur.execute("""
        INSERT INTO staff_notes (teacher_id, author_id, content, tag, pinned) VALUES
        ('00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000010',
         'James volunteered to mentor Thomas Reed without being asked. When I proposed it he said immediately, ''I was going to ask you about that.'' This kind of proactive leadership instinct is rare and should be formally recognized.','commendation',true),
        ('00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000010',
         'James attended the district differentiated instruction PD on a Saturday on his own time and came back with three concrete strategies he implemented the following Monday. That kind of transfer speed is exceptional.','pd',false),
        ('00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000010',
         'Checked in with James about the mentoring load. He said he is managing but mentioned he has been staying until 6pm most nights. His own planning is not suffering but worth monitoring.','coaching',false),
        ('00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000010',
         'A parent called to specifically commend James for how he handled a conflict between two students. She said he pulled both students aside, listened without judgment, and helped them resolve it themselves. That is the kind of relational maturity that cannot be taught in a PD session.','commendation',false),

        ('00000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000010',
         'Maria was recognized at the district level for literacy program outcomes. I shared the news at the staff meeting and she received a standing ovation. She looked genuinely embarrassed, which is somehow the best part.','commendation',true),
        ('00000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000010',
         'Maria delivered the school-wide cooperative learning PD session. 47 staff members attended. End-of-session survey: 100% rated it as excellent. Three teachers have already asked to observe her classroom.','pd',false),
        ('00000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000010',
         'Maria expressed interest in an instructional coaching role at the district level. I forwarded her CV to the district HR director with a personal letter. She does not know I did this yet.','general',false),

        ('00000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000010',
         'Received a parent complaint about unclear homework instructions — the same assignment sent home two weeks in a row with different answers marked correct. Met with David and he acknowledged the error immediately.','concern',true),
        ('00000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000010',
         'David attended the optional classroom management workshop without being asked — the one I specifically did not require him to attend, to see if he would go on his own. He went. He sent me a follow-up email with three strategies he planned to try.','pd',false),
        ('00000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000010',
         'No parent complaints in April or May. Weekly emails going out every Friday — I checked three of them, all clear and professional. The improvement plan is being formally closed.','commendation',false),

        ('00000000-0000-0000-0000-000000000014','00000000-0000-0000-0000-000000000010',
         'Priya asked me after her February observation for resources on student engagement strategies. I sent her three research articles and a video series on gallery walk structures. She emailed back the next day with notes on each one.','coaching',false),
        ('00000000-0000-0000-0000-000000000014','00000000-0000-0000-0000-000000000010',
         'After the May tournament lesson, I asked five different students what they thought of math class this year. Four of them mentioned it as one of their favorite classes. One said ''Ms. Nair makes it feel like a game but then you realize you actually learned something.''','commendation',true),

        ('00000000-0000-0000-0000-000000000015','00000000-0000-0000-0000-000000000010',
         'Thomas emailed me two hours after his first observation to ask for feedback. He had already written a self-reflection identifying the same issues I was going to raise. That level of self-awareness in a first-year teacher is extraordinary.','commendation',false),
        ('00000000-0000-0000-0000-000000000015','00000000-0000-0000-0000-000000000010',
         'Thomas mentioned in our February check-in that he is staying until 7pm most nights planning. His dedication is not in question. Spoke to him about sustainable pacing — great teachers who burn out in year two help no one.','concern',false),
        ('00000000-0000-0000-0000-000000000015','00000000-0000-0000-0000-000000000010',
         'The co-teaching session with James went better than I anticipated. Thomas led two full lesson phases independently. Afterward, James told me privately that Thomas did not need him for those phases — he was there as a safety net that was never used.','commendation',true)
    """)

    # ── Goals ──────────────────────────────────────────────────────────────────
    cur.execute("""
        INSERT INTO goals (id, teacher_id, set_by, title, description, linked_dimension, evidence_type, target_date, status) VALUES
        ('00000000-0000-0000-0000-000000000020','00000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000010',
         'Raise Classroom Management to Proficient',
         'Implement three anchor routines with visible classroom anchors. Target: management score of 3 or above in next two formal observations.',
         'classroom_management','observation_score','2026-06-30','in_progress'),
        ('00000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000010',
         'Post and Communicate Objectives Daily',
         'Every lesson begins with a written I-can objective tied to a standard. Verbally communicated and verifiable by students on request.',
         'instructional_effectiveness','observation_score','2026-05-31','achieved'),
        ('00000000-0000-0000-0000-000000000022','00000000-0000-0000-0000-000000000014','00000000-0000-0000-0000-000000000010',
         'Achieve Distinguished Student Engagement',
         'Incorporate at least two interactive structures per lesson. Use a participation tracker to ensure equitable distribution. Target: engagement score of 4+ in all observations.',
         'student_engagement','observation_score','2026-06-15','achieved'),
        ('00000000-0000-0000-0000-000000000023','00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000010',
         'Complete First-Year Teacher Mentorship',
         'Bi-weekly check-ins and one co-teaching session for Thomas Reed. Submit mentorship reflection at end of semester.',
         'professional_responsibilities','reflection','2026-06-30','achieved'),
        ('00000000-0000-0000-0000-000000000024','00000000-0000-0000-0000-000000000015','00000000-0000-0000-0000-000000000010',
         'Develop Consistent Lesson Pacing',
         'Submit weekly lesson plans for admin review. Use a visible timer. Target: complete all planned phases within the period for 4 consecutive observations.',
         'planning_and_preparation','observation_score','2026-05-31','in_progress'),
        ('00000000-0000-0000-0000-000000000025','00000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000010',
         'Lead School-Wide Cooperative Learning PD',
         'Design and deliver a 90-minute PD session for all staff. Collect feedback and submit a written summary.',
         'professional_responsibilities','pd_certificate','2026-06-10','achieved'),
        ('00000000-0000-0000-0000-000000000026','00000000-0000-0000-0000-000000000015','00000000-0000-0000-0000-000000000010',
         'Establish Classroom Management Routines',
         'Implement three non-negotiable routines with visible anchor posters. Target: management score of 3+ in next formal observation.',
         'classroom_management','observation_score','2026-06-30','in_progress'),
        ('00000000-0000-0000-0000-000000000027','00000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000010',
         'Improve Parent Communication',
         'Send a weekly update email every Friday. Admin spot-checks monthly. Target: zero parent complaints for 8 consecutive weeks.',
         'professional_responsibilities','reflection','2026-06-30','achieved')
    """)

    cur.execute("""
        INSERT INTO goal_milestones (goal_id, description, due_date, completed) VALUES
        ('00000000-0000-0000-0000-000000000020','Post three anchor routine charts in visible locations','2026-02-28',true),
        ('00000000-0000-0000-0000-000000000020','Achieve management score of 3 in formal observation','2026-04-30',true),
        ('00000000-0000-0000-0000-000000000020','Achieve management score of 4 in formal observation','2026-06-30',false),
        ('00000000-0000-0000-0000-000000000022','Use participation tracker for one full week','2026-03-15',true),
        ('00000000-0000-0000-0000-000000000022','Achieve engagement score of 4 in formal observation','2026-04-30',true),
        ('00000000-0000-0000-0000-000000000022','Achieve engagement score of 5 in formal observation','2026-05-31',true),
        ('00000000-0000-0000-0000-000000000023','Complete first bi-weekly check-in','2026-02-15',true),
        ('00000000-0000-0000-0000-000000000023','Deliver shared lesson plan template','2026-03-01',true),
        ('00000000-0000-0000-0000-000000000023','Complete co-teaching session','2026-05-10',true),
        ('00000000-0000-0000-0000-000000000023','Submit mentorship reflection','2026-06-20',false),
        ('00000000-0000-0000-0000-000000000024','Submit first weekly lesson plan','2026-02-07',true),
        ('00000000-0000-0000-0000-000000000024','Complete lesson within bell for 2 consecutive observations','2026-04-30',true),
        ('00000000-0000-0000-0000-000000000024','Complete lesson within bell for 4 consecutive observations','2026-05-31',false),
        ('00000000-0000-0000-0000-000000000025','Submit PD agenda draft','2026-05-01',true),
        ('00000000-0000-0000-0000-000000000025','Run pilot session with volunteer teachers','2026-05-20',true),
        ('00000000-0000-0000-0000-000000000025','Deliver full school-wide PD session','2026-06-10',true)
    """)

    cur.execute("""
        INSERT INTO goal_updates (goal_id, author_id, content) VALUES
        ('00000000-0000-0000-0000-000000000020','00000000-0000-0000-0000-000000000013','Put up the routine chart today. Students actually read it before class started — a few asked me what the clap signal means. I showed them and they practiced it. First time I have had students interested in a management system.'),
        ('00000000-0000-0000-0000-000000000020','00000000-0000-0000-0000-000000000010','March formal observation confirmed classroom environment score of 3. The routine chart is functional and students are referencing it without being prompted. First milestone met.'),
        ('00000000-0000-0000-0000-000000000020','00000000-0000-0000-0000-000000000013','May observation was my best yet. The group activity ran without a single transition incident.'),
        ('00000000-0000-0000-0000-000000000022','00000000-0000-0000-0000-000000000014','Used the participation tracker for a full week. Eye-opening — I was calling on the same 7 students across all five periods. Adjusting seating and starting cold-calling next week.'),
        ('00000000-0000-0000-0000-000000000022','00000000-0000-0000-0000-000000000014','Gallery walk worked better than expected. Every student was on their feet, every student wrote at every station. Engagement score jumped to 4.'),
        ('00000000-0000-0000-0000-000000000022','00000000-0000-0000-0000-000000000010','May: student-designed tournament, engagement score of 5, students arguing mathematical positions voluntarily. Goal fully achieved and exceeded.'),
        ('00000000-0000-0000-0000-000000000023','00000000-0000-0000-0000-000000000011','First check-in with Thomas complete. He had already identified pacing and management as his two biggest challenges. Gave him my planning template and we walked through how I use it.'),
        ('00000000-0000-0000-0000-000000000023','00000000-0000-0000-0000-000000000011','Thomas used my lesson plan template the next day and texted me after class: ''I finished the lesson with 3 minutes to spare for the first time this year.'''),
        ('00000000-0000-0000-0000-000000000023','00000000-0000-0000-0000-000000000010','Co-teaching session completed May 5. Thomas led two phases independently and did not need James for either. Goal achieved.'),
        ('00000000-0000-0000-0000-000000000024','00000000-0000-0000-0000-000000000015','Submitted my first weekly plan. Dr. Mitchell sent back written feedback with two suggestions. Implemented both the following Monday.'),
        ('00000000-0000-0000-0000-000000000024','00000000-0000-0000-0000-000000000015','Finished within bell time for two consecutive lessons. The timer is the difference — students actually respond to the countdown.'),
        ('00000000-0000-0000-0000-000000000025','00000000-0000-0000-0000-000000000012','Pilot session delivered. Teachers loved the jigsaw structure. Ready for the full staff session.'),
        ('00000000-0000-0000-0000-000000000025','00000000-0000-0000-0000-000000000010','Full PD delivered. 100% positive feedback. Goal complete.'),
        ('00000000-0000-0000-0000-000000000027','00000000-0000-0000-0000-000000000013','Sent first weekly parent email. One parent replied to say thank you. That has never happened before.'),
        ('00000000-0000-0000-0000-000000000027','00000000-0000-0000-0000-000000000010','Eight consecutive weeks with no parent complaints. Improvement plan formally closed.')
    """)

    conn.commit()
    cur.close()
    conn.close()
    print("Seeded successfully.")