from __future__ import annotations
import json
from pydantic import BaseModel, Field
from config import get_openai_client, OPENAI_MODEL


class MockRequest(BaseModel):
    target_role:      str       = Field(min_length=2, max_length=120)
    skills:           list[str] = Field(default_factory=list)
    experience_years: int       = Field(default=0, ge=0)
    round_type:       str       = Field(default="TECHNICAL")  # TECHNICAL | HR | MIXED
    num_questions:    int       = Field(default=10, ge=3, le=20)


class MockQuestion(BaseModel):
    id:           int
    category:     str
    question:     str
    hint:         str
    ideal_answer: str
    difficulty:   str  # Easy | Medium | Hard


class MockResponse(BaseModel):
    target_role:   str
    round_type:    str
    questions:     list[MockQuestion]
    tips:          list[str]
    duration_mins: int


async def generate_mock_questions(req: MockRequest) -> MockResponse:
    client = get_openai_client()
    skills_str = ", ".join(req.skills) if req.skills else "general skills"

    prompt = f"""You are a senior technical interviewer at a top Indian tech company.
Generate {req.num_questions} interview questions for:
- Role: {req.target_role}
- Skills: {skills_str}
- Experience: {req.experience_years} year(s)
- Round type: {req.round_type}

Return ONLY valid JSON:
{{
  "target_role": "{req.target_role}",
  "round_type": "{req.round_type}",
  "questions": [
    {{
      "id": 1,
      "category": "e.g. JavaScript / System Design / HR",
      "question": "The interview question",
      "hint": "A subtle hint without giving away the answer",
      "ideal_answer": "Key points a good answer should cover",
      "difficulty": "Easy | Medium | Hard"
    }}
  ],
  "tips": ["tip 1", "tip 2", "tip 3"],
  "duration_mins": 45
}}

Mix theory, practical and scenario questions. No markdown, no extra text."""

    response = await client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.6,
        response_format={"type": "json_object"},
    )

    raw = json.loads(response.choices[0].message.content or "{}")
    return MockResponse(**raw)
