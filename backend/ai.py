import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
MODEL = "gemini-2.5-flash"

SYSTEM_PROMPT = (
    "You are an expert K-12 instructional coach writing for school administrators. "
    "Be concise, professional, and specific. Never use bullet points or lists. "
    "Write in clear paragraphs only."
)


def ask(prompt: str) -> str:
    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=f"{SYSTEM_PROMPT}\n\n{prompt}",
        )
        return response.text.strip()
    except Exception as e:
        print(f"Gemini error: {e}")
        return ""


def observation_summary(scores: dict, notes: str, section_notes: dict = {}) -> tuple[str, bool]:
    score_text = ", ".join(f"{k}: {v}/4" for k, v in scores.items())
    sections_text = ""
    if section_notes:
        sections_text = "\n".join(f"- {k}: {v}" for k, v in section_notes.items() if v)

    prompt = (
        f"An administrator observed a teacher with the following data:\n"
        f"Domain scores (1-4 scale) — {score_text}\n"
        f"Overall notes — {notes}\n"
        + (f"Section notes:\n{sections_text}\n" if sections_text else "")
        + "\nWrite a 2-3 sentence professional observation summary. "
        "Then on a new line write only: FLAGGED=true or FLAGGED=false "
        "(flag as true if any domain scores 1 or 2)."
    )
    text = ask(prompt)
    if not text:
        flagged = any(v <= 2 for v in scores.values())
        return "", flagged
    flagged = "FLAGGED=true" in text
    summary = text.replace("FLAGGED=true", "").replace("FLAGGED=false", "").strip()
    return summary, flagged


def staff_summary(teacher_name: str, observations: list, reviews: list, notes: list, goals: list) -> str:
    obs_text = "\n".join(
        f"- {o.get('observed_at','')}: avg score {round(sum(o.get('scores',{}).values())/max(len(o.get('scores',{})),1),1)}/4, notes: {o.get('raw_notes','')[:200]}"
        for o in observations
    ) or "No observations recorded."

    rev_text = "\n".join(
        f"- {r.get('period','')}: {r.get('final_notes','')[:300]}"
        for r in reviews
    ) or "No reviews recorded."

    notes_text = "\n".join(
        f"- [{n.get('tag','')}] {n.get('content','')[:150]}"
        for n in notes[:6]
    ) or "No notes recorded."

    goals_text = "\n".join(
        f"- {g.get('title','')} ({g.get('status','')})"
        for g in goals
    ) or "No goals set."

    prompt = (
        f"Write a professional 4-5 sentence staff report for {teacher_name} for a school principal. "
        f"Cover: overall performance rating, instructional strengths, growth trajectory, and any areas for continued development. "
        f"Be specific and reference actual data where possible.\n\n"
        f"Observation data:\n{obs_text}\n\n"
        f"Review notes:\n{rev_text}\n\n"
        f"Admin notes:\n{notes_text}\n\n"
        f"Goals:\n{goals_text}"
    )
    return ask(prompt)


def goal_recommendations(teacher_name: str, scores_list: list) -> list[str]:
    if not scores_list:
        return []

    avg_scores: dict = {}
    for scores in scores_list:
        for category, value in scores.items():
            avg_scores.setdefault(category, []).append(value)
    avg_scores = {k: round(sum(v) / len(v), 1) for k, v in avg_scores.items()}

    score_text = ", ".join(f"{k}: {v}/4" for k, v in avg_scores.items())
    prompt = (
        f"{teacher_name}'s average domain scores: {score_text}.\n\n"
        "Based on the lowest-scoring areas, suggest 2-3 specific, measurable improvement goals. "
        "Write each goal as a single sentence starting with an action verb. "
        "Separate each goal with a newline."
    )
    text = ask(prompt)
    if not text:
        return []
    return [g.strip("- ").strip() for g in text.split("\n") if g.strip()][:3]