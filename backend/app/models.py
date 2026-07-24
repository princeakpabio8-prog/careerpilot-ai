from datetime import datetime
from sqlalchemy import Boolean, JSON, Column, DateTime, Integer,
String, Text
from app.database import Base


class ProfileModel(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False, default="")
    professional_headline = Column(String(500), default="")
    about = Column(Text, default="")
    current_country = Column(String(255), default="")
    preferred_countries = Column(JSON, default=list)
    education = Column(Text, default="")
    certifications = Column(Text, default="")
    skills = Column(JSON, default=list)
    portfolio = Column(Text, default="")
    target_roles = Column(JSON, default=list)
    work_preferences = Column(JSON, default=list)
    salary_expectation = Column(String(255), default="")
    visa_sponsorship = Column(String(100), default="")
    profile_image = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class GeneratedCVModel(Base): tablename = “generated_cvs”

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, nullable=False)

    job_title = Column(String(255), default="")
    company_name = Column(String(255), default="")
    job_description = Column(Text, default="")

    match_percentage = Column(Integer, default=0)
    career_health_score = Column(Integer, default=0)
    recruiter_confidence_score = Column(Integer, default=0)

    matched_keywords = Column(JSON, default=list)
    missing_keywords = Column(JSON, default=list)

    generated_cv = Column(Text, default="")
    cover_letter = Column(Text, default="")

    application_status = Column(String(50), default="Draft")

    notes = Column(Text, default="")
    favorite = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

Purpose: - Career Health Score - Recruiter Confidence Score - Cover
Letter - Application Status - Notes - Favorite - Updated timestamp


class SavedJobModel(Base):
    __tablename__ = "saved_jobs"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, nullable=False)
    external_id = Column(String(255), nullable=False)
    company = Column(String(255), default="")
    job_title = Column(String(255), default="")
    location = Column(String(255), default="")
    remote_type = Column(String(100), default="")
    visa_sponsorship = Column(String(100), default="")
    salary = Column(String(255), default="")
    source = Column(String(100), default="")
    source_url = Column(Text, default="")
    job_description = Column(Text, default="")
    match_score = Column(Integer, default=0)
    published_at = Column(String(100), default="")
    saved_at = Column(DateTime, default=datetime.utcnow)
