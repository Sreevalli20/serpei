# Proofline — Evidence Investigation Platform

[![SerpApi India Hackathon 2026](https://img.shields.io/badge/SerpApi%20India%20Hackathon-2026-059669?style=flat-square)](https://serpapi.com)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/Frontend-React%2019-2563eb?style=flat-square)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178c6?style=flat-square)](https://www.typescriptlang.org)
[![Python 3.14](https://img.shields.io/badge/Python-3.14-3776AB?style=flat-square)](https://www.python.org)

Proofline is a professional evidence-investigation workspace engineered for researchers, analysts, journalists, and students. It enables users to investigate a question using live web search results, inspect what retrieved sources actually say, trace query provenance, evaluate potentially supporting and conflicting reporting, detect news syndication duplicates, and export reproducible research dossiers.

**Built for the SerpApi India Hackathon 2026 — Knowledge & Public Interest Track**

---

## Table of Contents

1. [Core Principles & Truthfulness Model](#1-core-principles--truthfulness-model)
2. [Architecture & Service Boundary](#2-architecture--service-boundary)
3. [Original Features](#3-original-features)
4. [Quick Start (Frontend)](#4-quick-start-frontend)
5. [Quick Start (Python FastAPI Backend)](#5-quick-start-python-fastapi-backend)
6. [Render Deployment Guide](#6-render-deployment-guide)
7. [Backend API Contract](#7-backend-api-contract)
8. [Testing & Offline Evaluation Mode](#8-testing--offline-evaluation-mode)
9. [Adaptive Investigation Workflow](#9-adaptive-investigation-workflow)
10. [Security & Resource Constraints](#10-security--resource-constraints)

---

## 1. Core Principles & Truthfulness Model

1. **Observations vs. Verification**: Proofline makes an epistemological distinction between raw search observations (what third-party web authors published) and independently verified facts. The presence of a statement in a search snippet does not make it ground truth.
2. **Repetition $\neq$ Independent Corroboration**: News wire syndication (e.g. identical Reuters or AP copy printed across hundreds of local media portals) artificially multiplies result counts. Proofline identifies duplicate URLs and syndicated copy to prevent false impressions of consensus.
3. **Transparent Rule-Based Classification**: Classifications (*Potentially Supporting*, *Potentially Conflicting*, *Unclassified*, *Insufficient Context*) represent deterministic text pattern analysis against search snippets, not forensic reviews of paywalled or complete source articles.
4. **Honest Metadata**: If a publication date is absent in search engine metadata, it is labeled *"Publication date unavailable"*, never hallucinated. If a query hits upstream rate limits, the partial failure is disclosed.
5. **Strict Zero-Key Security**: SerpApi keys are never requested, stored, or bundled in the client code. The Python FastAPI backend on Render is the **sole component** authorized to access SerpApi.

---

## 2. Architecture & Service Boundary

```
┌─────────────────────────────────┐
│     Proofline Frontend (Vite)   │
│  - Query Composer & Validation  │
│  - Filterable Evidence Ledger   │
│  - Relationship Graph (SVG)     │
│  - Dossier Export (JSON / HTML) │
└───────────────┬─────────────────┘
                │ HTTP REST (/api/*)
                │ VITE_API_BASE_URL (Origin or Render host)
┌───────────────▼─────────────────┐
│   Python FastAPI Backend        │
│  - Adaptive Query Planning      │
│  - SerpApi Client (httpx)       │
│  - Rule-based Snippet Classifier│
│  - Syndication & Overlap Engine │
│  - Evidence-Gap Analysis        │
│  - Rate Limiting                │
└───────────────┬─────────────────┘
                │ HTTPS (Server-Side Only)
                │ SERPAPI_API_KEY from Render Environment
┌───────────────▼─────────────────┐
│            SerpApi              │
│  Google, News, Scholar Engines  │
└─────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 19 with TypeScript
- Vite for fast builds
- Tailwind CSS for styling
- Motion for animations
- No external LLM dependencies

**Backend:**
- Python 3.14 (compatible with 3.12)
- FastAPI with Pydantic validation
- httpx for async HTTP requests
- Uvicorn ASGI server
- No database (in-memory cache only)

**Deployment:**
- Render Free Web Service (512 MB RAM)
- Single service serving both frontend and backend
- Cold starts: ~30-60 seconds
- Ephemeral storage (data lost on restart)

---

## 3. Original Features

### 3.1 Adaptive Evidence Investigation

Proofline implements a multi-stage adaptive workflow without requiring an LLM:

**Stage A: Question Decomposition**
- Validates and normalizes the question
- Identifies central proposition, entities, time period
- Applies deterministic heuristics for scope constraints

**Stage B: Initial Discovery**
- Generates focused initial query based on scope (global/news/academic)
- Calls SerpApi with documented parameters
- Captures actual returned fields and request provenance

**Stage C: Evidence-Gap Analysis**
- Analyzes titles, snippets, URLs, domains, and dates
- Identifies practical gaps:
  - No relevant counterevidence found
  - Results concentrated on single domain
  - No primary or academic sources
  - Missing time-period coverage
  - Mostly duplicate URLs

**Stage D: Adaptive Follow-up**
- Uses remaining budget for targeted follow-up when justified
- Examples:
  - Search for counterclaim when results appear one-sided
  - Search for primary-source-oriented query when results are commentary
  - Add academic sources when missing
  - Record why each follow-up was chosen

**Stage E: Evidence Reconciliation**
- Normalizes results, deduplicates conservatively
- Groups by domain, detects possible reporting overlap
- Classifies potential relevance

**Stage F: Investigation Report**
- Structured report with original question, executed searches, source ledger
- Possible support, contradictions, unresolved findings
- Source-overlap warnings and evidence gaps
- Each finding traceable to retrieved source

### 3.2 Corroboration Integrity

Source-overlap analysis module implements:
- Exact URL duplicate detection
- Conservative URL canonicalization (removes tracking params, preserves path)
- Domain grouping
- Exact or near-identical snippet detection
- Explicit flags for possible syndicated reporting
- Clear distinction between observed duplication and inferred relationships

### 3.3 Contradiction Explorer

Three evidence categories with transparent rules:
- **Potentially Supports**: Contains corroborating, affirmative indicators
- **Potentially Conflicts**: Contains critical, skeptical, or refuting phrasing
- **Unclassified/Insufficient**: Descriptive context or ambiguous indicators

Each classification includes:
- Category and rule explanation
- Source URL and supporting snippet
- Uncertainty or missing information disclosure

Never assigns fabricated confidence percentages or truth probabilities.

### 3.4 Evidence Provenance & Reproducibility

Every investigation records:
- Server-generated investigation identifier
- Original question and timestamps
- Executed query text and search engine
- Request outcome and actual result count
- Source URL, title, snippet, publication date
- Retrieval timestamp and source domain
- Classification and explanation
- Duplicate/overlap relationships
- Failed queries and warnings
- Request-budget usage

---

## 4. Quick Start (Frontend)

### Prerequisites
- Node.js 20+

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Runs at `http://localhost:3000`.

### Type Checking & Linting
```bash
npm run lint
```

### Quality & Security Test Suite
```bash
npm run test
```

### Production Build
```bash
npm run build
```

---

## 5. Quick Start (Python FastAPI Backend)

The companion Python FastAPI backend is provided in `/backend`.

### Prerequisites
- Python 3.14 (or 3.12)
- SerpApi API Key from [serpapi.com](https://serpapi.com)

### Running Backend Locally
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

export SERPAPI_API_KEY="your_serpapi_private_key"
uvicorn main:app --reload --port 8000
```

### Running Backend Tests
```bash
cd backend
python -m pytest test_main.py -v
```

### Connecting Frontend to Backend
In `.env` (or via the in-app **Backend Settings** modal):
```env
VITE_API_BASE_URL="http://localhost:8000"
```

---

## 6. Render Deployment Guide

### Automated Deployment with render.yaml

The repository includes `render.yaml` for automated deployment:

```bash
# Push to GitHub, then:
# 1. Go to render.com
# 2. New service → Blueprint
# 3. Connect your repository
# 4. Render will auto-configure from render.yaml
```

### Manual Deployment

#### Deploying the Backend on Render
1. Create a new **Web Service** in Render.
2. Select your repository.
3. Configure:
   - **Runtime**: Python 3.14 (or 3.12)
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add the secret environment variable:
   - `SERPAPI_API_KEY`: `<Your Secret SerpApi Key>`
5. Copy your Render service URL (e.g., `https://proofline-backend.onrender.com`).

#### Environment Variables
- `SERPAPI_API_KEY` (required): Your SerpApi API key
- `SEARCH_TIMEOUT_SECONDS` (optional): Max time for SerpApi requests (default: 30)
- `MAX_SEARCHES_PER_INVESTIGATION` (optional): Max queries per investigation (default: 5)
- `APP_ENV` (optional): Environment mode (development/production)

#### Deploying the Frontend
1. Set the build output directory to `dist`.
2. Set Environment Variable:
   - `VITE_API_BASE_URL`: `https://proofline-backend.onrender.com`

### Resource Constraints
- Free tier: 512 MB RAM
- Cold starts: ~30-60 seconds for first request
- Ephemeral storage: data lost on restart
- No persistent database (in-memory cache only)
- Rate limiting: 10 requests per minute per IP

---

## 7. Backend API Contract

### Health Check
`GET /api/health`
```json
{
  "status": "ok",
  "search_provider": "serpapi",
  "serpapi_configured": true,
  "version": "1.0.0",
  "timestamp": "2026-10-10T00:00:00Z"
}
```

### Create Investigation
`POST /api/investigations`
```json
{
  "question": "Are companies actually adopting open-source AI models in production?",
  "scope": "global",
  "depth": "balanced"
}
```

Allowed `scope`: `"global"`, `"news"`, `"academic"`, `"regional"`.  
Allowed `depth`: `"quick"` (1 search), `"balanced"` (3 searches), `"deep"` (5 searches).

### Response Schema
```json
{
  "id": "inv-abc123def456",
  "question": "Are companies actually adopting open-source AI models in production?",
  "scope": "global",
  "depth": "balanced",
  "status": "completed",
  "createdat": "2026-10-10T00:00:00Z",
  "completedat": "2026-10-10T00:00:05Z",
  "queries": [
    {
      "engine": "google",
      "query": "enterprise adoption open source AI models production",
      "status": "success",
      "resultcount": 5
    }
  ],
  "results": [
    {
      "id": "res-123",
      "title": "Source Title",
      "url": "https://example.com/article",
      "domain": "example.com",
      "snippet": "Article snippet...",
      "publishedat": "2026-01-15",
      "retrievedat": "2026-10-10T00:00:01Z",
      "engine": "google",
      "query": "enterprise adoption open source AI models production",
      "classification": "supporting",
      "classificationreason": "Contains corroborating evidence indicators.",
      "duplicate_of": null
    }
  ],
  "summary": {
    "headline": "Retrieved 5 sources across 3 domains.",
    "supporting_count": 3,
    "conflicting_count": 1,
    "unclassified_count": 1,
    "insufficient_count": 0,
    "observation_notes": ["..."]
  },
  "warnings": []
}
```

---

## 8. Testing & Offline Evaluation Mode

To allow judges, reviewers, and evaluators to test all interface capabilities without requiring an active SerpApi key:
- Click **"Test & Review Without Live Backend"** on the home screen.
- Load either:
  1. **Fixture: AI Adoption** (Demonstrates multi-query synthesis, supporting/conflicting results, syndicated wire warnings, and missing publication dates).
  2. **Fixture: Partial Query Fail** (Demonstrates partial failure disclosure when one engine is rate-limited while others succeed).
- All views—including Evidence Ledger filtering, interactive relationship network, source inspection drawer, and HTML/JSON exports—can be thoroughly evaluated.

### Test Results

**Frontend Tests:**
```
Running Proofline Frontend Quality & Security Tests...
Passed: 37
Failed: 0
All Quality & Security Checks Passed Successfully.
```

**Backend Tests:**
```
======================= 27 passed, 17 warnings in 0.57s =======================
```

Test coverage includes:
- URL canonicalization and duplicate detection
- Domain extraction
- Snippet classification rules
- Evidence-gap analysis
- Adaptive follow-up logic
- Health check endpoints
- Input validation
- Error handling

---

## 9. Adaptive Investigation Workflow

### Search Budget Configuration

- **Quick**: 1 search request
- **Balanced**: Up to 3 search requests
- **Deep**: Up to 5 search requests

The initial query and any adaptive follow-up queries count against the same budget.

### Adaptive Follow-up Triggers

The system automatically adds follow-up queries when:

1. **One-sided evidence**: If initial results show only supporting indicators, search for counterclaims
2. **Missing academic sources**: If no scholarly results found, add Google Scholar query
3. **Missing news coverage**: If only general search results, add Google News query
4. **Insufficient diversity**: If results concentrated on single domain, search alternative sources

### Evidence-Gap Warnings

The system reports:
- Domain concentration warnings
- Missing publication date counts
- Duplicate/syndicated content flags
- Classification imbalance indicators
- Missing source type warnings

---

## 10. Security & Resource Constraints

### Security Architecture

- **SerpApi Key Security**: Server-side only, never exposed to frontend
- **Input Validation**: Pydantic models with length and type constraints
- **Rate Limiting**: 10 requests per minute per IP (production only)
- **Request Size Limits**: Bounded result counts and response sizes
- **Error Sanitization**: Sensitive details removed from error responses
- **Safe External Links**: Only HTTP/HTTPS allowed for source links
- **No Code Execution**: Never executes returned content
- **No Arbitrary URL Fetching**: Backend does not fetch source URLs

### Resource Efficiency

- **Bounded Concurrency**: No unbounded concurrent searches
- **Request Timeouts**: Configurable timeout (default 30s)
- **Memory Management**: No persistent local-storage dependency
- **No Heavy ML Models**: Lightweight rule-based classification
- **No Browser Automation**: Direct API calls only

### Honest Limitations

- **Cold Starts**: Free tier requires ~30-60s warm-up time
- **Ephemeral Storage**: Investigation history lost on restart
- **Snippet Limitation**: Only search metadata, not full article content
- **Classification Scope**: Rule-based snippet analysis, not forensic verification
- **Search Engine Coverage**: Limited to SerpApi-supported engines
- **Rate Limits**: Respects SerpApi account quota

---

## Files Changed

### Backend Enhancements
- `backend/main.py`: 
  - Added static file serving for frontend production build (dist/ folder)
  - Integrated FastAPI StaticFiles for serving frontend assets
  - Added FileResponse for serving index.html
  - Implemented adaptive evidence-gap analysis, URL canonicalization, domain grouping, rate limiting middleware, enhanced classification rules
- `backend/requirements.txt`: Added pytest and pytest-asyncio for testing
- `backend/test_main.py`: Comprehensive test suite (27 tests, all passing)

### Deployment Configuration
- `render.yaml`: 
  - Updated for single-service deployment (Python serves both frontend and backend)
  - Configured Python 3.14.6 runtime (Render-supported version)
  - Added build command for frontend npm install/build and backend pip install
  - Updated start command to run uvicorn from backend directory
- `.env.example`: Updated with all environment variable documentation
- `.gitignore`: Verified to exclude .env files and venv/

### Frontend
- No structural changes (existing UI already complete)
- Production build verified (dist/ generated successfully)
- All 37 frontend tests passing

---

## Environment Variables Required

**Backend (Render or local):**
- `SERPAPI_API_KEY`: Your SerpApi API key (required)
- `SEARCH_TIMEOUT_SECONDS`: Max request timeout in seconds (optional, default: 30)
- `MAX_SEARCHES_PER_INVESTIGATION`: Max queries per investigation (optional, default: 5)
- `APP_ENV`: Environment mode (optional, default: development)

**Frontend (local):**
- `VITE_API_BASE_URL`: Backend URL (optional, defaults to same origin)

---

## Deployment Steps

### 1. Deploy to Render

```bash
# Option A: Automatic with render.yaml
git init
git add .
git commit -m "Initial commit"
git push origin main
# Then use render.yaml blueprint in Render dashboard

# Option B: Manual
# Create web service in Render with settings from render.yaml
# Set SERPAPI_API_KEY in environment variables
```

### 2. Local Development

```bash
# Terminal 1: Backend
cd backend
export SERPAPI_API_KEY="your_key"
uvicorn main:app --reload --port 8000

# Terminal 2: Frontend
npm run dev
# Open http://localhost:3000
```

---

## Demonstration Plan (3 Minutes)

1. **Open Application** (0:00-0:30)
   - Show polished UI with dark theme
   - Demonstrate health check (backend status)
   - Show test fixture mode for offline evaluation

2. **Run Investigation** (0:30-1:30)
   - Enter question: "Are companies adopting open-source AI models?"
   - Select scope: Global, depth: Balanced
   - Show loading states with truthful progress
   - Display evidence overview with metrics

3. **Explore Results** (1:30-2:30)
   - Show evidence ledger with filters
   - Demonstrate contradiction explorer (supporting vs conflicting)
   - Show duplicate detection and domain grouping
   - Inspect source details with provenance

4. **Export & Report** (2:30-3:00)
   - Show JSON export with full provenance
   - Show HTML report generation
   - Highlight evidence gaps and warnings
   - Conclude with technical features

---

## Implementation Session Summary

This session completed the integration of the frontend and backend into a single deployable service:

### Backend Integration
- Added static file serving capability to FastAPI backend using `StaticFiles` and `FileResponse`
- Backend now serves the production frontend build from the `dist/` folder
- Root endpoint `/` returns the React SPA
- API endpoints remain at `/api/*`
- Both frontend and backend are served from the same FastAPI process

### Render Configuration
- Updated `render.yaml` for single-service deployment
- Configured Python 3.14.6 runtime (fully supported by Render as of 2026-02-11)
- Build command: `npm install && npm run build && cd backend && pip install -r requirements.txt`
- Start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- Removed disk mount (not needed for in-memory cache only architecture)

### Verification
- Tested backend locally: successfully serves frontend at `/` and API at `/api/health`
- All backend tests pass (27/27)
- All frontend tests pass (37/37)
- Production build generates successfully
- Python 3.14.6 verified locally; Render supports 3.14.3+ by default for new services
- .gitignore properly excludes .env files
- No hardcoded credentials in source code

### Remaining for Full Deployment
1. Initialize git repository: `git init`
2. Add remote: `git remote add origin https://github.com/Sreevalli20/serpei.git`
3. Commit changes: `git add . && git commit -m "Complete Proofline implementation"`
4. Push to GitHub: `git push -u origin main`
5. Connect repository to Render and set SERPAPI_API_KEY as secret environment variable
6. Deploy via render.yaml blueprint or manual web service creation

---

## Known Limitations

1. **Snippet-Only Analysis**: Classifications based on search snippets, not full articles
2. **Cold Start Latency**: Free Render tier requires 30-60s warm-up
3. **Ephemeral Cache**: Investigation history lost on service restart
4. **SerpApi Quota**: Dependent on account search credits
5. **Search Engine Bias**: Results reflect search engine ranking, not independent assessment
6. **No Persistence**: No database for long-term investigation storage

---

## Real SerpApi Integration Status

**Not Verified**: No SerpApi credentials were available in the local environment during this implementation session. The backend code is fully functional and tested with mocks, but live integration testing requires a valid API key. The test suite validates all logic without requiring live calls.

**To verify live integration** (once credentials are configured):
1. Set `SERPAPI_API_KEY` in the environment (local or Render)
2. Run backend locally: `cd backend && uvicorn main:app --host 0.0.0.0 --port 8000`
3. Submit a test investigation via the frontend or API
4. Verify actual SerpApi responses are returned
5. Check the response schema matches the documented contract

---

## Verification Status

✅ **Frontend Tests**: 37 passed, 0 failed  
✅ **Backend Tests**: 27 passed, 0 failed  
✅ **Production Build**: Successful (dist/ generated)  
✅ **Python 3.14 Compatibility**: Verified (Python 3.14.6 tested locally; Render supports 3.14.3+)  
✅ **Dependency Installation**: Successful  
✅ **Backend Serves Frontend**: Verified (FastAPI serves dist/ static files correctly)  
✅ **Health Check Endpoint**: Verified (returns proper JSON response)  
✅ **.gitignore Security**: Verified (.env excluded, no credentials in tracked files)  
⚠️ **Live SerpApi Integration**: Not tested (no credentials available in local environment)  
⚠️ **Render Deployment**: Not deployed (requires git repository initialization and remote setup)
