from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.gemini_service import GeminiServiceError, generate_tailored_cv


router = APIRouter(prefix="/cv", tags=["cv"])


class CvGenerateRequest(BaseModel):
    profile: dict[str, Any]
    job_title: str = ""
    company_name: str = ""
    job_description: str = Field(min_length=20)


@router.post("/generate")
def generate_cv(payload: CvGenerateRequest):
    try:
        result = generate_tailored_cv(
            profile=payload.profile,
            job_title=payload.job_title.strip(),
            company_name=payload.company_name.strip(),
            job_description=payload.job_description.strip(),
        )
        return result.model_dump()
    except GeminiServiceError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="CareerPilot could not generate the CV right now.",
        ) from exc