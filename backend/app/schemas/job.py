from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, HttpUrl


VisaStatus = Literal["confirmed", "likely", "unknown", "not_available"]
JobStatus = Literal["discovered", "shortlisted", "approved", "rejected", "applied"]


class JobCreate(BaseModel):
    company: str = Field(min_length=2, max_length=120)
    title: str = Field(min_length=2, max_length=160)
    location: str = Field(min_length=2, max_length=160)
    remote: bool = False
    visa_sponsorship: VisaStatus = "unknown"
    source: str = Field(default="manual", max_length=80)
    apply_url: HttpUrl
    match_score: int = Field(default=0, ge=0, le=100)
    status: JobStatus = "discovered"


class JobRead(JobCreate):
    id: UUID
