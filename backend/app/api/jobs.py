from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException

from app.schemas.job import JobCreate, JobRead

router = APIRouter(prefix="/jobs", tags=["jobs"])

_jobs: list[JobRead] = [
    JobRead(
        id=uuid4(),
        company="Example Labs",
        title="Business Development Manager",
        location="Berlin, Germany",
        remote=False,
        visa_sponsorship="likely",
        source="demo",
        apply_url="https://example.com/jobs/1",
        match_score=87,
        status="discovered",
    )
]


@router.get("", response_model=list[JobRead])
def list_jobs() -> list[JobRead]:
    return _jobs


@router.post("", response_model=JobRead, status_code=201)
def create_job(payload: JobCreate) -> JobRead:
    job = JobRead(id=uuid4(), **payload.model_dump())
    _jobs.append(job)
    return job


@router.get("/{job_id}", response_model=JobRead)
def get_job(job_id: UUID) -> JobRead:
    for job in _jobs:
        if job.id == job_id:
            return job
    raise HTTPException(status_code=404, detail="Job not found")
