import httpx
from app.config import settings
from typing import Optional

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

async def call_openrouter(messages: list[dict], system: Optional[str] = None) -> str:
    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "HTTP-Referer": "https://villages-platform.app",
        "X-Title": "Villages Platform",
        "Content-Type": "application/json",
    }
    
    payload = {
        "model": settings.openrouter_model,
        "messages": [{"role": "system", "content": system}] + messages if system else messages,
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(OPENROUTER_API_URL, json=payload, headers=headers)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


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
        "Villages are small study cohorts (5-10 students). Your job is to match students "
        "to the best Village based on their academic goals and profile. "
        "Respond with a JSON object: {\"village_id\": \"<id>\", \"reasoning\": \"<1-2 sentence explanation>\"}"
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
            f"Which village is the best match? Return JSON only."
        )
    }]
    
    import json
    raw = await call_openrouter(messages, system)
    try:
        return json.loads(raw.strip().strip("```json").strip("```").strip())
    except Exception:
        return {"village_id": available_villages[0]["id"] if available_villages else None, "reasoning": raw}


async def generate_discussion_prompt(village_name: str, focus_area: str, resources: list[str]) -> str:
    system = (
        "You are the Village Elder — an AI facilitator for a student study community called a Village. "
        "Generate a short, engaging discussion prompt (2-3 sentences) to spark conversation among students "
        "studying together. Be warm, encouraging, and academically focused."
    )
    messages = [{
        "role": "user",
        "content": (
            f"Village: {village_name}\nFocus area: {focus_area}\n"
            f"Current study resources: {', '.join(resources)}\n\n"
            f"Generate a discussion prompt for this village."
        )
    }]
    return await call_openrouter(messages, system)


async def generate_study_challenge(
    village_name: str, subject: str, difficulty: str, member_count: int
) -> dict:
    system = (
        "You are the Village Elder for a student study community. "
        "Create a collaborative study challenge for a small group. "
        "Respond with JSON: {\"title\": \"...\", \"description\": \"...\", \"steps\": [\"step1\", ...]}"
    )
    messages = [{
        "role": "user",
        "content": (
            f"Village: {village_name}\nSubject: {subject}\n"
            f"Difficulty: {difficulty}\nGroup size: {member_count} students\n\n"
            f"Create a collaborative challenge they can work on together. JSON only."
        )
    }]
    import json
    raw = await call_openrouter(messages, system)
    try:
        return json.loads(raw.strip().strip("```json").strip("```").strip())
    except Exception:
        return {"title": "Study Challenge", "description": raw, "steps": []}


async def moderate_content(content: str) -> dict:
    system = (
        "You are a content moderator for a student platform. "
        "Check if content is appropriate for students (ages 13-18). "
        "Respond with JSON: {\"safe\": true/false, \"reason\": \"...\"}"
    )
    messages = [{"role": "user", "content": f"Is this content appropriate?\n\n{content}\n\nJSON only."}]
    import json
    raw = await call_openrouter(messages, system)
    try:
        return json.loads(raw.strip().strip("```json").strip("```").strip())
    except Exception:
        return {"safe": True, "reason": "Could not evaluate"}
