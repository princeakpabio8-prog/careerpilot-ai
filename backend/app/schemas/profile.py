from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class ProfileCreate(BaseModel):
    full_name: str = Field(default="")
    professional_headline: str = Field(default="")
    about: str = Field(default="")
    current_country: str = Field(default="")
    preferred_countries: List[str] = Field(default_factory=list)
    education: str = Field(default="")
    certifications: str = Field(default="")
    skills: List[str] = Field(default_factory=list)
    portfolio: str = Field(default="")
    target_roles: List[str] = Field(default_factory=list)
    work_preferences: List[str] = Field(default_factory=list)
    salary_expectation: str = Field(default="")
    visa_sponsorship: str = Field(default="")
    profile_image: Optional[str] = None


class ProfileRead(ProfileCreate):
    id: int
    created_at: datetime
    updated_at: datetime


class GeneratedCVCreate(BaseModel):
    profile_id: Optional[int] = None
    job_title: str = Field(default="")
    company_name: str = Field(default="")
    job_description: str = Field(default="")
    match_percentage: int = Field(default=0)
    matched_keywords: List[str] = Field(default_factory=list)
    missing_keywords: List[str] = Field(default_factory=list)
    generated_cv: str = Field(default="")


class GeneratedCVRead(GeneratedCVCreate):
    id: int
    created_at: datetime


class SavedJobCreate(BaseModel):
    profile_id: Optional[int] = None
    external_id: str
    company: str = Field(default="")
    job_title: str = Field(default="")
    location: str = Field(default="")
    remote_type: str = Field(default="")
    visa_sponsorship: str = Field(default="")
    salary: str = Field(default="")
    source: str = Field(default="")
    source_url: str = Field(default="")
    job_description: str = Field(default="")
    match_score: int = Field(default=0)
    published_at: str = Field(default="")


class SavedJobRead(SavedJobCreate):
    id: int
    saved_at: datetime


class JobSearchResult(BaseModel):
    external_id: str
    source: str
    company: str
    title: str
    location: str
    remote_type: str
    salary: str
    description: str
    source_url: str
    published_at: str
    visa_sponsorship: str
    match_score: int
    matched_keywords: List[str] = Field(default_factory=list)
    missing_keywords: List[str] = Field(default_factory=list)
    match_reasons: List[str] = Field(default_factory=list)
