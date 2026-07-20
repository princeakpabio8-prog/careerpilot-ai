from fastapi.testclient import TestClient

from app.main import app
from app.services.job_search import infer_visa_sponsorship

client = TestClient(app)


def test_profile_round_trip() -> None:
    payload = {
        "full_name": "Ada Lovelace",
        "professional_headline": "AI Product Engineer",
        "about": "Builds AI products",
        "current_country": "United Kingdom",
        "preferred_countries": ["United Kingdom", "Germany"],
        "education": "Computer Science",
        "certifications": "AWS",
        "skills": ["Python", "FastAPI"],
        "portfolio": "https://example.com",
        "target_roles": ["AI Engineer"],
        "work_preferences": ["Remote worldwide"],
        "salary_expectation": "£90,000",
        "visa_sponsorship": "Yes",
    }

    response = client.post("/api/profile", json=payload)
    assert response.status_code == 200

    fetched = client.get("/api/profile")
    assert fetched.status_code == 200
    data = fetched.json()
    assert data["full_name"] == payload["full_name"]
    assert data["skills"] == payload["skills"]


def test_generated_cvs_and_saved_jobs_round_trip() -> None:
    cv_response = client.post(
        "/api/cvs",
        json={
            "job_title": "AI Engineer",
            "company_name": "Example AI",
            "job_description": "Build AI applications",
            "match_percentage": 85,
            "matched_keywords": ["python"],
            "missing_keywords": ["llm"],
            "generated_cv": "# CV",
        },
    )
    assert cv_response.status_code == 200
    cv_data = cv_response.json()
    assert cv_data["job_title"] == "AI Engineer"

    job_response = client.post(
        "/api/saved-jobs",
        json={
            "external_id": "ext-001",
            "company": "Example AI",
            "job_title": "AI Engineer",
            "location": "Remote",
            "remote_type": "remote",
            "visa_sponsorship": "Yes",
            "salary": "$100k",
            "source": "remoteok",
            "source_url": "https://example.com/job",
            "job_description": "Remote AI engineer",
            "match_score": 88,
            "published_at": "2026-01-01T00:00:00",
        },
    )
    assert job_response.status_code == 200

    saved_jobs = client.get("/api/saved-jobs")
    assert saved_jobs.status_code == 200
    assert len(saved_jobs.json()) >= 1


def test_visa_sponsorship_inference() -> None:
    assert infer_visa_sponsorship("Visa sponsorship available for the right candidate") == "Yes"
    assert infer_visa_sponsorship("Must already have work authorization") == "No"
    assert infer_visa_sponsorship("A remote role with flexible work") == "Unknown"
