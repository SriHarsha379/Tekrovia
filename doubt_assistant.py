from __future__ import annotations
import json
from typing import List, Optional
from pydantic import BaseModel, Field
from config import get_openai_client, OPENAI_MODEL


class DoubtRequest(BaseModel):
    question:     str           = Field(min_length=5)
    course_title: Optional[str] = None
    lesson_title: Optional[str] = None
    context:      Optional[str] = None


class DoubtResponse(BaseModel):
    answer:    str
    example:   Optional[str]
    follow_up: List[str]
    resources: List[str]


async def answer_doubt(req: DoubtRequest) -> DoubtResponse:
    client = get_openai_client()

    context_block = ""
    if req.course_title:
        context_block += f"\nCourse: {req.course_title}"
    if req.lesson_title:
        context_block += f"\nLesson: {req.lesson_title}"
    if req.context:
        context_block += f"\nContext: {req.context}"

    prompt = f"""You are a friendly expert tutor for an Indian EdTech platform.
A student has a question:{context_block}

Question: {req.question}

Return ONLY valid JSON:
{{
  "answer": "Clear explanation in simple language",
  "example": "A practical code or real-world example if relevant, else null",
  "follow_up": ["A related question to deepen understanding", "Another follow-up"],
  "resources": ["A helpful topic or resource to look up"]
}}

Keep the answer concise but complete. No markdown in JSON strings, no extra text."""

    response = await client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5,
    )

    raw = json.loads(response.choices[0].message.content or "{}")
    return DoubtResponse(**raw)
