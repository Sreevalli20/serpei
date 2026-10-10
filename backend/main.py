"""
Proofline FastAPI Backend
Designed for SerpApi India Hackathon 2026.
Deployable to Render with Python 3.14 / 3.12 runtime.

This backend is the SOLE authorized component permitted to access SerpApi.
The frontend never handles, stores, or transmits SerpApi credentials.
"""

import os
import re
import time
import uuid
import urllib.parse
from typing import List, Optional, Literal, Dict, Set
from datetime import datetime, timezone
from collections import defaultdict
from pathlib import Path
import httpx
from fastapi import FastAPI, HTTPException, status, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

SERPAPI_API_KEY = os.getenv("SERPAPI_API_KEY", "")

# Configuration from environment
SEARCH_TIMEOUT_SECONDS = int(os.getenv("SEARCH_TIMEOUT_SECONDS", "30"))
MAX_SEARCHES_PER_INVESTIGATION = int(os.getenv("MAX_SEARCHES_PER_INVESTIGATION", "5"))
APP_ENV = os.getenv("APP_ENV", "development")

app = FastAPI(
    title="Proofline Backend API",
    description="Evidence investigation backend powered by SerpApi for the SerpApi India Hackathon 2026.",
    version="1.0.0"
)

# Allow CORS for development and deployed frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for investigation persistence if deployed together
INVESTIGATION_CACHE = {}

# Mount static files for frontend production build
# The dist folder is built from the frontend Vite app
frontend_dist_path = Path(__file__).parent.parent / "dist"
if frontend_dist_path.exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_dist_path / "assets")), name="assets")
    
    @app.get("/")
    async def serve_frontend():
        """Serve the frontend SPA index.html."""
        return FileResponse(str(frontend_dist_path / "index.html"))

# Simple in-memory rate limiting (per IP)
RATE_LIMIT_DB: Dict[str, List[float]] = defaultdict(list)
RATE_LIMIT_REQUESTS_PER_MINUTE = 10

# --- Request & Response Models ---

class InvestigationRequest(BaseModel):
    question: str = Field(..., min_length=5, max_length=500)
    scope: Literal["global", "news", "academic", "regional"] = "global"
    depth: Literal["quick", "balanced", "deep"] = "balanced"

class ExecutedQuery(BaseModel):
    engine: str
    query: str
    status: Literal["success", "failed", "rate_limited"]
    resultcount: int
    error: Optional[str] = None

class SourceResult(BaseModel):
    id: str
    title: str
    url: str
    domain: str
    snippet: str
    publishedat: Optional[str] = None
    retrievedat: str
    engine: str
    query: str
    classification: Literal["supporting", "conflicting", "unclassified", "insufficient_context"]
    classificationreason: str
    duplicate_of: Optional[str] = None

class InvestigationSummary(BaseModel):
    headline: str
    supporting_count: int
    conflicting_count: int
    unclassified_count: int
    insufficient_count: int
    observation_notes: List[str]

class InvestigationResponse(BaseModel):
    id: str
    question: str
    scope: str
    depth: str
    status: Literal["completed", "partial_failure", "failed"]
    createdat: str
    completedat: str
    queries: List[ExecutedQuery]
    results: List[SourceResult]
    summary: Optional[InvestigationSummary] = None
    warnings: List[str]

# --- Helper Functions for Rule-based Classification ---

def extract_domain(url: str) -> str:
    try:
        parsed = urllib.parse.urlparse(url)
        netloc = parsed.netloc.lower()
        if netloc.startswith("www."):
            netloc = netloc[4:]
        return netloc or "unknown"
    except Exception:
        return "unknown"

def classify_snippet(question: str, snippet: str, title: str) -> tuple[str, str]:
    """
    Deterministic rule-based classification based on lexical indicators in snippet text.
    Classifications are rule-based interpretations, NOT independent forensic audits.
    """
    text = f"{title} {snippet}".lower()
    
    # Conflict/Negation markers
    conflict_patterns = [
        r"\b(disputes?|refutes?|denies?|debunked|false|untrue|myth|hoax)\b",
        r"\b(little evidence|no evidence|fails? to show|contrary to)\b",
        r"\b(unlikely|skeptical|hurdles|obstacles|drawbacks|limitations)\b",
        r"\b(opposes?|contradicts?|counter(s|-evidence)?|pushback)\b"
    ]
    
    # Support/Affirmation markers
    support_patterns = [
        r"\b(confirms?|proves?|demonstrates?|verifies?|established)\b",
        r"\b(shows? that|evidence suggests|study finds|adoption grows?)\b",
        r"\b(successful(ly)?|deployed|in production|adopted|milestone)\b",
        r"\b(accelerat(ed|ing)|surpasses?|effective|benefits?)\b"
    ]
    
    is_conflict = any(re.search(pat, text) for pat in conflict_patterns)
    is_support = any(re.search(pat, text) for pat in support_patterns)
    
    if is_conflict and not is_support:
        return "conflicting", "Snippet contains critical, skeptical, or refuting phrasing regarding the core premise."
    if is_support and not is_conflict:
        return "supporting", "Snippet contains corroborating, affirmative, or validating evidence indicators."
    if len(snippet.strip()) < 40:
        return "insufficient_context", "Snippet length is insufficient to assess evidential stance."
    
    return "unclassified", "Contains descriptive context or ambiguous indicators without a dominant positive or negative stance."


def canonicalize_url(url: str) -> str:
    """
    Conservative URL canonicalization for duplicate detection.
    Removes tracking parameters but preserves path structure.
    """
    try:
        parsed = urllib.parse.urlparse(url)
        # Remove common tracking/query parameters
        params_to_remove = {
            'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
            'fbclid', 'gclid', 'msclkid', '_ga', '_gid', 'ref', 'source'
        }
        query_params = [
            (k, v) for k, v in urllib.parse.parse_qsl(parsed.query)
            if k.lower() not in params_to_remove
        ]
        new_query = urllib.parse.urlencode(query_params)
        canonical = urllib.parse.urlunparse((
            parsed.scheme,
            parsed.netloc.lower(),
            parsed.path,
            parsed.params,
            new_query,
            ''  # Remove fragment
        ))
        return canonical
    except Exception:
        return url.lower()


def analyze_evidence_gaps(results: List[SourceResult], queries: List[ExecutedQuery]) -> List[str]:
    """
    Analyze collected evidence for gaps that justify adaptive follow-up queries.
    Returns list of observed limitations, not proof that evidence doesn't exist.
    """
    gaps = []
    
    if not results:
        gaps.append("No results retrieved from any search engine.")
        return gaps
    
    # Check for domain concentration
    domains = [r.domain for r in results]
    domain_counts = defaultdict(int)
    for d in domains:
        domain_counts[d] += 1
    if len(domain_counts) == 1:
        gaps.append(f"All results from single domain: {list(domain_counts.keys())[0]}. Consider alternative sources.")
    elif len(domain_counts) <= 2 and len(results) > 5:
        gaps.append(f"Results concentrated on {len(domain_counts)} domains only. May indicate limited source diversity.")
    
    # Check for classification imbalance
    classifications = [r.classification for r in results]
    supporting = sum(1 for c in classifications if c == "supporting")
    conflicting = sum(1 for c in classifications if c == "conflicting")
    if supporting > 0 and conflicting == 0 and len(results) > 3:
        gaps.append("Initial results show only supporting indicators. Consider searching for counterclaims or critiques.")
    if conflicting > 0 and supporting == 0 and len(results) > 3:
        gaps.append("Initial results show only conflicting indicators. Consider searching for supporting evidence or examples.")
    
    # Check for missing academic sources
    engines_used = set(q.engine for q in queries if q.status == "success")
    if "google_scholar" not in engines_used and len(results) > 5:
        gaps.append("No academic sources retrieved. Consider scholarly queries for empirical studies.")
    
    # Check for missing publication dates
    missing_dates = sum(1 for r in results if not r.publishedat)
    if missing_dates > len(results) * 0.5:
        gaps.append(f"{missing_dates} of {len(results)} results lack publication date metadata. Time relevance uncertain.")
    
    # Check for duplicate concentration
    duplicates = sum(1 for r in results if r.duplicate_of)
    if duplicates > len(results) * 0.3:
        gaps.append(f"{duplicates} results are duplicates or syndicated copies. Independent corroboration may be overstated.")
    
    return gaps


def generate_adaptive_followup(
    question: str,
    results: List[SourceResult],
    queries: List[ExecutedQuery],
    remaining_budget: int
) -> Optional[tuple[str, str]]:
    """
    Generate adaptive follow-up query when evidence gaps justify it.
    Returns (engine, query_string) or None if no follow-up is justified.
    """
    if remaining_budget <= 0:
        return None
    
    # Analyze current results
    domains = set(r.domain for r in results)
    classifications = [r.classification for r in results]
    supporting = sum(1 for c in classifications if c == "supporting")
    conflicting = sum(1 for c in classifications if c == "conflicting")
    engines_used = set(q.engine for q in queries if q.status == "success")
    
    # Rule 1: Search for counterclaims if one-sided
    if supporting > 2 and conflicting == 0 and "google" in engines_used:
        return ("google", f"{question} criticism controversy debate counterclaim")
    
    # Rule 2: Search for supporting evidence if only conflicting
    if conflicting > 2 and supporting == 0 and "google" in engines_used:
        return ("google", f"{question} evidence support verification confirm")
    
    # Rule 3: Add academic perspective if missing and budget allows
    if "google_scholar" not in engines_used and len(results) >= 3:
        return ("google_scholar", f"{question} empirical study research analysis")
    
    # Rule 4: Add news perspective if only general search
    if "google_news" not in engines_used and len(results) >= 3:
        return ("google_news", question)
    
    # No justified follow-up
    return None


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """
    Simple per-IP rate limiting using in-memory storage.
    Limits to 10 requests per minute per IP address.
    """
    if APP_ENV == "development":
        # Skip rate limiting in development
        return await call_next(request)
    
    # Get client IP (consider X-Forwarded-For in production)
    client_ip = request.client.host if request.client else "unknown"
    
    # Clean old entries (older than 1 minute)
    now = time.time()
    RATE_LIMIT_DB[client_ip] = [
        ts for ts in RATE_LIMIT_DB[client_ip]
        if now - ts < 60
    ]
    
    # Check limit
    if len(RATE_LIMIT_DB[client_ip]) >= RATE_LIMIT_REQUESTS_PER_MINUTE:
        return HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Maximum 10 requests per minute."
        )
    
    # Record this request
    RATE_LIMIT_DB[client_ip].append(now)
    
    # Process request
    response = await call_next(request)
    return response

# --- API Endpoints ---

@app.get("/api/health")
async def health_check():
    """Confirms backend service health and SerpApi configuration status."""
    has_key = bool(SERPAPI_API_KEY and len(SERPAPI_API_KEY.strip()) > 5)
    return {
        "status": "ok",
        "search_provider": "serpapi",
        "serpapi_configured": has_key,
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.post("/api/investigations", response_model=InvestigationResponse)
async def create_investigation(req: InvestigationRequest):
    """
    Executes live search queries via SerpApi and returns a structured evidence ledger.
    Implements adaptive follow-up queries based on evidence-gap analysis.
    """
    if not SERPAPI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SERPAPI_API_KEY is not configured on the Render backend environment."
        )

    investigation_id = f"inv-{uuid.uuid4().hex[:12]}"
    created_at = datetime.now(timezone.utc).isoformat()
    
    # Determine search budget based on depth
    budget_map = {"quick": 1, "balanced": 3, "deep": 5}
    max_queries = min(budget_map.get(req.depth, 3), MAX_SEARCHES_PER_INVESTIGATION)
    
    # Plan initial query formulation based on scope & depth
    queries_to_run = []
    clean_q = req.question.strip().rstrip("?").strip()
    
    if req.scope == "news":
        queries_to_run.append(("google_news", clean_q))
        if max_queries > 1:
            queries_to_run.append(("google", f"{clean_q} news reports latest"))
    elif req.scope == "academic":
        queries_to_run.append(("google_scholar", clean_q))
        if max_queries > 1:
            queries_to_run.append(("google", f"{clean_q} research study empirical data"))
    else: # global / regional
        queries_to_run.append(("google", clean_q))
        if max_queries > 1:
            queries_to_run.append(("google", f"{clean_q} evidence analysis"))
        if max_queries > 2:
            queries_to_run.append(("google_news", clean_q))

    executed_queries: List[ExecutedQuery] = []
    collected_results: List[SourceResult] = []
    warnings: List[str] = []
    seen_urls: Dict[str, str] = {}
    seen_snippets: Dict[str, str] = {}
    domain_groups: Dict[str, List[str]] = defaultdict(list)

    async with httpx.AsyncClient(timeout=float(SEARCH_TIMEOUT_SECONDS)) as client:
        query_index = 0
        while query_index < len(queries_to_run) and len(executed_queries) < max_queries:
            engine, query_str = queries_to_run[query_index]
            query_index += 1
            
            serp_params = {
                "api_key": SERPAPI_API_KEY,
                "engine": engine,
                "q": query_str,
                "num": 5 if req.depth == "quick" else 8,
            }
            
            try:
                resp = await client.get("https://serpapi.com/search.json", params=serp_params)
                
                if resp.status_code == 429:
                    executed_queries.append(ExecutedQuery(
                        engine=engine,
                        query=query_str,
                        status="rate_limited",
                        resultcount=0,
                        error="SerpApi rate limit exceeded (HTTP 429)."
                    ))
                    warnings.append(f"Query on {engine} was rate limited.")
                    continue
                elif resp.status_code != 200:
                    executed_queries.append(ExecutedQuery(
                        engine=engine,
                        query=query_str,
                        status="failed",
                        resultcount=0,
                        error=f"SerpApi returned HTTP {resp.status_code}."
                    ))
                    warnings.append(f"Query on {engine} failed with status {resp.status_code}.")
                    continue
                
                data = resp.json()
                organic = data.get("organic_results") or data.get("news_results") or []
                count_added = 0
                
                for item in organic:
                    title = item.get("title") or "Untitled Source"
                    link = item.get("link") or ""
                    snippet = item.get("snippet") or item.get("summary") or ""
                    pub_date = item.get("date") or None
                    
                    if not link or not link.startswith("http"):
                        continue
                    
                    domain = extract_domain(link)
                    classification, reason = classify_snippet(req.question, snippet, title)
                    
                    # Canonicalize URL for duplicate detection
                    canonical_url = canonicalize_url(link)
                    
                    # Detect duplicate or syndicated copy
                    duplicate_of = None
                    if canonical_url in seen_urls:
                        duplicate_of = seen_urls[canonical_url]
                    elif snippet and snippet in seen_snippets:
                        duplicate_of = seen_snippets[snippet]
                    else:
                        seen_urls[canonical_url] = link
                        if snippet:
                            seen_snippets[snippet] = link
                    
                    # Track domain groups for overlap analysis
                    domain_groups[domain].append(link)
                    
                    res_id = f"res-{uuid.uuid4().hex[:8]}"
                    result = SourceResult(
                        id=res_id,
                        title=title,
                        url=link,
                        domain=domain,
                        snippet=snippet or "Snippet unavailable in search index metadata.",
                        publishedat=pub_date,
                        retrievedat=datetime.now(timezone.utc).isoformat(),
                        engine=engine,
                        query=query_str,
                        classification=classification,
                        classificationreason=reason,
                        duplicate_of=duplicate_of
                    )
                    collected_results.append(result)
                    count_added += 1

                executed_queries.append(ExecutedQuery(
                    engine=engine,
                    query=query_str,
                    status="success",
                    resultcount=count_added
                ))
                
                # Adaptive follow-up: check if evidence gaps justify another query
                remaining_budget = max_queries - len(executed_queries)
                if remaining_budget > 0 and len(collected_results) > 0:
                    followup = generate_adaptive_followup(
                        req.question,
                        collected_results,
                        executed_queries,
                        remaining_budget
                    )
                    if followup:
                        followup_engine, followup_query = followup
                        queries_to_run.append((followup_engine, followup_query))
                        warnings.append(f"Adaptive follow-up query added: {followup_engine} - '{followup_query}'")

            except httpx.TimeoutException:
                executed_queries.append(ExecutedQuery(
                    engine=engine,
                    query=query_str,
                    status="failed",
                    resultcount=0,
                    error=f"SerpApi request timed out after {SEARCH_TIMEOUT_SECONDS} seconds."
                ))
            except Exception as e:
                executed_queries.append(ExecutedQuery(
                    engine=engine,
                    query=query_str,
                    status="failed",
                    resultcount=0,
                    error=str(e)
                ))

    # Perform evidence-gap analysis
    evidence_gaps = analyze_evidence_gaps(collected_results, executed_queries)
    warnings.extend(evidence_gaps)
    
    # Analyze domain overlap
    for domain, urls in domain_groups.items():
        if len(urls) > 2:
            warnings.append(f"Domain concentration: {len(urls)} results from {domain}. May indicate limited source diversity.")

    # Determine overall status
    success_count = sum(1 for q in executed_queries if q.status == "success")
    if success_count == 0:
        overall_status = "failed"
    elif success_count < len(executed_queries):
        overall_status = "partial_failure"
    else:
        overall_status = "completed"

    # Compute rule-based summary
    sup_cnt = sum(1 for r in collected_results if r.classification == "supporting")
    con_cnt = sum(1 for r in collected_results if r.classification == "conflicting")
    unc_cnt = sum(1 for r in collected_results if r.classification == "unclassified")
    ins_cnt = sum(1 for r in collected_results if r.classification == "insufficient_context")
    unique_domains = len(set(r.domain for r in collected_results))
    duplicate_count = sum(1 for r in collected_results if r.duplicate_of)

    summary = InvestigationSummary(
        headline=f"Retrieved {len(collected_results)} sources across {unique_domains} domains.",
        supporting_count=sup_cnt,
        conflicting_count=con_cnt,
        unclassified_count=unc_cnt,
        insufficient_count=ins_cnt,
        observation_notes=[
            f"{sup_cnt} potential supporting indicators and {con_cnt} potential conflicting indicators identified via snippet pattern matching.",
            f"{duplicate_count} results flagged as duplicates or syndicated copies.",
            "Classifications represent rule-based text observations, not authoritative verification of complete source articles."
        ]
    )

    completed_at = datetime.now(timezone.utc).isoformat()
    response = InvestigationResponse(
        id=investigation_id,
        question=req.question,
        scope=req.scope,
        depth=req.depth,
        status=overall_status,
        createdat=created_at,
        completedat=completed_at,
        queries=executed_queries,
        results=collected_results,
        summary=summary,
        warnings=warnings
    )

    INVESTIGATION_CACHE[investigation_id] = response
    return response

@app.get("/api/investigations/{investigation_id}", response_model=InvestigationResponse)
async def get_investigation(investigation_id: str):
    """Retrieves an existing investigation by ID if cached in server session memory."""
    if investigation_id not in INVESTIGATION_CACHE:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation with ID '{investigation_id}' not found."
        )
    return INVESTIGATION_CACHE[investigation_id]
