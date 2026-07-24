import json
import logging
import os
from typing import Any

from google import genai
from google.genai import types
from pydantic import BaseModel, Field, ValidationError


logger = logging.getLogger(__name__)


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


def _build_prompt(
    profile: dict[str, Any],
    job_title: str,
    company_name: str,
    job_description: str,
) -> str:
    profile_json = json.dumps(profile, ensure_ascii=False, indent=2)

    return f"""
You are a senior recruiter and ATS resume specialist.

Create a truthful, ATS-optimized CV for the candidate below.

TARGET ROLE
Job title: {job_title or "Not provided"}
Company: {company_name or "Not provided"}

JOB DESCRIPTION
{job_description}

CANDIDATE PROFILE
{profile_json}

STRICT RULES
1. Never invent employers, dates, qualifications, achievements, tools, metrics, or experience.
2. Use only information supported by the candidate profile.
3. Reorder and emphasize the most relevant experience.
4. Put unsupported requirements in missing_keywords.
5. Keep the final resume professional, concise, and ATS-friendly.
6. Return valid JSON matching the required response schema.
""".strip()


def generate_tailored_cv(
    profile: dict[str, Any],
    job_title: str,
    company_name: str,
    job_description: str,
) -> GeneratedCv:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()

    if not api_key:
        raise GeminiServiceError(
            "GEMINI_API_KEY is missing from the backend environment."
        )

    if not job_description.strip():
        raise GeminiServiceError("A job description is required.")

    try:
        client = genai.Client(api_key=api_key)

        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=_build_prompt(
                profile=profile,
                job_title=job_title,
                company_name=company_name,
                job_description=job_description,
            ),
            config=types.GenerateContentConfig(
                temperature=0.2,
                response_mime_type="application/json",
                response_schema=GeneratedCv,
            ),
        )

        if not response.text:
            raise GeminiServiceError(
                "Gemini returned an empty response. Check the API key, quota, and model access."
            )

        try:
            return GeneratedCv.model_validate_json(response.text)
        except ValidationError as exc:
            logger.exception("Gemini returned JSON that failed validation")
            raise GeminiServiceError(
                f"Gemini returned an invalid CV structure: {exc}"
            ) from exc

    except GeminiServiceError:
        raise
    except Exception as exc:
        logger.exception("Gemini request failed")
        raise GeminiServiceError(
            f"Gemini request failed: {type(exc).__name__}: {exc}"
        ) from exc