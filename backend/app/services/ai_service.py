import json
from typing import Optional

import httpx

from app.config import settings

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"


async def call_llm(messages: list[dict], system: Optional[str] = None) -> str:
    models = [settings.openrouter_model, settings.openrouter_model_fallback]
    last_error: Exception | None = None

    for attempt, model in enumerate(models):
        try:
            return await _call_model(model, messages, system)
        except httpx.HTTPStatusError as e:
            last_error = e
            if attempt < len(models) - 1:
                continue
            raise
        except Exception as e:
            last_error = e
            if attempt < len(models) - 1:
                continue
            raise

    raise last_error or RuntimeError("All models exhausted")


async def _call_model(model: str, messages: list[dict], system: Optional[str] = None) -> str:
    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://villages.app",
        "X-Title": "Villages",
    }
    full_messages = [{"role": "system", "content": system}] + messages if system else messages
    payload = {
        "model": model,
        "messages": full_messages,
        "temperature": 0.7,
        "max_tokens": 1024,
    }
    async with httpx.AsyncClient(timeout=55.0) as client:
        resp = await client.post(OPENROUTER_API_URL, json=payload, headers=headers)
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
    interests: list[str] = None,
    learning_style: str = "visual",
    available_villages: list[dict] = None,
) -> dict:
    if interests is None:
        interests = []
    if available_villages is None:
        available_villages = []
    village_summaries = "\n".join(
        f"- ID: {v['id']} | Name: {v['name']} | Focus: {v['focus_area']} | "
        f"Resources: {', '.join(v.get('resources', []))} | Members: {v['member_count']}/{v['max_members']}"
        for v in available_villages
        if v["member_count"] < v["max_members"]
    )
    system = (
        "You are an AI matching system for an inclusive community learning platform called Villages. "
        "Villages are small study cohorts (5-10 people) for both students and adult learners. "
        "Match a learner to the best Village based on their full profile including interests and learning style. "
        "Consider both academic goals AND broader interests to find the best community fit. "
        'Respond with JSON only: '
        '{"village_id": "<id>", "reasoning": "<1-2 sentence explanation>"}'
    )
    messages = [{
        "role": "user",
        "content": (
            f"Learner profile:\n"
            f"- Level: {academic_level}\n"
            f"- Goals: {', '.join(user_goals)}\n"
            f"- Strengths: {', '.join(user_strengths)}\n"
            f"- Weaknesses: {', '.join(user_weaknesses)}\n"
            f"{'- Interests: ' + ', '.join(interests) if interests else ''}\n"
            f"{'- Learning style: ' + learning_style if learning_style else ''}\n\n"
            f"Available Villages:\n{village_summaries}\n\n"
            f"Which village is the best match? JSON only."
        ),
    }]
    raw = await call_llm(messages, system)
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
    return await call_llm(messages, system)


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
    raw = await call_llm(messages, system)
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
    return await call_llm(messages, system)


async def generate_lesson_quiz(
    course_title: str,
    lesson_title: str,
    lesson_content: str,
    difficulty: str = "beginner",
    num_questions: int = 4,
) -> dict:
    system = (
        "You are an expert tutor creating practice questions for a lesson. "
        f"Write {num_questions} multiple-choice questions that check genuine understanding "
        "(not just recall) of the lesson material. Each question has exactly 4 options, one correct. "
        "Vary difficulty appropriately and write a short explanation of why the answer is correct. "
        "Base questions ONLY on the supplied lesson content — do not invent facts beyond it. "
        'Respond with JSON only: {"questions": [{"question": "...", '
        '"options": ["A", "B", "C", "D"], "correct_index": 0, "explanation": "..."}]}'
    )
    # Cap content sent to the model to keep token use sane.
    snippet = lesson_content[:4000]
    messages = [{
        "role": "user",
        "content": (
            f"Course: {course_title}\n"
            f"Lesson: {lesson_title}\n"
            f"Difficulty: {difficulty}\n\n"
            f"Lesson content:\n{snippet}\n\n"
            f"Generate {num_questions} multiple-choice practice questions. JSON only."
        ),
    }]
    raw = await call_llm(messages, system)
    fallback = {
        "questions": [
            {
                "question": f"What is the main focus of \"{lesson_title}\"?",
                "options": [
                    "The core concepts covered in this lesson",
                    "An unrelated topic",
                    "Something not in the lesson",
                    "None of the above",
                ],
                "correct_index": 0,
                "explanation": "Review the lesson content above and try the practice again.",
            }
        ]
    }
    return _parse_json(raw, fallback)


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
    return await call_llm(messages, system)


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
    raw = await call_llm(messages, system)
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
    return await call_llm(messages, system)


async def generate_college_advisor_response(
    message: str,
    gpa: str,
    test_scores: str,
    interests: list[str],
    preferences: str,
    history: list[dict],
) -> str:
    system = (
        "You are a college admissions advisor inside a student community called Villages. "
        "Help high school students find schools that fit their profile, interests, and goals. "
        "When suggesting schools, always provide a range: 1-2 reach, 2-3 match, 1-2 safety schools. "
        "Be realistic, specific, and encouraging. Name actual schools. "
        "If you need more information, ask focused clarifying questions. "
        "Keep responses under 350 words. "
        "NEVER generate application essay content — only advise on school selection and the application process."
    )
    context_parts = []
    if gpa:
        context_parts.append(f"GPA: {gpa}")
    if test_scores:
        context_parts.append(f"Test scores: {test_scores}")
    if interests:
        context_parts.append(f"Interests/intended major: {', '.join(interests)}")
    if preferences:
        context_parts.append(f"Preferences: {preferences}")
    context = "\n".join(context_parts)
    trimmed_history = history[-8:] if len(history) > 8 else history
    first_message = f"[Student Profile]\n{context}\n\n{message}" if (context and not trimmed_history) else message
    messages = [
        *[{"role": m["role"], "content": m["content"]} for m in trimmed_history],
        {"role": "user", "content": first_message},
    ]
    return await call_llm(messages, system)


async def moderate_content(content: str) -> dict:
    system = (
        "You are a content moderator for an inclusive learning platform (students and adult learners). "
        'Respond with JSON only: {"safe": true/false, "reason": "..."}'
    )
    messages = [{"role": "user", "content": f"Is this appropriate for all learners?\n\n{content}\n\nJSON only."}]
    raw = await call_llm(messages, system)
    return _parse_json(raw, {"safe": True, "reason": "Could not evaluate"})


async def explain_topic(
    topic: str,
    village_name: str = "",
    focus_area: str = "",
    audience_levels: list[str] = None,
) -> dict:
    if audience_levels is None:
        audience_levels = ["students"]
    audience_desc = ", ".join(audience_levels)
    system = (
        "You are an AI learning assistant that turns complex or confusing topics into "
        "clear, plain-language explanations that anyone can understand. "
        "Your response must be inclusive, accurate, and grounded in reliable educational principles. "
        "Always identify what matters most to the learner. "
        'Respond with JSON only: '
        '{"plain_language": "<2-3 sentence plain-English summary>", '
        '"key_points": ["<point 1>", "<point 2>", ...], '
        '"checklist": [{"title": "<action>", "done": false}, ...], '
        '"next_steps": [{"title": "<step>", "description": "<how to do it>"}, ...]}'
    )
    messages = [{
        "role": "user",
        "content": (
            f"Topic: {topic}\n"
            f"{'Village: ' + village_name if village_name else ''}\n"
            f"{'Focus area: ' + focus_area if focus_area else ''}\n"
            f"Audience: {audience_desc}\n\n"
            f"Explain this topic in plain language and provide a clear checklist and next steps. "
            f"Before responding, verify the explanation is factually grounded. JSON only."
        ),
    }]
    raw = await call_llm(messages, system)
    fallback = {
        "plain_language": f"Here's what we know about {topic}.",
        "key_points": [],
        "checklist": [{"title": "Review the topic", "done": False}],
        "next_steps": [{"title": "Discuss with your group", "description": "Share what you learned"}],
    }
    return _parse_json(raw, fallback)


async def generate_learning_path(
    village_name: str,
    focus_area: str,
    resources: list[str],
    member_count: int,
    interests: list[str] = None,
) -> dict:
    if interests is None:
        interests = []
    system = (
        "You are an AI curriculum designer for a community learning platform. "
        "Create a structured learning path for a group of learners who have come together "
        "around a shared educational topic. The learning path should be collaborative, "
        "actionable, and designed so the group can work through it together. "
        'Respond with JSON only: '
        '{"title": "<learning path title>", '
        '"description": "<1-2 sentence overview>", '
        '"steps": [{"title": "<step>", "description": "<what to do>", "estimated_minutes": 15}, ...]}'
    )
    messages = [{
        "role": "user",
        "content": (
            f"Village: {village_name}\n"
            f"Focus area: {focus_area}\n"
            f"Resources: {', '.join(resources)}\n"
            f"Group size: {member_count} members\n"
            f"{'Group interests: ' + ', '.join(interests) if interests else ''}\n\n"
            f"Create a collaborative learning path for this group. "
            f"Include 3-5 steps with estimated time for each. "
            f"Ensure the plan is inclusive and appropriate for mixed experience levels. "
            f"JSON only."
        ),
    }]
    raw = await call_llm(messages, system)
    fallback = {
        "title": f"Learning path for {focus_area}",
        "description": "A collaborative learning journey for your village.",
        "steps": [
            {"title": "Get started", "description": "Review the resources together", "estimated_minutes": 15},
        ],
    }
    return _parse_json(raw, fallback)


async def generate_study_planner(
    goals: list[str],
    strengths: list[str],
    weaknesses: list[str],
    academic_level: str,
    subject: str,
    target: str,
    target_date: str,
    weekly_hours: int,
) -> dict:
    system = (
        "You are a study planner for a student learning community called Villages. "
        "Create a comprehensive multi-week study timeline from today until the target date. "
        "Work backwards from the target date to build week-by-week milestones. "
        "Prioritize weak areas and distribute topics across the available weeks. "
        "Be specific and realistic about what can be accomplished each week. "
        'Respond with JSON only: '
        '{"weeks": [{"week": 1, "dates": "<date range>", "focus": "<weekly theme>", '
        '"tasks": ["<task1>", "<task2>", ...], "milestone": "<weekly checkpoint>"}, ...], '
        '"total_weeks": <number>, "summary": "<2-3 sentence overview of the plan>"}'
    )
    messages = [{
        "role": "user",
        "content": (
            f"Create a study plan from now until {target_date} for:\n"
            f"- Academic level: {academic_level}\n"
            f"- Subject: {subject}\n"
            f"- Target/Goal: {target}\n"
            f"- Goals: {', '.join(goals) if goals else 'general improvement'}\n"
            f"- Strengths (spend less time): {', '.join(strengths) if strengths else 'not specified'}\n"
            f"- Needs work (prioritize): {', '.join(weaknesses) if weaknesses else 'not specified'}\n"
            f"- Available study hours per week: {weekly_hours}h\n\n"
            f"Generate a week-by-week timeline with milestones and specific tasks for each week. "
            f"JSON only."
        ),
    }]
    raw = await call_llm(messages, system)
    fallback = {
        "weeks": [
            {
                "week": 1,
                "dates": "This week",
                "focus": "Getting started",
                "tasks": ["Review the basics", "Set up your study materials"],
                "milestone": "Begin your study journey",
            }
        ],
        "total_weeks": 1,
        "summary": "A structured plan to reach your study goal.",
    }
    return _parse_json(raw, fallback)


async def generate_gpa_plan(
    courses: list[dict],
    target_gpa: float,
    current_gpa: float | None,
    academic_level: str,
    weekly_hours: int,
) -> dict:
    course_lines = "\n".join(
        f"- {c['name']} | Current: {c.get('current_grade', 'not started')} | Credits: {c.get('credits', 1)} | {'❤️ Favorite' if c.get('is_favorite') else ''}"
        for c in courses
    )
    system = (
        "You are a high school GPA planning advisor. "
        "Analyze a student's current courses and calculate what grades they need "
        "to reach their target GPA. Consider that favorite courses are already "
        "strong areas where the student excels — use them as anchors. "
        "Provide specific per-course grade targets and actionable study focus areas. "
        "Be realistic — if the target is unattainable, suggest an adjusted target. "
        "Standard GPA scale: A=4.0, A-=3.7, B+=3.3, B=3.0, B-=2.7, C+=2.3, C=2.0, D=1.0, F=0.0. "
        'Respond with JSON only: '
        '{"feasible": true/false, '
        '"current_gpa": <number or null>, '
        '"target_gpa": <number>, '
        '"adjusted_target": <number or null>, '
        '"courses": [{"name": "<course>", "current_grade": "<grade>", '
        '"target_grade": "<grade>", "credits": <number>, '
        '"is_favorite": true/false, '
        '"study_focus": ["<focus area 1>", "<focus area 2>", ...]}], '
        '"weekly_plan": "<2-3 sentence weekly schedule>", '
        '"recommendation": "<key insight>"}'
    )
    messages = [{
        "role": "user",
        "content": (
            f"Student level: {academic_level}\n"
            f"Target GPA: {target_gpa}\n"
            f"Current overall GPA: {current_gpa if current_gpa else 'not provided (calculate from courses)'}\n"
            f"Weekly study hours available: {weekly_hours}h\n\n"
            f"Courses:\n{course_lines}\n\n"
            f"Calculate the target grade needed in each course and provide study focus areas. "
            f"Prioritize favorite courses as strengths. JSON only."
        ),
    }]
    raw = await call_llm(messages, system)
    fallback = {
        "feasible": True,
        "current_gpa": current_gpa,
        "target_gpa": target_gpa,
        "adjusted_target": None,
        "courses": [
            {
                "name": c.get("name", "Course"),
                "current_grade": c.get("current_grade", ""),
                "target_grade": "B",
                "credits": c.get("credits", 1),
                "is_favorite": c.get("is_favorite", False),
                "study_focus": ["Review course materials", "Practice problems weekly"],
            }
            for c in courses
        ],
        "weekly_plan": "Focus on your weakest areas first, then reinforce favorite subjects.",
        "recommendation": "Consistent weekly effort is key to reaching your GPA goal.",
    }
    return _parse_json(raw, fallback)


async def moderate_topic_content(topic: str, explanation: str) -> dict:
    system = (
        "You are a responsible AI guardrail for an educational community platform. "
        "Your job is to ensure topic explanations are factually accurate, "
        "age-appropriate, inclusive, and free from misinformation or harmful stereotypes. "
        'Respond with JSON only: '
        '{"safe": true/false, "concerns": ["<any issues found>"], "ethical_notes": ["<ethical considerations>"]}'
    )
    messages = [{
        "role": "user",
        "content": (
            f"Review this educational content for safety, accuracy, and inclusivity:\n\n"
            f"Topic: {topic}\n"
            f"Explanation: {explanation}\n\n"
            f"Is this content safe, accurate, and appropriate? List any concerns. JSON only."
        ),
    }]
    raw = await call_llm(messages, system)
    return _parse_json(raw, {"safe": True, "concerns": [], "ethical_notes": []})
