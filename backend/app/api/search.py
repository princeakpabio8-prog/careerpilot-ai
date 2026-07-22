from fastapi import APIRouter, Query

from app.services.job_search import search_jobs
from app.schemas.profile import JobSearchResult

router = APIRouter(prefix="/api", tags=["jobs"])


@router.get("/job-search", response_model=dict)
async def search_jobs_endpoint(
    query: str | None = Query(default=None),
    location: str | None = Query(default=None),
    remote_only: bool = Query(default=False),
    visa_sponsorship: bool = Query(default=False),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=50),
) -> dict:
    return await search_jobs(query or "", location or "", remote_only, visa_sponsorship, page, limit)
