import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY    = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL      = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
AI_SERVICE_SECRET = os.getenv("AI_SERVICE_SECRET", "")

def get_openai_client():
    from openai import AsyncOpenAI
    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is not configured.")
    return AsyncOpenAI(api_key=OPENAI_API_KEY)
