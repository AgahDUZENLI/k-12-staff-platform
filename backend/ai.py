import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")

SYSTEM_PROMPT = (
    "You are an expert K-12 instructional coach writing for school administrators. "
    "Be concise, professional, and specific. Never use bullet points or lists. "
    "Write in clear paragraphs only."
)


def ask(prompt: str) -> str:
    try:
        response = model.generate_content(f"{SYSTEM_PROMPT}\n\n{prompt}")
        return response.text.strip()
    except Exception as e:
        print(f"Gemini error: {e}")
        return ""


def observation_summary(scores: dict, notes: str) -> tuple[str, bool]:
    score_text = ", ".join(f"{k}: {v}/5" for k, v in scores.items())
    prompt = (
        f"An administrator observed a teacher and recorded the following:\n"
        f"Scores — {score_text}\n"
        f"Notes — {notes}\n\n"
        f"Write a 2-3 sentence professional summary of this observation. "
        f"Then on a new line write only: FLAGGED=true or FLAGGED=false "
        f"(flag as true if any score is 2 or below)."
    )
    text = ask(prompt)
    flagged = "FLAGGED=true" in text
    summary = text.replace("FLAGGED=true", "").replace("FLAGGED=false", "").strip()
    return summary, flagged


def staff_summary(teacher_name: str, observations: list, reviews: list, notes: list, goals: list) -> str:
    obs_text = "\n".join(
        f"- {o['observed_at']}: scores {o['scores']}, notes: {o['raw_notes']}"
        for o in observations
    ) or "No observations recorded."

    rev_text = "\n".join(
        f"- {r['period']}: scores {r['category_scores']}, notes: {r['final_notes']}"
        for r in reviews
    ) or "No reviews recorded."

    notes_text = "\n".join(
        f"- [{n['tag']}] {n['content']}"
        for n in notes
    ) or "No notes recorded."

    goals_text = "\n".join(
        f"- {g['title']} (status: {g['status']})"
        for g in goals
    ) or "No goals set."

    prompt = (
        f"Write a concise professional summary paragraph for {teacher_name} based on the following records.\n\n"
        f"Observations:\n{obs_text}\n\n"
        f"Performance Reviews:\n{rev_text}\n\n"
        f"Staff Notes:\n{notes_text}\n\n"
        f"Goals:\n{goals_text}\n\n"
        f"Summarize overall performance, strengths, and areas for growth in 3-4 sentences."
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

    score_text = ", ".join(f"{k}: {v}/5" for k, v in avg_scores.items())
    prompt = (
        f"{teacher_name}'s average observation scores this period: {score_text}.\n\n"
        f"Based on the lowest-scoring areas, suggest 2-3 specific, measurable improvement goals. "
        f"Write each goal as a single sentence starting with an action verb. "
        f"Separate each goal with a newline."
    )
    text = ask(prompt)
    goals = [g.strip("- ").strip() for g in text.split("\n") if g.strip()]
    return goals[:3]