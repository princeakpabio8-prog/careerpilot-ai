from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db, init_db
from app.models import GeneratedCVModel, ProfileModel, SavedJobModel
from app.schemas.profile import GeneratedCVCreate, GeneratedCVRead, ProfileCreate, ProfileRead, SavedJobCreate, SavedJobRead


def _get_or_create_profile(db: Session) -> ProfileModel:
    profile = db.query(ProfileModel).order_by(ProfileModel.created_at.desc()).first()
    if profile is None:
        profile = ProfileModel()
        db.add(profile)
        db.flush()
    return profile

router = APIRouter(prefix="/api", tags=["persistence"])


@router.on_event("startup")
def startup_event() -> None:
    init_db()


@router.get("/profile", response_model=ProfileRead | None)
def get_profile(db: Session = Depends(get_db)) -> ProfileRead | None:
    profile = db.query(ProfileModel).order_by(ProfileModel.created_at.desc()).first()
    if not profile:
        return None
    return ProfileRead.model_validate(profile, from_attributes=True)


@router.post("/profile", response_model=ProfileRead)
def create_or_update_profile(payload: ProfileCreate, db: Session = Depends(get_db)) -> ProfileRead:
    profile = _get_or_create_profile(db)

    for field, value in payload.model_dump().items():
        if value is None:
            continue
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return ProfileRead.model_validate(profile, from_attributes=True)


@router.put("/profile", response_model=ProfileRead)
def update_profile(payload: ProfileCreate, db: Session = Depends(get_db)) -> ProfileRead:
    return create_or_update_profile(payload, db)


@router.get("/cvs", response_model=list[GeneratedCVRead])
def list_cvs(db: Session = Depends(get_db)) -> list[GeneratedCVRead]:
    cvs = db.query(GeneratedCVModel).order_by(GeneratedCVModel.created_at.desc()).all()
    return [GeneratedCVRead.model_validate(cv, from_attributes=True) for cv in cvs]


@router.post("/cvs", response_model=GeneratedCVRead)
def create_cv(payload: GeneratedCVCreate, db: Session = Depends(get_db)) -> GeneratedCVRead:
    profile = _get_or_create_profile(db)
    cv_payload = payload.model_dump()
    cv_payload["profile_id"] = profile.id
    cv = GeneratedCVModel(**cv_payload)
    db.add(cv)
    db.commit()
    db.refresh(cv)
    return GeneratedCVRead.model_validate(cv, from_attributes=True)


@router.get("/cvs/{cv_id}", response_model=GeneratedCVRead)
def get_cv(cv_id: int, db: Session = Depends(get_db)) -> GeneratedCVRead:
    cv = db.query(GeneratedCVModel).filter(GeneratedCVModel.id == cv_id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")
    return GeneratedCVRead.model_validate(cv, from_attributes=True)


@router.delete("/cvs/{cv_id}", status_code=204)
def delete_cv(cv_id: int, db: Session = Depends(get_db)) -> None:
    cv = db.query(GeneratedCVModel).filter(GeneratedCVModel.id == cv_id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")
    db.delete(cv)
    db.commit()


@router.get("/saved-jobs", response_model=list[SavedJobRead])
def list_saved_jobs(db: Session = Depends(get_db)) -> list[SavedJobRead]:
    jobs = db.query(SavedJobModel).order_by(SavedJobModel.saved_at.desc()).all()
    return [SavedJobRead.model_validate(job, from_attributes=True) for job in jobs]


@router.post("/saved-jobs", response_model=SavedJobRead)
def save_job(payload: SavedJobCreate, db: Session = Depends(get_db)) -> SavedJobRead:
    existing = db.query(SavedJobModel).filter(SavedJobModel.external_id == payload.external_id).first()
    if existing:
        return SavedJobRead.model_validate(existing, from_attributes=True)

    profile = _get_or_create_profile(db)
    job_payload = payload.model_dump()
    job_payload["profile_id"] = profile.id
    job = SavedJobModel(**job_payload)
    db.add(job)
    db.commit()
    db.refresh(job)
    return SavedJobRead.model_validate(job, from_attributes=True)


@router.delete("/saved-jobs/{job_id}", status_code=204)
def delete_saved_job(job_id: int, db: Session = Depends(get_db)) -> None:
    job = db.query(SavedJobModel).filter(SavedJobModel.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    db.delete(job)
    db.commit()
