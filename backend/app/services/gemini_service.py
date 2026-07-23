import json
import os
from typing import Any

from google import genai
from google.genai import types
from pydantic import BaseModel, Field


class GeneratedCv(BaseModel):
    ats_score: int = Field(ge=0, le=100)
    recruiter_confidence: str
    recruiter_summary: str
    professional_summary: str
    core_skills: list[str]
    matched_keywords: list[str]
    missing_keywords: list[str]
    experience_bullets: list[str]
    improvements: list[str]
    final_resume: str


class GeminiServiceError(RuntimeError):
    pass


def _build_prompt(profile: dict[str, Any], job_title: str, company_name: str, job_description: str) -> str:
    profile_json = json.dumps(profile, ensure_ascii=False, indent=2)
    return f"""
Create a truthful, ATS-optimized CV.

TARGET ROLE
Job title: {job_title or "Not provided"}
Company: {company_name or "Not provided"}

JOB DESCRIPTION
{job_description}

CANDIDATE PROFILE
{profile_json}

Rules:
- Never invent experience or qualifications.
- Tailor the CV using only supplied information.
- Return a clean recruiter-ready resume.
""".strip()


def generate_tailored_cv(
    profile: dict[str, Any],
    job_title: str,
    company_name: str,
    job_description: str,
) -> GeneratedCv:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise GeminiServiceError("GEMINI_API_KEY not found.")

    client = genai.Client(api_key=api_key)

    response = client.models.generate_content(
        model="gemini-2.5-flash-lite",
        contents=_build_prompt(profile, job_title, company_name, job_description),
        config=types.GenerateContentConfig(
            temperature=0.25,
            response_mime_type="application/json",
            response_schema=GeneratedCv,
        ),
    )

    if not response.text:
        raise GeminiServiceError("Empty response from Gemini.")

    return GeneratedCv.model_validate_json(response.text)