from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.jobs import router as jobs_router
from app.api.profile import router as profile_router
from app.api.search import router as search_router
from app.core.config import settings

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Approval-first AI job search and application platform.",
)

app.add_middleware(
CORSMiddleware,
allow_origins=[
"http://localhost:3000",
"http://127.0.0.1:3000",
"http://10.2.0.2:3000",
],
allow_credentials=True,
allow_methods=["*"],
allow_headers=["*"],
)


app.include_router(jobs_router, prefix="/api")
app.include_router(profile_router)
app.include_router(search_router)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name}
