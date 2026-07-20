import asyncio
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from urllib.parse import quote

import httpx

from app.schemas.profile import JobSearchResult
from app.services.ai_provider import get_ai_provider

REMOTE_OK_URL = "https://www.remoteok.com/api"
ARBEITNOW_URL = "https://www.arbeitnow.com/api/job-board-api"
GREENHOUSE_BOARDS = {
    "stripe": "https://boards.greenhouse.io/stripe",
    "notion": "https://boards.greenhouse.io/notion",
    "linear": "https://boards.greenhouse.io/linear",
}
LEVER_BOARDS = {
    "rippling": "https://jobs.lever.co/rippling",
    "brex": "https://jobs.lever.co/brex",
}


def infer_visa_sponsorship(description: str) -> str:
    text = description.lower()
    if "must already have work authorization" in text or "no sponsorship available" in text:
        return "No"
    if any(phrase in text for phrase in ["visa sponsorship available", "relocation support", "work permit sponsorship"]):
        return "Yes"
    return "Unknown"


def normalize_text(value: str) -> str:
    return re.sub(r"<[^>]+>", " ", value or "").replace("\xa0", " ").strip()


def clean_description(value: str) -> str:
    text = normalize_text(value)
    text = re.sub(r"\s+", " ", text)
    return text[:1800]


class JobSearchService:
    def __init__(self) -> None:
        self.client = httpx.AsyncClient(timeout=10.0)
        self._cache: Dict[tuple, List[JobSearchResult]] = {}
        self.ai_provider = get_ai_provider()

    async def close(self) -> None:
        await self.client.aclose()

    async def search(self, query: str, location: str, remote_only: bool, visa_sponsorship: bool, page: int, limit: int) -> Dict[str, Any]:
        cache_key = (query.lower(), location.lower(), remote_only, visa_sponsorship, page, limit)
        if cache_key in self._cache:
            return {"results": self._cache[cache_key], "sources": ["remoteok", "arbeitnow"], "errors": []}

        results: List[JobSearchResult] = []
        errors: List[str] = []
        sources: List[str] = []

        try:
            remote_ok_results = await self._search_remote_ok(query, location, remote_only)
            results.extend(remote_ok_results)
            sources.append("remoteok")
        except Exception as exc:  # pragma: no cover - network resilience
            errors.append(f"remoteok unavailable: {exc}")

        try:
            arbeitnow_results = await self._search_arbeitnow(query, location, remote_only)
            results.extend(arbeitnow_results)
            sources.append("arbeitnow")
        except Exception as exc:
            errors.append(f"arbeitnow unavailable: {exc}")

        try:
            greenhouse_results = await self._search_greenhouse(query, location, remote_only)
            results.extend(greenhouse_results)
            sources.append("greenhouse")
        except Exception as exc:
            errors.append(f"greenhouse unavailable: {exc}")

        try:
            lever_results = await self._search_lever(query, location, remote_only)
            results.extend(lever_results)
            sources.append("lever")
        except Exception as exc:
            errors.append(f"lever unavailable: {exc}")

        deduped_results = self._dedupe(results)
        normalized_results = [self._enrich_result(job, query) for job in deduped_results]
        normalized_results = sorted(normalized_results, key=lambda item: item.match_score, reverse=True)
        paged_results = normalized_results[(page - 1) * limit : page * limit]

        self._cache[cache_key] = paged_results
        return {"results": paged_results, "sources": sources, "errors": errors}

    async def _search_remote_ok(self, query: str, location: str, remote_only: bool) -> List[JobSearchResult]:
        params = {"rewritten": "true"}
        response = await self.client.get(REMOTE_OK_URL, params=params)
        response.raise_for_status()
        payload = response.json()
        results: List[JobSearchResult] = []
        for item in payload[:20]:
            if not isinstance(item, dict):
                continue
            title = str(item.get("position") or item.get("description") or "").strip()
            company = str(item.get("company") or "").strip()
            if not title or not company:
                continue
            if remote_only and not self._looks_remote(item):
                continue
            if location and not self._matches_location(str(item.get("location") or ""), location):
                continue
            description = clean_description(str(item.get("description") or ""))
            if query and not self._matches_query(title, description, query):
                continue
            results.append(
                JobSearchResult(
                    external_id=str(item.get("id") or f"remoteok-{len(results)}"),
                    source="remoteok",
                    company=company,
                    title=title,
                    location=str(item.get("location") or "Remote"),
                    remote_type="remote" if self._looks_remote(item) else "hybrid",
                    salary=str(item.get("salary") or ""),
                    description=description,
                    source_url=str(item.get("url") or ""),
                    published_at=str(item.get("published_at") or datetime.now(timezone.utc).isoformat()),
                    visa_sponsorship=infer_visa_sponsorship(description),
                    match_score=0,
                )
            )
        return results

    async def _search_arbeitnow(self, query: str, location: str, remote_only: bool) -> List[JobSearchResult]:
        response = await self.client.get(ARBEITNOW_URL)
        response.raise_for_status()
        payload = response.json()
        results: List[JobSearchResult] = []
        jobs = payload.get("jobs", []) if isinstance(payload, dict) else payload
        for item in jobs[:20]:
            if not isinstance(item, dict):
                continue
            title = str(item.get("title") or "").strip()
            company = str(item.get("company_name") or "").strip()
            if not title or not company:
                continue
            description = clean_description(str(item.get("description") or ""))
            if query and not self._matches_query(title, description, query):
                continue
            if remote_only and "remote" not in str(item.get("tags") or "").lower() and "remote" not in str(item.get("location") or "").lower():
                continue
            if location and not self._matches_location(str(item.get("location") or ""), location):
                continue
            results.append(
                JobSearchResult(
                    external_id=str(item.get("slug") or f"arbeitnow-{len(results)}"),
                    source="arbeitnow",
                    company=company,
                    title=title,
                    location=str(item.get("location") or "Remote"),
                    remote_type="remote" if "remote" in str(item.get("tags") or "").lower() else "hybrid",
                    salary=str(item.get("salary") or ""),
                    description=description,
                    source_url=str(item.get("url") or ""),
                    published_at=str(item.get("created_at") or datetime.now(timezone.utc).isoformat()),
                    visa_sponsorship=infer_visa_sponsorship(description),
                    match_score=0,
                )
            )
        return results

    async def _search_greenhouse(self, query: str, location: str, remote_only: bool) -> List[JobSearchResult]:
        results: List[JobSearchResult] = []
        for board_name, board_url in GREENHOUSE_BOARDS.items():
            if query and board_name not in query.lower() and not self._matches_query(board_name, "", query):
                pass
            try:
                response = await self.client.get(f"{board_url}/feed.xml")
                response.raise_for_status()
                text = response.text
                items = re.findall(r"<title>(.*?)</title>", text)
                for item in items[:5]:
                    if not item or item.lower() == "jobs":
                        continue
                    description = f"Greenhouse board posting for {item}"
                    if query and not self._matches_query(item, description, query):
                        continue
                    results.append(
                        JobSearchResult(
                            external_id=f"greenhouse-{board_name}-{len(results)}",
                            source="greenhouse",
                            company=board_name.title(),
                            title=item,
                            location=location or "Remote",
                            remote_type="remote" if remote_only else "hybrid",
                            salary="",
                            description=description,
                            source_url=board_url,
                            published_at=datetime.now(timezone.utc).isoformat(),
                            visa_sponsorship="Unknown",
                            match_score=0,
                        )
                    )
            except Exception:
                continue
        return results

    async def _search_lever(self, query: str, location: str, remote_only: bool) -> List[JobSearchResult]:
        results: List[JobSearchResult] = []
        for company_name, board_url in LEVER_BOARDS.items():
            try:
                response = await self.client.get(board_url)
                response.raise_for_status()
                text = response.text
                if "<title>" in text:
                    title_match = re.search(r"<title>(.*?)</title>", text, re.IGNORECASE | re.DOTALL)
                    title = title_match.group(1).strip() if title_match else company_name.title()
                    description = f"Lever board posting for {title}"
                    if query and not self._matches_query(title, description, query):
                        continue
                    results.append(
                        JobSearchResult(
                            external_id=f"lever-{company_name}-{len(results)}",
                            source="lever",
                            company=company_name.title(),
                            title=title,
                            location=location or "Remote",
                            remote_type="remote" if remote_only else "hybrid",
                            salary="",
                            description=description,
                            source_url=board_url,
                            published_at=datetime.now(timezone.utc).isoformat(),
                            visa_sponsorship="Unknown",
                            match_score=0,
                        )
                    )
            except Exception:
                continue
        return results

    def _dedupe(self, results: List[JobSearchResult]) -> List[JobSearchResult]:
        seen = set()
        deduped: List[JobSearchResult] = []
        for result in results:
            key = (result.source.lower(), result.external_id.lower(), result.company.lower(), result.title.lower(), result.location.lower())
            if key in seen:
                continue
            seen.add(key)
            deduped.append(result)
        return deduped

    def _matches_query(self, title: str, description: str, query: str) -> bool:
        if not query:
            return True
        query_terms = set(re.findall(r"[a-z0-9]+", query.lower()))
        haystack = " ".join([title.lower(), description.lower()])
        return any(term in haystack for term in query_terms)

    def _matches_location(self, value: str, location: str) -> bool:
        if not location:
            return True
        return location.lower() in value.lower() or any(term in value.lower() for term in location.lower().split())

    def _looks_remote(self, item: Dict[str, Any]) -> bool:
        return bool(item.get("remote")) or "remote" in str(item.get("location") or "").lower()

    def _enrich_result(self, job: JobSearchResult, query: str) -> JobSearchResult:
        keywords = self._extract_keywords(query or f"{job.title} {job.description}")
        match_score = 0
        if query:
            match_score = min(95, max(40, 60 + len(keywords) * 5))
        else:
            match_score = 70
        return JobSearchResult(
            **job.model_dump(),
            match_score=match_score,
            matched_keywords=keywords[:4],
            missing_keywords=[],
            match_reasons=[f"Matched {', '.join(keywords[:3]) or 'the role'}"] if keywords else [],
        )

    def _extract_keywords(self, text: str) -> List[str]:
        tokens = re.findall(r"[a-z0-9]+", text.lower())
        return [token for token in tokens if len(token) > 2][:8]


job_search_service = JobSearchService()


async def search_jobs(query: str, location: str, remote_only: bool, visa_sponsorship: bool, page: int, limit: int) -> Dict[str, Any]:
    return await job_search_service.search(query, location, remote_only, visa_sponsorship, page, limit)
