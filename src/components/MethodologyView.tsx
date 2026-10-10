/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Evidence Limits & Methodology View:
 * Educational and architectural explanation of Proofline's epistemological principles:
 * - Distinguishing search snippets from ground truth
 * - The fallacy of syndicated repetition as corroboration
 * - Rule-based classification vs semantic reading
 */

import React from 'react';
import { ShieldCheck, AlertTriangle, Search, FileCode, CheckCircle, Scale } from 'lucide-react';

export const MethodologyView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
          Methodological Framework & Limits
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
          Proofline is designed to assist evidence investigation by providing clear provenance and separating search observations from derived analytical conclusions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Search Snippets Are Not Verified Facts</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Search engine results indexes present claims made by third-party web authors. The presence of an assertive statement in a search snippet only proves that the webpage published that sentence, not that the underlying premise is true.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
            <Scale className="w-4 h-4 shrink-0" />
            <span>Repetition Is Not Corroboration</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            News syndication (e.g., Reuters or AP wire stories reprinted across hundreds of affiliate portals) artificially multiplies result counts. Proofline actively detects duplicate URLs and shared snippets to prevent false impressions of consensus.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>Rule-Based Classification</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Classifications (Potentially Supporting, Potentially Conflicting, Unclassified) are derived via deterministic pattern matching against snippet text. They serve as organizational aids, not peer-reviewed verdicts.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
            <Search className="w-4 h-4 shrink-0" />
            <span>Provenance Transparency</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Every item in the ledger discloses its originating search engine, query string, retrieval timestamp, and publication date when provided by search metadata. Missing dates are never fabricated.
          </p>
        </div>

      </div>

      <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl space-y-3">
        <h2 className="text-sm font-semibold text-white">
          Guidelines for Professional Analysts
        </h2>
        <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed">
          <li>
            <strong className="text-slate-200">Inspect Primary Sources:</strong> Always click through to the original publisher using the verified link before quoting evidence.
          </li>
          <li>
            <strong className="text-slate-200">Examine Missing Evidence:</strong> An absence of conflicting search results may stem from search engine algorithmic bias, query phrasing, or regional paywalls.
          </li>
          <li>
            <strong className="text-slate-200">Document Query Provenance:</strong> Export the investigation report (JSON/HTML) to preserve an immutable audit trail of the exact queries executed at that specific time.
          </li>
        </ol>
      </div>

    </div>
  );
};
