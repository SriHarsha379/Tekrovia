from __future__ import annotations
import json
from pydantic import BaseModel, Field
from config import get_openai_client, OPENAI_MODEL


class ResumeRequest(BaseModel):
    resume_text: str  = Field(min_length=50)
    target_role: str  = Field(min_length=2, max_length=120)
    job_description: str | None = None


class ResumeSection(BaseModel):
    section:    str
    score:      int   # 0-100
    feedback:   str
    suggestions: list[str]


class ResumeResponse(BaseModel):
    overall_score:    int
    ats_score:        int
    classification:   str   # Strong | Good | Needs Work
    sections:         list[ResumeSection]
    missing_keywords: list[str]
    strengths:        list[str]
    improvements:     list[str]
    disclaimer:       str


async def review_resume(req: ResumeRequest) -> ResumeResponse:
    client = get_openai_client()

    jd_context = f"\nJob description:\n{req.job_description}" if req.job_description else ""

    prompt = f"""You are an expert resume reviewer and ATS specialist for the Indian job market.
Review this resume for the role of {req.target_role}.{jd_context}

Resume:
{req.resume_text[:4000]}

Return ONLY valid JSON:
{{
  "overall_score": 0-100,
  "ats_score": 0-100,
  "classification": "Strong | Good | Needs Work",
  "sections": [
    {{
      "section": "e.g. Summary / Experience / Skills / Education / Projects",
      "score": 0-100,
      "feedback": "Specific feedback for this section",
      "suggestions": ["suggestion 1", "suggestion 2"]
    }}
  ],
  "missing_keywords": ["keyword 1", "keyword 2"],
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "disclaimer": "This is an automated review and should be validated by a human career expert."
}}

Be specific and actionable. No markdown, no extra text."""

    response = await client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        response_format={"type": "json_object"},
    )

    raw = json.loads(response.choices[0].message.content or "{}")
    return ResumeResponse(**raw)
