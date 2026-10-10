/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Investigation Results Console:
 * Comprehensive view of an executed research investigation.
 * Supports Light and Dark themes seamlessly.
 */

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Download, 
  Layers, 
  ListFilter, 
  Network, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Search, 
  ShieldCheck, 
  FileText
} from 'lucide-react';
import { InvestigationResponse, SourceResult } from '../types/investigation';
import { EvidenceLedger } from './EvidenceLedger';
import { EvidenceClassificationView } from './EvidenceClassificationView';
import { EvidenceRelationshipGraph } from './EvidenceRelationshipGraph';

interface InvestigationResultsProps {
  investigation: InvestigationResponse;
  onBackToSearch: () => void;
  onInspectSource: (source: SourceResult) => void;
  onOpenExportModal: () => void;
}

export const InvestigationResults: React.FC<InvestigationResultsProps> = ({
  investigation,
  onBackToSearch,
  onInspectSource,
  onOpenExportModal,
}) => {
  const [activeViewTab, setActiveViewTab] = useState<'ledger' | 'classification' | 'graph'>('ledger');

  // Compute metrics strictly from actual returned data
  const totalResults = investigation.results.length;
  const uniqueUrls = new Set(investigation.results.map(r => r.url)).size;
  const uniqueDomains = new Set(investigation.results.map(r => r.domain)).size;
  
  const supportingCount = investigation.results.filter(r => r.classification === 'supporting').length;
  const conflictingCount = investigation.results.filter(r => r.classification === 'conflicting').length;
  const unclassifiedCount = investigation.results.filter(r => r.classification === 'unclassified').length;
  const insufficientCount = investigation.results.filter(r => r.classification === 'insufficient_context').length;

  const failedQueries = investigation.queries.filter(q => q.status !== 'success');
  const distinctEngines = Array.from(new Set(investigation.queries.map(q => q.engine)));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={onBackToSearch}
          className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>New Investigation</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenExportModal}
            className="px-3.5 py-1.5 text-xs font-semibold text-white dark:text-slate-950 bg-emerald-600 dark:bg-emerald-400 hover:bg-emerald-500 dark:hover:bg-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Main Investigation Title & Kicker */}
      <div>
        <div className="text-xs text-slate-500 dark:text-slate-500 font-mono mb-1.5 flex items-center gap-2 flex-wrap">
          <span>ID: {investigation.id || 'session-investigation'}</span>
          <span aria-hidden="true">·</span>
          <span>Scope: {investigation.scope}</span>
          <span aria-hidden="true">·</span>
          <span>Depth: {investigation.depth}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">Completed: {investigation.completedat || 'Recent'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
          &ldquo;{investigation.question}&rdquo;
        </h1>
      </div>

      {/* Partial Search Failure Disclosure */}
      {failedQueries.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/80 rounded-xl p-4 text-xs text-amber-900 dark:text-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Partial Query Failure Notice</span>
          </div>
          <p className="text-amber-800/90 dark:text-amber-200/90 leading-relaxed">
            {failedQueries.length} of {investigation.queries.length} search queries failed or hit upstream rate limits. Displaying results gathered from the successful queries:
          </p>
          <ul className="list-disc list-inside space-y-1 text-amber-900 dark:text-amber-300 font-mono text-[11px]">
            {failedQueries.map((fq, i) => (
              <li key={i}>
                Engine [{fq.engine}]: &ldquo;{fq.query}&rdquo; — {fq.error || 'Failed'}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Total Results
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {totalResults}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            From {investigation.queries.length} executed queries
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Unique URLs
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {uniqueUrls}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Distinct web destinations
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Unique Domains
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {uniqueDomains}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Independent publishing hosts
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Support / Conflict
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-800 dark:text-slate-200">
            <span className="text-emerald-600 dark:text-emerald-400">{supportingCount}</span>
            <span className="text-slate-400 dark:text-slate-600 mx-1">/</span>
            <span className="text-rose-600 dark:text-rose-400">{conflictingCount}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {unclassifiedCount + insufficientCount} other / unclassified
          </div>
        </div>
      </div>

      {/* Truthful Evidence Overview */}
      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Evidence Synthesis & Observations</span>
          </h2>
          <span className="text-[11px] text-slate-500 font-mono">
            Engines: {distinctEngines.join(', ')}
          </span>
        </div>

        {investigation.summary ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-200 leading-relaxed">
              {investigation.summary.headline}
            </p>
            {investigation.summary.observation_notes && investigation.summary.observation_notes.length > 0 && (
              <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                {investigation.summary.observation_notes.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 shrink-0 font-bold">&bull;</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            Retrieved {totalResults} search snippets across {uniqueDomains} domains. Review the Evidence Ledger below to inspect exact source quotes, publication dates, and rule-based classifications.
          </p>
        )}

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500 shrink-0" />
          <span>
            Search snippets represent preliminary observations, not authoritative verification. Repeating search results does not establish factual ground truth.
          </span>
        </div>
      </div>

      {/* Executed Queries Provenance Drawer */}
      <details className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 group">
        <summary className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider cursor-pointer list-none flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span>Search Query Provenance ({investigation.queries.length} queries executed)</span>
          </div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-sans group-open:rotate-180 transition-transform">
            ▼
          </span>
        </summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-mono text-[11px]">
                <th className="py-2 pr-4">Engine</th>
                <th className="py-2 pr-4">Search Query String</th>
                <th className="py-2 pr-4">Execution Status</th>
                <th className="py-2 text-right">Yield</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-slate-700 dark:text-slate-300">
              {investigation.queries.map((q, idx) => (
                <tr key={idx} className="hover:bg-slate-100/50 dark:hover:bg-slate-900/40">
                  <td className="py-2.5 pr-4 text-emerald-700 dark:text-emerald-400 font-semibold">{q.engine}</td>
                  <td className="py-2.5 pr-4 text-slate-900 dark:text-slate-200 font-sans">&ldquo;{q.query}&rdquo;</td>
                  <td className="py-2.5 pr-4">
                    <span className={q.status === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                      {q.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-mono tabular-nums">{q.resultcount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      {/* Interactive Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => setActiveViewTab('ledger')}
            className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
              activeViewTab === 'ledger'
                ? 'text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>Evidence Ledger ({totalResults})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewTab('classification')}
            className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
              activeViewTab === 'classification'
                ? 'text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Supporting & Conflicting Analysis</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewTab('graph')}
            className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
              activeViewTab === 'graph'
                ? 'text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Network className="w-4 h-4" />
            <span>Relationship Network</span>
          </button>
        </div>
      </div>

      {/* Active Tab Viewport */}
      <div>
        {activeViewTab === 'ledger' && (
          <EvidenceLedger
            results={investigation.results}
            queries={investigation.queries}
            onInspectSource={onInspectSource}
          />
        )}

        {activeViewTab === 'classification' && (
          <EvidenceClassificationView
            results={investigation.results}
            onInspectSource={onInspectSource}
          />
        )}

        {activeViewTab === 'graph' && (
          <EvidenceRelationshipGraph
            results={investigation.results}
            queries={investigation.queries}
            onInspectSource={onInspectSource}
          />
        )}
      </div>

    </div>
  );
};
