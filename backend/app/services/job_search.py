import asyncio
import html
import re
from datetime import datetime, timezone
from typing import Any, Dict, List

import httpx

from app.schemas.profile import JobSearchResult
from app.services.ai_provider import get_ai_provider


REMOTE_OK_URL = "https://remoteok.com/api"
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
    """
    Infer whether a job may offer visa sponsorship from its description.

    Returns:
        "Yes", "No", or "Unknown".
    """
    text = (description or "").lower()

    negative_phrases = (
        "must already have work authorization",
        "must be authorized to work",
        "no sponsorship available",
        "unable to sponsor",
        "cannot sponsor",
        "will not sponsor",
        "without sponsorship",
    )

    positive_phrases = (
        "visa sponsorship available",
        "visa sponsorship",
        "relocation support",
        "work permit sponsorship",
        "immigration support",
        "sponsor a visa",
        "sponsorship provided",
    )

    if any(phrase in text for phrase in negative_phrases):
        return "No"

    if any(phrase in text for phrase in positive_phrases):
        return "Yes"

    return "Unknown"


def normalize_text(value: str) -> str:
    """Decode HTML entities, remove tags, and normalize whitespace."""
    text = value or ""

    for _ in range(3):
        decoded = html.unescape(text)
        if decoded == text:
            break
        text = decoded

    text = re.sub(r"<script\b[^>]*>.*?</script>", " ", text, flags=re.I | re.S)
    text = re.sub(r"<style\b[^>]*>.*?</style>", " ", text, flags=re.I | re.S)
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
    text = re.sub(r"</(?:p|div|li|h[1-6])>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = text.replace("\xa0", " ")

    return re.sub(r"\s+", " ", text).strip()


def clean_description(value: str, max_length: int = 1200) -> str:
    """Return a clean, readable, and reasonably sized job description."""
    text = normalize_text(value)

    if len(text) <= max_length:
        return text

    shortened = text[:max_length].rsplit(" ", 1)[0].rstrip()
    return f"{shortened}…"


class JobSearchService:
    """
    Fetch jobs from multiple public job providers.

    Provider failures are isolated so one unavailable source does not prevent
    the other providers from returning results.
    """

    PROVIDER_TIMEOUT_SECONDS = 12
    MAX_CACHE_ENTRIES = 100

    def __init__(self) -> None:
        timeout = httpx.Timeout(
            timeout=8.0,
            connect=5.0,
            read=8.0,
            write=5.0,
            pool=5.0,
        )

        self.client = httpx.AsyncClient(
            timeout=timeout,
            follow_redirects=True,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 CareerPilot/1.0"
                ),
                "Accept": "application/json,text/html,application/xhtml+xml",
            },
        )

        self._cache: Dict[tuple, Dict[str, Any]] = {}
        self.ai_provider = get_ai_provider()

    async def close(self) -> None:
        """Close the shared HTTP client."""
        if not self.client.is_closed:
            await self.client.aclose()

    async def search(
        self,
        query: str,
        location: str,
        remote_only: bool,
        visa_sponsorship: bool,
        page: int,
        limit: int,
    ) -> Dict[str, Any]:
        """Search all configured providers concurrently and rank the results."""
        query = (query or "").strip()
        location = (location or "").strip()
        page = max(1, page)
        limit = max(1, min(limit, 100))

        cache_key = (
            query.lower(),
            location.lower(),
            remote_only,
            visa_sponsorship,
            page,
            limit,
        )

        cached_response = self._cache.get(cache_key)
        if cached_response is not None:
            return cached_response

        search_tasks = [
            (
                "remoteok",
                self._run_provider(
                    "remoteok",
                    self._search_remote_ok(query, location, remote_only),
                ),
            ),
            (
                "arbeitnow",
                self._run_provider(
                    "arbeitnow",
                    self._search_arbeitnow(query, location, remote_only),
                ),
            ),
            (
                "greenhouse",
                self._run_provider(
                    "greenhouse",
                    self._search_greenhouse(query, location, remote_only),
                ),
            ),
            (
                "lever",
                self._run_provider(
                    "lever",
                    self._search_lever(query, location, remote_only),
                ),
            ),
        ]

        provider_responses = await asyncio.gather(
            *(task for _, task in search_tasks),
            return_exceptions=True,
        )

        combined_results: List[JobSearchResult] = []
        successful_sources: List[str] = []
        errors: List[str] = []

        for (source_name, _), response in zip(search_tasks, provider_responses):
            if isinstance(response, Exception):
                errors.append(
                    f"{source_name} unavailable: "
                    f"{self._safe_error_message(response)}"
                )
                continue

            provider_jobs, provider_error = response

            if provider_error:
                errors.append(provider_error)
                continue

            successful_sources.append(source_name)
            combined_results.extend(provider_jobs)

        deduped_results = self._dedupe(combined_results)
        enriched_results = [
            self._enrich_result(job, query) for job in deduped_results
        ]

        if visa_sponsorship:
            enriched_results = [
                job
                for job in enriched_results
                if str(job.visa_sponsorship).lower() == "yes"
            ]

        enriched_results.sort(
            key=lambda item: (
                item.match_score,
                self._published_timestamp(item.published_at),
            ),
            reverse=True,
        )

        total_results = len(enriched_results)
        start_index = (page - 1) * limit
        end_index = start_index + limit
        paged_results = enriched_results[start_index:end_index]

        response: Dict[str, Any] = {
            "results": paged_results,
            "sources": successful_sources,
            "errors": errors,
            "total": total_results,
            "page": page,
            "limit": limit,
            "has_more": end_index < total_results,
        }

        self._store_cache(cache_key, response)
        return response

    async def _run_provider(
        self,
        source_name: str,
        provider_coroutine: Any,
    ) -> tuple[List[JobSearchResult], str]:
        """Run a provider with a hard timeout."""
        try:
            jobs = await asyncio.wait_for(
                provider_coroutine,
                timeout=self.PROVIDER_TIMEOUT_SECONDS,
            )
            return jobs, ""

        except asyncio.TimeoutError:
            return (
                [],
                (
                    f"{source_name} timed out after "
                    f"{self.PROVIDER_TIMEOUT_SECONDS} seconds"
                ),
            )

        except httpx.HTTPStatusError as exc:
            return [], f"{source_name} returned HTTP {exc.response.status_code}"

        except httpx.RequestError as exc:
            return (
                [],
                (
                    f"{source_name} connection error: "
                    f"{self._safe_error_message(exc)}"
                ),
            )

        except Exception as exc:
            return (
                [],
                (
                    f"{source_name} unavailable: "
                    f"{self._safe_error_message(exc)}"
                ),
            )

    def _store_cache(
        self,
        cache_key: tuple,
        response: Dict[str, Any],
    ) -> None:
        """Store a response and prevent unlimited cache growth."""
        if len(self._cache) >= self.MAX_CACHE_ENTRIES:
            oldest_key = next(iter(self._cache))
            self._cache.pop(oldest_key, None)

        self._cache[cache_key] = response

    def _safe_error_message(self, error: Exception) -> str:
        """Return a short error message safe for API responses."""
        message = str(error).strip()
        return (message or error.__class__.__name__)[:250]

    def _published_timestamp(self, published_at: Any) -> float:
        """Convert a published date into a timestamp for stable sorting."""
        if not published_at:
            return 0.0

        try:
            value = str(published_at).replace("Z", "+00:00")
            parsed = datetime.fromisoformat(value)

            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=timezone.utc)

            return parsed.timestamp()

        except (TypeError, ValueError):
            return 0.0

    async def _search_remote_ok(
        self,
        query: str,
        location: str,
        remote_only: bool,
    ) -> List[JobSearchResult]:
        """Search RemoteOK's public jobs API."""
        response = await self.client.get(
            REMOTE_OK_URL,
            params={"rewritten": "true"},
        )
        response.raise_for_status()
        payload = response.json()

        if not isinstance(payload, list):
            return []

        results: List[JobSearchResult] = []

        for index, item in enumerate(payload):
            if not isinstance(item, dict):
                continue

            if "position" not in item and "company" not in item:
                continue

            title = str(item.get("position") or "").strip()
            company = str(item.get("company") or "").strip()

            if not title or not company:
                continue

            description = clean_description(str(item.get("description") or ""))
            job_location = str(
                item.get("location")
                or item.get("candidate_required_location")
                or "Remote"
            ).strip()

            tags = item.get("tags") or []
            tag_text = " ".join(str(tag) for tag in tags if tag is not None)

            searchable_text = " ".join(
                [title, company, description, tag_text]
            )

            if query and not self._matches_query(
                title,
                searchable_text,
                query,
            ):
                continue

            is_remote = self._looks_remote(item)

            if remote_only and not is_remote:
                continue

            if location and not self._matches_location(
                job_location,
                location,
            ):
                if "remote" not in job_location.lower():
                    continue

            source_url = str(
                item.get("url") or item.get("apply_url") or ""
            ).strip()

            if source_url.startswith("/"):
                source_url = f"https://remoteok.com{source_url}"

            results.append(
                JobSearchResult(
                    external_id=str(
                        item.get("id")
                        or item.get("slug")
                        or f"remoteok-{company}-{title}-{index}"
                    ),
                    source="remoteok",
                    company=company,
                    title=title,
                    location=job_location or "Remote",
                    remote_type="remote" if is_remote else "hybrid",
                    salary=self._format_remote_ok_salary(item),
                    description=description,
                    source_url=source_url,
                    published_at=self._normalize_published_at(
                        item.get("date")
                        or item.get("published_at")
                        or item.get("epoch")
                    ),
                    visa_sponsorship=infer_visa_sponsorship(description),
                    match_score=0,
                )
            )

        return results

    async def _search_arbeitnow(
        self,
        query: str,
        location: str,
        remote_only: bool,
    ) -> List[JobSearchResult]:
        """Search ArbeitNow's public job-board API."""
        response = await self.client.get(ARBEITNOW_URL)
        response.raise_for_status()
        payload = response.json()

        if isinstance(payload, dict):
            jobs = payload.get("data") or payload.get("jobs") or []
        elif isinstance(payload, list):
            jobs = payload
        else:
            jobs = []

        if not isinstance(jobs, list):
            return []

        results: List[JobSearchResult] = []

        for index, item in enumerate(jobs):
            if not isinstance(item, dict):
                continue

            title = str(item.get("title") or "").strip()
            company = str(
                item.get("company_name") or item.get("company") or ""
            ).strip()

            if not title or not company:
                continue

            description = clean_description(str(item.get("description") or ""))
            job_location = str(
                item.get("location")
                or item.get("candidate_required_location")
                or "Remote"
            ).strip()

            tags = item.get("tags") or []
            tag_text = " ".join(str(tag) for tag in tags if tag is not None)
            remote_value = item.get("remote")

            is_remote = (
                remote_value is True
                or str(remote_value).lower() == "true"
                or "remote" in job_location.lower()
                or "remote" in tag_text.lower()
            )

            searchable_text = " ".join(
                [title, company, description, tag_text]
            )

            if query and not self._matches_query(
                title,
                searchable_text,
                query,
            ):
                continue

            if remote_only and not is_remote:
                continue

            if location and not self._matches_location(
                job_location,
                location,
            ):
                if not is_remote:
                    continue

            results.append(
                JobSearchResult(
                    external_id=str(
                        item.get("slug")
                        or item.get("id")
                        or f"arbeitnow-{company}-{title}-{index}"
                    ),
                    source="arbeitnow",
                    company=company,
                    title=title,
                    location=job_location or "Remote",
                    remote_type="remote" if is_remote else "onsite",
                    salary=str(
                        item.get("salary") or item.get("salary_text") or ""
                    ).strip(),
                    description=description,
                    source_url=str(
                        item.get("url") or item.get("job_url") or ""
                    ).strip(),
                    published_at=self._normalize_published_at(
                        item.get("created_at")
                        or item.get("published_at")
                        or item.get("date")
                    ),
                    visa_sponsorship=infer_visa_sponsorship(description),
                    match_score=0,
                )
            )

        return results

    def _format_remote_ok_salary(self, item: Dict[str, Any]) -> str:
        """Format RemoteOK minimum and maximum salary values."""
        existing_salary = str(item.get("salary") or "").strip()

        if existing_salary:
            return existing_salary

        salary_min = item.get("salary_min")
        salary_max = item.get("salary_max")

        if salary_min and salary_max:
            return f"${salary_min:,} - ${salary_max:,}"
        if salary_min:
            return f"From ${salary_min:,}"
        if salary_max:
            return f"Up to ${salary_max:,}"

        return ""

    def _normalize_published_at(self, value: Any) -> str:
        """Normalize common date formats into an ISO-8601 string."""
        if value is None or value == "":
            return datetime.now(timezone.utc).isoformat()

        if isinstance(value, (int, float)):
            try:
                return datetime.fromtimestamp(
                    value,
                    tz=timezone.utc,
                ).isoformat()
            except (OverflowError, OSError, ValueError):
                return datetime.now(timezone.utc).isoformat()

        text = str(value).strip()

        if text.isdigit():
            try:
                return datetime.fromtimestamp(
                    int(text),
                    tz=timezone.utc,
                ).isoformat()
            except (OverflowError, OSError, ValueError):
                return datetime.now(timezone.utc).isoformat()

        try:
            parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))

            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=timezone.utc)

            return parsed.isoformat()

        except ValueError:
            return text

    async def _search_greenhouse(
        self,
        query: str,
        location: str,
        remote_only: bool,
    ) -> List[JobSearchResult]:
        """Search configured Greenhouse company job boards."""
        results: List[JobSearchResult] = []

        async def fetch_board(
            board_name: str,
            board_url: str,
        ) -> List[JobSearchResult]:
            api_url = (
                "https://boards-api.greenhouse.io/v1/boards/"
                f"{board_name}/jobs"
            )

            response = await self.client.get(
                api_url,
                params={"content": "true"},
            )
            response.raise_for_status()
            payload = response.json()

            if not isinstance(payload, dict):
                return []

            jobs = payload.get("jobs") or []

            if not isinstance(jobs, list):
                return []

            board_results: List[JobSearchResult] = []

            for index, item in enumerate(jobs):
                if not isinstance(item, dict):
                    continue

                title = str(item.get("title") or "").strip()
                if not title:
                    continue

                location_data = item.get("location") or {}

                if isinstance(location_data, dict):
                    job_location = str(
                        location_data.get("name") or ""
                    ).strip()
                else:
                    job_location = str(location_data).strip()

                if not job_location:
                    job_location = "Not specified"

                description = clean_description(
                    str(item.get("content") or "")
                )

                searchable_text = " ".join(
                    [title, board_name, job_location, description]
                )

                if query and not self._matches_query(
                    title,
                    searchable_text,
                    query,
                ):
                    continue

                is_remote = (
                    "remote" in job_location.lower()
                    or "remote" in description.lower()
                )

                if remote_only and not is_remote:
                    continue

                if location and not self._matches_location(
                    job_location,
                    location,
                ):
                    if not is_remote:
                        continue

                board_results.append(
                    JobSearchResult(
                        external_id=str(
                            item.get("id")
                            or f"greenhouse-{board_name}-{index}"
                        ),
                        source="greenhouse",
                        company=board_name.title(),
                        title=title,
                        location=job_location,
                        remote_type="remote" if is_remote else "onsite",
                        salary="",
                        description=description,
                        source_url=str(
                            item.get("absolute_url") or board_url
                        ).strip(),
                        published_at=self._normalize_published_at(
                            item.get("updated_at")
                            or item.get("created_at")
                        ),
                        visa_sponsorship=infer_visa_sponsorship(description),
                        match_score=0,
                    )
                )

            return board_results

        board_tasks = [
            fetch_board(board_name, board_url)
            for board_name, board_url in GREENHOUSE_BOARDS.items()
        ]

        board_responses = await asyncio.gather(
            *board_tasks,
            return_exceptions=True,
        )

        for board_response in board_responses:
            if isinstance(board_response, Exception):
                continue
            results.extend(board_response)

        return results

    async def _search_lever(
        self,
        query: str,
        location: str,
        remote_only: bool,
    ) -> List[JobSearchResult]:
        """Search configured Lever company job boards."""
        results: List[JobSearchResult] = []

        async def fetch_board(
            company_name: str,
            board_url: str,
        ) -> List[JobSearchResult]:
            api_url = (
                "https://api.lever.co/v0/postings/"
                f"{company_name}"
            )

            response = await self.client.get(
                api_url,
                params={"mode": "json"},
            )
            response.raise_for_status()
            payload = response.json()

            if not isinstance(payload, list):
                return []

            board_results: List[JobSearchResult] = []

            for index, item in enumerate(payload):
                if not isinstance(item, dict):
                    continue

                title = str(item.get("text") or "").strip()
                if not title:
                    continue

                categories = item.get("categories") or {}
                if not isinstance(categories, dict):
                    categories = {}

                job_location = str(
                    categories.get("location")
                    or item.get("workplaceType")
                    or "Not specified"
                ).strip()

                team = str(categories.get("team") or "").strip()
                department = str(
                    categories.get("department") or ""
                ).strip()

                description_parts = [
                    str(item.get("descriptionPlain") or ""),
                    str(item.get("additionalPlain") or ""),
                ]

                lists = item.get("lists") or []

                if isinstance(lists, list):
                    for list_item in lists:
                        if not isinstance(list_item, dict):
                            continue

                        description_parts.append(
                            str(list_item.get("text") or "")
                        )
                        content = list_item.get("content") or ""

                        if isinstance(content, str):
                            description_parts.append(content)

                description = clean_description(
                    " ".join(description_parts)
                )

                searchable_text = " ".join(
                    [
                        title,
                        company_name,
                        job_location,
                        team,
                        department,
                        description,
                    ]
                )

                if query and not self._matches_query(
                    title,
                    searchable_text,
                    query,
                ):
                    continue

                workplace_type = str(
                    item.get("workplaceType") or ""
                ).lower()

                is_remote = (
                    workplace_type == "remote"
                    or "remote" in job_location.lower()
                    or "remote" in description.lower()
                )

                if remote_only and not is_remote:
                    continue

                if location and not self._matches_location(
                    job_location,
                    location,
                ):
                    if not is_remote:
                        continue

                if is_remote:
                    remote_type = "remote"
                elif workplace_type == "hybrid":
                    remote_type = "hybrid"
                else:
                    remote_type = "onsite"

                board_results.append(
                    JobSearchResult(
                        external_id=str(
                            item.get("id")
                            or f"lever-{company_name}-{index}"
                        ),
                        source="lever",
                        company=company_name.title(),
                        title=title,
                        location=job_location,
                        remote_type=remote_type,
                        salary=self._format_lever_salary(
                            item.get("salaryRange")
                        ),
                        description=description,
                        source_url=str(
                            item.get("hostedUrl")
                            or item.get("applyUrl")
                            or board_url
                        ).strip(),
                        published_at=self._normalize_published_at(
                            item.get("createdAt")
                        ),
                        visa_sponsorship=infer_visa_sponsorship(description),
                        match_score=0,
                    )
                )

            return board_results

        board_tasks = [
            fetch_board(company_name, board_url)
            for company_name, board_url in LEVER_BOARDS.items()
        ]

        board_responses = await asyncio.gather(
            *board_tasks,
            return_exceptions=True,
        )

        for board_response in board_responses:
            if isinstance(board_response, Exception):
                continue
            results.extend(board_response)

        return results

    def _format_lever_salary(self, salary_range: Any) -> str:
        """Format Lever salary-range information."""
        if not isinstance(salary_range, dict):
            return ""

        minimum = salary_range.get("min")
        maximum = salary_range.get("max")
        currency = str(
            salary_range.get("currency") or ""
        ).upper()
        interval = str(
            salary_range.get("interval") or ""
        ).lower()

        currency_symbols = {
            "USD": "$",
            "GBP": "£",
            "EUR": "€",
            "NGN": "₦",
        }

        symbol = currency_symbols.get(
            currency,
            f"{currency} " if currency else "",
        )

        def format_amount(value: Any) -> str:
            try:
                number = float(value)
                if number.is_integer():
                    return f"{symbol}{int(number):,}"
                return f"{symbol}{number:,.2f}"
            except (TypeError, ValueError):
                return ""

        minimum_text = format_amount(minimum)
        maximum_text = format_amount(maximum)

        if minimum_text and maximum_text:
            salary = f"{minimum_text} - {maximum_text}"
        elif minimum_text:
            salary = f"From {minimum_text}"
        elif maximum_text:
            salary = f"Up to {maximum_text}"
        else:
            return ""

        if interval:
            salary = f"{salary} per {interval}"

        return salary

    def _dedupe(
        self,
        results: List[JobSearchResult],
    ) -> List[JobSearchResult]:
        """Remove duplicate job listings."""
        seen = set()
        deduped: List[JobSearchResult] = []

        for result in results:
            company = str(result.company or "").strip().lower()
            title = str(result.title or "").strip().lower()
            location = str(result.location or "").strip().lower()
            external_id = str(
                result.external_id or ""
            ).strip().lower()
            source_url = str(result.source_url or "").strip().lower()

            key = (
                company,
                title,
                location,
                external_id or source_url,
            )
            fallback_key = (company, title, location)

            if key in seen or fallback_key in seen:
                continue

            seen.add(key)
            seen.add(fallback_key)
            deduped.append(result)

        return deduped

    def _matches_query(
        self,
        title: str,
        description: str,
        query: str,
    ) -> bool:
        """Return True when a meaningful query term appears."""
        if not query:
            return True

        query_terms = self._extract_keywords(query)
        if not query_terms:
            return True

        haystack = normalize_text(
            f"{title or ''} {description or ''}"
        ).lower()

        return any(term in haystack for term in query_terms)

    def _matches_location(
        self,
        value: str,
        location: str,
    ) -> bool:
        """Match a requested location against a provider location."""
        if not location:
            return True

        value_text = normalize_text(value).lower()
        location_text = normalize_text(location).lower()

        if not value_text:
            return False

        if location_text in value_text:
            return True

        requested_terms = {
            term
            for term in re.findall(r"[a-z0-9]+", location_text)
            if len(term) > 1
        }
        value_terms = set(re.findall(r"[a-z0-9]+", value_text))

        return bool(requested_terms.intersection(value_terms))

    def _looks_remote(self, item: Dict[str, Any]) -> bool:
        """Infer whether a provider job entry is remote."""
        remote_value = item.get("remote")

        if remote_value is True:
            return True

        if str(remote_value).strip().lower() in {
            "true",
            "yes",
            "remote",
        }:
            return True

        searchable_values = [
            item.get("location"),
            item.get("candidate_required_location"),
            item.get("workplaceType"),
            item.get("position"),
        ]

        tags = item.get("tags") or []

        if isinstance(tags, list):
            searchable_values.extend(tags)
        else:
            searchable_values.append(tags)

        combined_text = " ".join(
            str(value)
            for value in searchable_values
            if value is not None
        ).lower()

        return any(
            phrase in combined_text
            for phrase in (
                "remote",
                "work from home",
                "work-from-home",
                "distributed",
                "anywhere",
            )
        )

    def _enrich_result(
        self,
        job: JobSearchResult,
        query: str,
    ) -> JobSearchResult:
        """Add practical relevance scoring and matching explanations."""
        job_data = job.model_dump()
        query_keywords = self._extract_keywords(query)

        title_text = normalize_text(str(job.title or "")).lower()
        company_text = normalize_text(str(job.company or "")).lower()
        location_text = normalize_text(str(job.location or "")).lower()
        description_text = normalize_text(str(job.description or "")).lower()

        full_text = " ".join(
            [title_text, company_text, location_text, description_text]
        )

        matched_keywords = [
            keyword for keyword in query_keywords if keyword in full_text
        ]
        missing_keywords = [
            keyword for keyword in query_keywords if keyword not in full_text
        ]

        if not query_keywords:
            score = 70
        else:
            total_terms = max(1, len(query_keywords))
            matched_ratio = len(matched_keywords) / total_terms
            score = 35 + round(matched_ratio * 45)

            title_matches = sum(
                1 for keyword in query_keywords if keyword in title_text
            )
            score += min(18, title_matches * 9)

            normalized_query = normalize_text(query).lower()
            if normalized_query and normalized_query in title_text:
                score += 12

            role_groups = {
                "engineer": (
                    "engineer",
                    "engineering",
                    "developer",
                    "software",
                    "backend",
                    "frontend",
                    "fullstack",
                    "full-stack",
                ),
                "manager": (
                    "manager",
                    "management",
                    "lead",
                    "head",
                    "director",
                ),
                "designer": (
                    "designer",
                    "design",
                    "ux",
                    "ui",
                    "product design",
                ),
                "analyst": (
                    "analyst",
                    "analytics",
                    "data",
                    "intelligence",
                ),
            }

            for query_word, related_terms in role_groups.items():
                if query_word in query_keywords and any(
                    term in title_text for term in related_terms
                ):
                    score += 8

        if str(job.remote_type or "").lower() == "remote":
            score += 3

        if str(job.visa_sponsorship or "").lower() == "yes":
            score += 5

        if not description_text:
            score -= 5

        score = max(15, min(99, score))

        match_reasons: List[str] = []

        if matched_keywords:
            match_reasons.append(
                "Matched: " + ", ".join(matched_keywords[:4])
            )

        title_matches = [
            keyword for keyword in query_keywords if keyword in title_text
        ]
        if title_matches:
            match_reasons.append(
                "Role title matches: " + ", ".join(title_matches[:3])
            )

        if str(job.remote_type or "").lower() == "remote":
            match_reasons.append("Remote opportunity")

        if str(job.visa_sponsorship or "").lower() == "yes":
            match_reasons.append("Visa or relocation support mentioned")

        job_data["match_score"] = score
        job_data["matched_keywords"] = matched_keywords[:8]
        job_data["missing_keywords"] = missing_keywords[:8]
        job_data["match_reasons"] = match_reasons[:4]

        return JobSearchResult(**job_data)

    def _extract_keywords(self, text: str) -> List[str]:
        """Extract useful terms while removing common filler words."""
        stop_words = {
            "and",
            "the",
            "for",
            "with",
            "from",
            "that",
            "this",
            "your",
            "you",
            "are",
            "our",
            "job",
            "jobs",
            "role",
            "position",
            "work",
            "remote",
            "full",
            "time",
            "part",
            "looking",
            "search",
            "find",
            "near",
            "into",
            "who",
            "what",
            "where",
            "when",
            "have",
            "has",
            "will",
            "would",
            "should",
            "can",
            "could",
        }

        tokens = re.findall(
            r"[a-z0-9][a-z0-9+#.\-]*",
            (text or "").lower(),
        )

        keywords: List[str] = []
        seen = set()

        for token in tokens:
            cleaned = token.strip(".-")

            if len(cleaned) < 2:
                continue
            if cleaned in stop_words:
                continue
            if cleaned in seen:
                continue

            seen.add(cleaned)
            keywords.append(cleaned)

        return keywords[:12]


job_search_service = JobSearchService()


async def search_jobs(
    query: str,
    location: str,
    remote_only: bool,
    visa_sponsorship: bool,
    page: int,
    limit: int,
) -> Dict[str, Any]:
    """Public service function used by the FastAPI job-search endpoint."""
    return await job_search_service.search(
        query=query,
        location=location,
        remote_only=remote_only,
        visa_sponsorship=visa_sponsorship,
        page=page,
        limit=limit,
    )