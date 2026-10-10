/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Backend Contract View:
 * Explicitly outlines the exact FastAPI HTTP endpoints, payload schemas,
 * and environment variable configuration required for the Python backend.
 */

import React, { useState } from 'react';
import { Code2, Server, Check, Copy } from 'lucide-react';

export const ApiContractView: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const ENDPOINTS_SCHEMA = `{
  "GET /api/health": {
    "response": {
      "status": "ok",
      "search_provider": "serpapi",
      "version": "1.0.0"
    }
  },
  "POST /api/investigations": {
    "request": {
      "question": "string (5-500 chars)",
      "scope": "global | news | academic | regional",
      "depth": "quick | balanced | deep"
    },
    "response": {
      "id": "string",
      "question": "string",
      "status": "completed | partial_failure | failed",
      "createdat": "ISO-8601 string",
      "completedat": "ISO-8601 string",
      "queries": [
        {
          "engine": "google | google_news | google_scholar",
          "query": "string",
          "status": "success | failed | rate_limited",
          "resultcount": 0,
          "error": "optional string"
        }
      ],
      "results": [
        {
          "id": "string",
          "title": "string",
          "url": "https://...",
          "domain": "string",
          "snippet": "string",
          "publishedat": "string | null",
          "retrievedat": "ISO-8601 string",
          "engine": "string",
          "query": "string",
          "classification": "supporting | conflicting | unclassified | insufficient_context",
          "classificationreason": "string",
          "duplicate_of": "string | null"
        }
      ],
      "summary": {
        "headline": "string",
        "supporting_count": 0,
        "conflicting_count": 0,
        "unclassified_count": 0,
        "insufficient_count": 0,
        "observation_notes": ["string"]
      },
      "warnings": ["string"]
    }
  }
}`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
          FastAPI Backend Integration Contract
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
          Proofline adheres to a strict decoupling model: the frontend handles presentation and validation, while the Python FastAPI backend securely manages the SerpApi API key on Render.
        </p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">HTTP Endpoints Specification</h2>
          </div>
          <button
            onClick={() => copyToClipboard(ENDPOINTS_SCHEMA, 'schema')}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            {copiedSection === 'schema' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSection === 'schema' ? 'Copied' : 'Copy Schema'}</span>
          </button>
        </div>

        <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
          {ENDPOINTS_SCHEMA}
        </pre>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-white">Render Deployment Setup</h2>
        <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
          <p>
            1. In Render dashboard, create a <strong>Web Service</strong> with runtime <strong>Python 3.14</strong>.
          </p>
          <p>
            2. Set Build Command: <code className="bg-slate-950 px-2 py-0.5 rounded text-emerald-300">pip install -r requirements.txt</code>
          </p>
          <p>
            3. Set Start Command: <code className="bg-slate-950 px-2 py-0.5 rounded text-emerald-300">uvicorn main:app --host 0.0.0.0 --port $PORT</code>
          </p>
          <p>
            4. In Render Environment Variables, set <code className="bg-slate-950 px-2 py-0.5 rounded text-emerald-300">SERPAPI_API_KEY</code>.
          </p>
        </div>
      </div>

    </div>
  );
};
