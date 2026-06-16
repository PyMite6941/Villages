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
            if e.response.status_code == 429:
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
    async with httpx.AsyncClient(timeout=30.0) as client:
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
