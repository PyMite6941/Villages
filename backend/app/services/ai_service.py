import httpx
import json
from app.config import settings
from typing import Optional

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


async def call_groq(messages: list[dict], system: Optional[str] = None) -> str:
    headers = {
        "Authorization": f"Bearer {settings.groq_api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": settings.groq_model,
        "messages": [{"role": "system", "content": system}] + messages if system else messages,
        "temperature": 0.7,
        "max_tokens": 1024,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(GROQ_API_URL, json=payload, headers=headers)
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]


def _parse_json(raw: str, fallback: dict) -> dict:
    cleaned = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    try:
        return json.loads(cleaned)
    except Exception:
        return fallback


async def generate_village_match_reasoning(
    user_goals: list[str],
    user_strengths: list[str],
    user_weaknesses: list[str],
    academic_level: str,
    available_villages: list[dict],
) -> dict:
    village_summaries = "\n".join(
        f"- ID: {v['id']} | Name: {v['name']} | Focus: {v['focus_area']} | "
        f"Resources: {', '.join(v.get('resources', []))} | Members: {v['member_count']}/{v['max_members']}"
        for v in available_villages
        if v["member_count"] < v["max_members"]
    )
    system = (
        "You are an AI matching system for a student community platform called Villages. "
        "Villages are small study cohorts (5-10 students). Match students to the best Village "
        "based on their profile. Respond with JSON only: "
        '{"village_id": "<id>", "reasoning": "<1-2 sentence explanation>"}'
    )
    messages = [{
        "role": "user",
        "content": (
            f"Student profile:\n"
            f"- Academic level: {academic_level}\n"
            f"- Goals: {', '.join(user_goals)}\n"
            f"- Strengths: {', '.join(user_strengths)}\n"
            f"- Weaknesses: {', '.join(user_weaknesses)}\n\n"
            f"Available Villages:\n{village_summaries}\n\n"
            f"Which village is the best match? JSON only."
        ),
    }]
    raw = await call_groq(messages, system)
    fallback = {"village_id": available_villages[0]["id"] if available_villages else None, "reasoning": raw}
    return _parse_json(raw, fallback)


async def generate_discussion_prompt(village_name: str, focus_area: str, resources: list[str]) -> str:
    system = (
        "You are the Village Elder — an AI facilitator for a student study cohort called a Village. "
        "Generate a short, engaging discussion prompt (2-3 sentences) to spark conversation. "
        "Be warm, encouraging, and academically focused."
    )
    messages = [{
        "role": "user",
        "content": (
            f"Village: {village_name}\nFocus area: {focus_area}\n"
            f"Study resources: {', '.join(resources)}\n\n"
            f"Generate a discussion prompt for this village."
        ),
    }]
    return await call_groq(messages, system)


async def generate_study_challenge(
    village_name: str, subject: str, difficulty: str, member_count: int
) -> dict:
    system = (
        "You are the Village Elder for a student study community. "
        "Create a collaborative study challenge for a small group. "
        'Respond with JSON only: {"title": "...", "description": "...", "steps": ["step1", ...]}'
    )
    messages = [{
        "role": "user",
        "content": (
            f"Village: {village_name}\nSubject: {subject}\n"
            f"Difficulty: {difficulty}\nGroup size: {member_count} students\n\n"
            f"Create a collaborative challenge they can work on together. JSON only."
        ),
    }]
    raw = await call_groq(messages, system)
    return _parse_json(raw, {"title": "Study Challenge", "description": raw, "steps": []})


async def generate_course_study_tips(
    course_title: str,
    subject: str,
    category: str,
    difficulty: str,
    lesson_count: int,
) -> str:
    system = (
        "You are the Village Elder — a wise AI guide in a learning community called Villages. "
        "Generate 4-5 practical, encouraging study tips for a student taking a course. "
        "Be warm and specific to the subject matter. Keep each tip to 1-2 sentences."
    )
    messages = [{
        "role": "user",
        "content": (
            f"Course: {course_title}\n"
            f"Subject: {subject}\n"
            f"Category: {'academic' if category == 'school' else 'hobby'}\n"
            f"Difficulty: {difficulty}\n"
            f"Number of lessons: {lesson_count}\n\n"
            f"What study tips would help a student succeed in this course?"
        ),
    }]
    return await call_groq(messages, system)


async def generate_socratic_response(
    subject: str,
    message: str,
    history: list[dict],
) -> str:
    system = (
        "You are a Socratic Study Buddy in a student community called Villages. "
        "Your single rule: NEVER give direct answers or explanations. "
        "Instead, respond ONLY with probing questions and hints that guide the student "
        "to discover the answer themselves. 2-3 sentences max. "
        "Be warm and encouraging, like a patient Socratic tutor. "
        "If the student is on the right track, affirm it and push deeper with another question."
    )
    trimmed_history = history[-8:] if len(history) > 8 else history
    messages = [
        *[{"role": m["role"], "content": m["content"]} for m in trimmed_history],
        {"role": "user", "content": f"[Subject: {subject}]\n\n{message}"},
    ]
    return await call_groq(messages, system)


async def generate_essay_feedback(
    essay: str,
    essay_prompt: str,
    student_context: str,
) -> dict:
    system = (
        "You are an objective college admissions coach. "
        "CRITICAL RULE: You MUST NOT write, rewrite, or generate any essay content for the student. "
        "Your ONLY job is to critique and analyze the existing text. "
        "Identify concrete strengths, specific improvements needed, and strategic vulnerabilities. "
        "Respond with JSON only: "
        '{"strengths": ["..."], "improvements": ["..."], "vulnerabilities": ["..."], "overall": "2-3 sentence summary"}'
    )
    parts = ["Critique this college essay.\n"]
    if essay_prompt:
        parts.append(f"[ESSAY PROMPT]\n{essay_prompt}\n")
    if student_context:
        parts.append(f"[STUDENT CONTEXT — use to evaluate achievement in context]\n{student_context}\n")
    parts.append(f"[ESSAY]\n{essay}\n\nJSON only.")
    messages = [{"role": "user", "content": "\n".join(parts)}]
    raw = await call_groq(messages, system)
    return _parse_json(raw, {
        "strengths": [],
        "improvements": [],
        "vulnerabilities": [],
        "overall": raw,
    })


async def generate_study_plan(
    goals: list[str],
    strengths: list[str],
    weaknesses: list[str],
    academic_level: str,
    weekly_hours: int,
) -> str:
    system = (
        "You are a study planner for a student learning community called Villages. "
        "Create a realistic, specific day-by-day weekly schedule. "
        "Prioritize weak areas and exam goals. Be concrete about time blocks and tasks."
    )
    messages = [{
        "role": "user",
        "content": (
            f"Create a weekly study plan for this student:\n"
            f"- Academic level: {academic_level}\n"
            f"- Goals: {', '.join(goals) if goals else 'general improvement'}\n"
            f"- Strengths (spend less time): {', '.join(strengths) if strengths else 'not specified'}\n"
            f"- Needs work (prioritize): {', '.join(weaknesses) if weaknesses else 'not specified'}\n"
            f"- Available study hours per week: {weekly_hours}h\n\n"
            f"Give a clear Mon–Sun schedule with subject and time for each block."
        ),
    }]
    return await call_groq(messages, system)


async def moderate_content(content: str) -> dict:
    system = (
        "You are a content moderator for a student platform (ages 13-18). "
        'Respond with JSON only: {"safe": true/false, "reason": "..."}'
    )
    messages = [{"role": "user", "content": f"Is this appropriate for students?\n\n{content}\n\nJSON only."}]
    raw = await call_groq(messages, system)
    return _parse_json(raw, {"safe": True, "reason": "Could not evaluate"})
