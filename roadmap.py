from __future__ import annotations
import json
from typing import Optional, List
from pydantic import BaseModel, Field
from config import get_openai_client, OPENAI_MODEL


class RoadmapRequest(BaseModel):
    target_role:           str            = Field(min_length=2, max_length=120)
    skills:                List[str]      = Field(default_factory=list)
    experience_years:      int            = Field(default=0, ge=0)
    classification:        str            = Field(default="BEGINNER")
    course_interest:       Optional[str]  = None
    learning_availability: Optional[str]  = None


class RoadmapPhase(BaseModel):
    phase:     str
    duration:  str
    goals:     List[str]
    resources: List[str]
    milestone: str


class RoadmapResponse(BaseModel):
    target_role:    str
    summary:        str
    phases:         List[RoadmapPhase]
    next_steps:     List[str]
    estimated_time: str
    disclaimer:     str


async def generate_roadmap(req: RoadmapRequest) -> RoadmapResponse:
    client = get_openai_client()
    skills_str = ", ".join(req.skills) if req.skills else "none listed"
    level_ctx = {
        "BEGINNER": "just starting out with little to no industry experience",
        "STARTER":  "has some foundational knowledge and 1-2 years experience",
        "PRO":      "has solid experience and wants to level up",
    }.get(req.classification, "at an intermediate level")

    prompt = f"""You are a career coach for an EdTech platform in India.
Create a practical learning roadmap for:
- Target role: {req.target_role}
- Current skills: {skills_str}
- Experience: {req.experience_years} year(s) — {level_ctx}
- Course interest: {req.course_interest or "general"}
- Learning availability: {req.learning_availability or "a few hours per week"}

Return ONLY valid JSON with this exact structure:
{{
  "target_role": "{req.target_role}",
  "summary": "2-3 sentence overview",
  "phases": [
    {{
      "phase": "Phase name",
      "duration": "e.g. Weeks 1-4",
      "goals": ["goal 1", "goal 2"],
      "resources": ["resource 1", "resource 2"],
      "milestone": "What the learner can do after this phase"
    }}
  ],
  "next_steps": ["action 1", "action 2", "action 3"],
  "estimated_time": "e.g. 12-16 weeks",
  "disclaimer": "This roadmap is a guide. Actual progress depends on consistent practice."
}}

Keep it practical for the Indian job market. 3-4 phases. No markdown, no extra text."""

    response = await client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
        response_format={"type": "json_object"},
    )

    raw = json.loads(response.choices[0].message.content or "{}")
    return RoadmapResponse(**raw)
