from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import psycopg2.extras
import json

from database import get_conn, init_db, seed_db
from ai import observation_summary, staff_summary, goal_recommendations

app = FastAPI(title="K-12 Staff Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()
    seed_db()


# ── Pydantic models ───────────────────────────────────────────────────────────

class ObservationCreate(BaseModel):
    teacher_id: str
    observer_id: str
    observed_at: str
    scores: dict
    raw_notes: Optional[str] = ""

class ReviewCreate(BaseModel):
    teacher_id: str
    reviewer_id: str
    period: str
    category_scores: dict
    final_notes: Optional[str] = ""

class NoteCreate(BaseModel):
    teacher_id: str
    author_id: str
    content: str
    tag: str

class GoalCreate(BaseModel):
    teacher_id: str
    set_by: str
    title: str
    description: Optional[str] = ""
    target_date: Optional[str] = None

class GoalUpdate(BaseModel):
    status: Optional[str] = None
    progress_note: Optional[str] = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def fetchall(query, params=None):
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(query, params)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [dict(r) for r in rows]

def fetchone(query, params=None):
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(query, params)
    row = cur.fetchone()
    cur.close()
    conn.close()
    return dict(row) if row else None

def execute(query, params=None):
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(query, params)
    row = cur.fetchone() if cur.description else None
    conn.commit()
    cur.close()
    conn.close()
    return dict(row) if row else None


# ── Dashboard ─────────────────────────────────────────────────────────────────

@app.get("/dashboard")
def get_dashboard():
    observations_this_month = fetchone(
        "SELECT COUNT(*) as count FROM observations WHERE DATE_TRUNC('month', observed_at) = DATE_TRUNC('month', CURRENT_DATE)"
    )["count"]
    pending_reviews = fetchone(
        "SELECT COUNT(*) as count FROM performance_reviews WHERE status = 'draft'"
    )["count"]
    open_goals = fetchone(
        "SELECT COUNT(*) as count FROM goals WHERE status != 'achieved'"
    )["count"]
    flagged_staff = fetchall(
        """
        SELECT DISTINCT u.id, u.name
        FROM observations o
        JOIN users u ON u.id = o.teacher_id
        WHERE o.flagged = true
        AND o.observed_at >= CURRENT_DATE - INTERVAL '30 days'
        """
    )
    recent_observations = fetchall(
        """
        SELECT o.id, o.observed_at, o.scores, o.flagged,
               t.name as teacher_name
        FROM observations o
        JOIN users t ON t.id = o.teacher_id
        ORDER BY o.created_at DESC LIMIT 5
        """
    )
    return {
        "observations_this_month": observations_this_month,
        "pending_reviews": pending_reviews,
        "open_goals": open_goals,
        "flagged_staff": flagged_staff,
        "recent_observations": recent_observations,
    }


# ── Staff ─────────────────────────────────────────────────────────────────────

@app.get("/staff")
def list_staff():
    return fetchall(
        "SELECT id, name, email, role FROM users WHERE role = 'teacher' ORDER BY name"
    )

@app.get("/staff/{teacher_id}")
def get_staff(teacher_id: str):
    teacher = fetchone("SELECT * FROM users WHERE id = %s", (teacher_id,))
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    observations = fetchall(
        "SELECT * FROM observations WHERE teacher_id = %s ORDER BY observed_at DESC",
        (teacher_id,)
    )
    reviews = fetchall(
        "SELECT * FROM performance_reviews WHERE teacher_id = %s ORDER BY created_at DESC",
        (teacher_id,)
    )
    notes = fetchall(
        "SELECT * FROM staff_notes WHERE teacher_id = %s ORDER BY created_at DESC",
        (teacher_id,)
    )
    goals = fetchall(
        "SELECT * FROM goals WHERE teacher_id = %s ORDER BY created_at DESC",
        (teacher_id,)
    )
    for goal in goals:
        goal["updates"] = fetchall(
            "SELECT * FROM goal_updates WHERE goal_id = %s ORDER BY created_at ASC",
            (goal["id"],)
        )

    return {
        "teacher": teacher,
        "observations": observations,
        "reviews": reviews,
        "notes": notes,
        "goals": goals,
    }

@app.get("/staff/{teacher_id}/summary")
def get_staff_summary(teacher_id: str):
    teacher = fetchone("SELECT * FROM users WHERE id = %s", (teacher_id,))
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    observations = fetchall("SELECT * FROM observations WHERE teacher_id = %s", (teacher_id,))
    reviews = fetchall("SELECT * FROM performance_reviews WHERE teacher_id = %s", (teacher_id,))
    notes = fetchall("SELECT * FROM staff_notes WHERE teacher_id = %s", (teacher_id,))
    goals = fetchall("SELECT * FROM goals WHERE teacher_id = %s", (teacher_id,))

    summary = staff_summary(teacher["name"], observations, reviews, notes, goals)
    return {"summary": summary}


# ── Observations ──────────────────────────────────────────────────────────────

@app.post("/observations")
def create_observation(body: ObservationCreate):
    try:
        summary, flagged = observation_summary(body.scores, body.raw_notes or "")
    except Exception:
        summary, flagged = "", False

    row = execute(
        """
        INSERT INTO observations (teacher_id, observer_id, observed_at, scores, raw_notes, ai_summary, flagged)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING *
        """,
        (body.teacher_id, body.observer_id, body.observed_at,
         json.dumps(body.scores), body.raw_notes, summary, flagged)
    )
    return row

@app.get("/observations/{observation_id}")
def get_observation(observation_id: str):
    row = fetchone("SELECT * FROM observations WHERE id = %s", (observation_id,))
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    return row


# ── Reviews ───────────────────────────────────────────────────────────────────

@app.get("/reviews/suggestions")
def get_review_suggestions(teacher_id: str):
    teacher = fetchone("SELECT * FROM users WHERE id = %s", (teacher_id,))
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    observations = fetchall(
        "SELECT scores FROM observations WHERE teacher_id = %s ORDER BY observed_at DESC LIMIT 5",
        (teacher_id,)
    )
    scores_list = [o["scores"] for o in observations]
    try:
        suggestions = goal_recommendations(teacher["name"], scores_list)
    except Exception:
        suggestions = []
    return {"suggestions": suggestions}

@app.post("/reviews")
def create_review(body: ReviewCreate):
    teacher = fetchone("SELECT * FROM users WHERE id = %s", (body.teacher_id,))
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    observations = fetchall(
        "SELECT * FROM observations WHERE teacher_id = %s", (body.teacher_id,)
    )
    try:
        ai_sum = staff_summary(teacher["name"], observations, [], [], [])
    except Exception:
        ai_sum = ""

    row = execute(
        """
        INSERT INTO performance_reviews (teacher_id, reviewer_id, period, category_scores, final_notes, status, ai_summary)
        VALUES (%s, %s, %s, %s, %s, 'draft', %s)
        RETURNING *
        """,
        (body.teacher_id, body.reviewer_id, body.period,
         json.dumps(body.category_scores), body.final_notes, ai_sum)
    )
    return row

@app.patch("/reviews/{review_id}/submit")
def submit_review(review_id: str):
    row = execute(
        "UPDATE performance_reviews SET status = 'submitted' WHERE id = %s RETURNING *",
        (review_id,)
    )
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    return row

@app.patch("/reviews/{review_id}/acknowledge")
def acknowledge_review(review_id: str):
    row = execute(
        "UPDATE performance_reviews SET status = 'acknowledged' WHERE id = %s RETURNING *",
        (review_id,)
    )
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    return row


# ── Notes ─────────────────────────────────────────────────────────────────────

@app.post("/notes")
def create_note(body: NoteCreate):
    row = execute(
        """
        INSERT INTO staff_notes (teacher_id, author_id, content, tag)
        VALUES (%s, %s, %s, %s)
        RETURNING *
        """,
        (body.teacher_id, body.author_id, body.content, body.tag)
    )
    return row

@app.get("/notes")
def get_notes(teacher_id: str):
    return fetchall(
        "SELECT * FROM staff_notes WHERE teacher_id = %s ORDER BY created_at DESC",
        (teacher_id,)
    )


# ── Goals ─────────────────────────────────────────────────────────────────────

@app.post("/goals")
def create_goal(body: GoalCreate):
    row = execute(
        """
        INSERT INTO goals (teacher_id, set_by, title, description, target_date)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING *
        """,
        (body.teacher_id, body.set_by, body.title, body.description, body.target_date)
    )
    return row

@app.patch("/goals/{goal_id}")
def update_goal(goal_id: str, body: GoalUpdate):
    if body.status:
        execute(
            "UPDATE goals SET status = %s WHERE id = %s",
            (body.status, goal_id)
        )
    if body.progress_note:
        execute(
            "INSERT INTO goal_updates (goal_id, content) VALUES (%s, %s)",
            (goal_id, body.progress_note)
        )
    return fetchone("SELECT * FROM goals WHERE id = %s", (goal_id,))

@app.get("/goals")
def list_goals(teacher_id: Optional[str] = None):
    if teacher_id:
        return fetchall(
            "SELECT * FROM goals WHERE teacher_id = %s ORDER BY created_at DESC",
            (teacher_id,)
        )
    return fetchall("SELECT * FROM goals ORDER BY created_at DESC")