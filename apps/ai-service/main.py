from datetime import datetime, timezone
from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(
    title="SkillMove AI Service",
    version="0.1.0",
    description="AI service boundary. External model integrations are disabled until configured.",
)

class RoadmapRequest(BaseModel):
    target_role: str = Field(min_length=2, max_length=120)
    skills: list[str] = Field(default_factory=list, max_length=50)

@app.get('/health')
def health() -> dict[str, str]:
    return {'status': 'ok', 'service': 'ai-service', 'timestamp': datetime.now(timezone.utc).isoformat()}

@app.post('/api/v1/roadmap')
def roadmap(request: RoadmapRequest) -> dict[str, object]:
    return {
        'status': 'not_configured',
        'target_role': request.target_role,
        'message': 'Roadmap generation requires a configured AI provider and human review.',
    }
