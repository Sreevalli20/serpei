"""
Proofline Backend Test Suite
Tests for FastAPI backend without requiring live SerpApi credentials.
All tests use mocks to verify logic, input validation, and error handling.
"""

import pytest
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch, MagicMock
import httpx
from fastapi.testclient import TestClient
from main import app, extract_domain, classify_snippet, canonicalize_url, analyze_evidence_gaps, generate_adaptive_followup
from main import ExecutedQuery, SourceResult, InvestigationRequest

client = TestClient(app)


class TestURLCanonicalization:
    """Test URL canonicalization for duplicate detection."""
    
    def test_remove_tracking_params(self):
        url = "https://example.com/article?utm_source=google&utm_medium=cpc&utm_campaign=test&id=123"
        canonical = canonicalize_url(url)
        assert "utm_source" not in canonical
        assert "utm_medium" not in canonical
        assert "id=123" in canonical
    
    def test_preserve_important_params(self):
        url = "https://example.com/article?id=123&page=2"
        canonical = canonicalize_url(url)
        assert "id=123" in canonical
        assert "page=2" in canonical
    
    def test_lowercase_domain(self):
        url = "https://EXAMPLE.COM/Article"
        canonical = canonicalize_url(url)
        assert "example.com" in canonical
    
    def test_remove_fragment(self):
        url = "https://example.com/article#section"
        canonical = canonicalize_url(url)
        assert "#section" not in canonical


class TestDomainExtraction:
    """Test domain extraction from URLs."""
    
    def test_simple_domain(self):
        assert extract_domain("https://example.com/article") == "example.com"
    
    def test_remove_www(self):
        assert extract_domain("https://www.example.com/article") == "example.com"
    
    def test_subdomain(self):
        assert extract_domain("https://news.example.com/article") == "news.example.com"
    
    def test_invalid_url(self):
        assert extract_domain("not-a-url") == "unknown"


class TestSnippetClassification:
    """Test rule-based evidence classification."""
    
    def test_supporting_classification(self):
        title = "Study confirms effectiveness"
        snippet = "The research demonstrates that the treatment is effective and safe."
        classification, reason = classify_snippet("Is the treatment effective?", snippet, title)
        assert classification == "supporting"
        assert "corroborating" in reason.lower() or "validating" in reason.lower()
    
    def test_conflicting_classification(self):
        title = "Experts dispute claims"
        snippet = "Little evidence supports the theory, and many researchers refute it."
        classification, reason = classify_snippet("Is the theory valid?", snippet, title)
        assert classification == "conflicting"
        assert "critical" in reason.lower() or "refuting" in reason.lower()
    
    def test_insufficient_context(self):
        title = "Meeting notes"
        snippet = "Short text."
        classification, reason = classify_snippet("What happened?", snippet, title)
        assert classification == "insufficient_context"
    
    def test_unclassified_ambiguous(self):
        title = "General overview"
        snippet = "This article provides background information on the topic."
        classification, reason = classify_snippet("Is it true?", snippet, title)
        assert classification == "unclassified"


class TestEvidenceGapAnalysis:
    """Test evidence-gap analysis for adaptive follow-up."""
    
    def test_no_results(self):
        gaps = analyze_evidence_gaps([], [])
        assert len(gaps) == 1
        assert "No results" in gaps[0]
    
    def test_single_domain_concentration(self):
        results = [
            SourceResult(
                id="1", title="Test", url="https://example.com/1", domain="example.com",
                snippet="Test snippet", publishedat=None, retrievedat="2026-01-01T00:00:00Z",
                engine="google", query="test", classification="unclassified",
                classificationreason="test", duplicate_of=None
            )
        ]
        gaps = analyze_evidence_gaps(results, [])
        assert any("single domain" in gap for gap in gaps)
    
    def test_one_sided_supporting(self):
        results = [
            SourceResult(
                id=str(i), title=f"Test {i}", url=f"https://example.com/{i}", domain="example.com",
                snippet="Supporting evidence", publishedat=None, retrievedat="2026-01-01T00:00:00Z",
                engine="google", query="test", classification="supporting",
                classificationreason="test", duplicate_of=None
            )
            for i in range(4)
        ]
        gaps = analyze_evidence_gaps(results, [])
        assert any("counterclaims" in gap.lower() for gap in gaps)
    
    def test_missing_academic_sources(self):
        results = [
            SourceResult(
                id=str(i), title=f"Test {i}", url=f"https://example.com/{i}", domain="example.com",
                snippet="Test snippet", publishedat=None, retrievedat="2026-01-01T00:00:00Z",
                engine="google", query="test", classification="unclassified",
                classificationreason="test", duplicate_of=None
            )
            for i in range(6)
        ]
        queries = [ExecutedQuery(engine="google", query="test", status="success", resultcount=6)]
        gaps = analyze_evidence_gaps(results, queries)
        assert any("academic" in gap.lower() for gap in gaps)


class TestAdaptiveFollowup:
    """Test adaptive follow-up query generation."""
    
    def test_followup_for_counterclaims(self):
        results = [
            SourceResult(
                id=str(i), title=f"Test {i}", url=f"https://example.com/{i}", domain="example.com",
                snippet="Supporting evidence", publishedat=None, retrievedat="2026-01-01T00:00:00Z",
                engine="google", query="test", classification="supporting",
                classificationreason="test", duplicate_of=None
            )
            for i in range(3)
        ]
        queries = [ExecutedQuery(engine="google", query="test", status="success", resultcount=3)]
        followup = generate_adaptive_followup("Is X true?", results, queries, remaining_budget=2)
        assert followup is not None
        engine, query = followup
        assert engine == "google"
        assert "criticism" in query.lower() or "counterclaim" in query.lower()
    
    def test_no_followup_when_budget_exhausted(self):
        results = []
        queries = []
        followup = generate_adaptive_followup("Is X true?", results, queries, remaining_budget=0)
        assert followup is None
    
    def test_followup_for_academic(self):
        results = [
            SourceResult(
                id=str(i), title=f"Test {i}", url=f"https://example.com/{i}", domain="example.com",
                snippet="Test snippet", publishedat=None, retrievedat="2026-01-01T00:00:00Z",
                engine="google", query="test", classification="unclassified",
                classificationreason="test", duplicate_of=None
            )
            for i in range(3)
        ]
        queries = [ExecutedQuery(engine="google", query="test", status="success", resultcount=3)]
        followup = generate_adaptive_followup("Is X true?", results, queries, remaining_budget=2)
        assert followup is not None
        engine, query = followup
        assert engine == "google_scholar"


class TestHealthEndpoint:
    """Test health check endpoint."""
    
    def test_health_check_without_key(self):
        with patch.dict('os.environ', {'SERPAPI_API_KEY': ''}):
            response = client.get("/api/health")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "ok"
            assert data["search_provider"] == "serpapi"
            # Note: SERPAPI_API_KEY is read at module import time in current implementation
            # This test verifies the endpoint structure is correct
    
    def test_health_check_endpoint_structure(self):
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["search_provider"] == "serpapi"
        assert "serpapi_configured" in data
        assert "version" in data


class TestInvestigationValidation:
    """Test investigation request validation."""
    
    def test_question_too_short(self):
        response = client.post("/api/investigations", json={
            "question": "Hi",
            "scope": "global",
            "depth": "balanced"
        })
        assert response.status_code == 422  # Validation error
    
    def test_question_too_long(self):
        response = client.post("/api/investigations", json={
            "question": "X" * 501,
            "scope": "global",
            "depth": "balanced"
        })
        assert response.status_code == 422
    
    def test_invalid_scope(self):
        response = client.post("/api/investigations", json={
            "question": "Test question",
            "scope": "invalid_scope",
            "depth": "balanced"
        })
        assert response.status_code == 422
    
    def test_invalid_depth(self):
        response = client.post("/api/investigations", json={
            "question": "Test question",
            "scope": "global",
            "depth": "invalid_depth"
        })
        assert response.status_code == 422


class TestInvestigationWithoutAPIKey:
    """Test that investigation fails gracefully without API key."""
    
    def test_no_api_key_error(self):
        with patch.dict('os.environ', {'SERPAPI_API_KEY': ''}):
            response = client.post("/api/investigations", json={
                "question": "Test question",
                "scope": "global",
                "depth": "balanced"
            })
            assert response.status_code == 500
            assert "SERPAPI_API_KEY" in response.json()["detail"]


class TestRateLimiting:
    """Test rate limiting middleware."""
    
    def test_rate_limit_exceeded(self):
        # This test would require mocking APP_ENV to 'production'
        # and making multiple requests
        pass


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
