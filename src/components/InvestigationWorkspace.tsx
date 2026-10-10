/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Investigation Workspace:
 * Primary input console for posing research questions, configuring scope/depth,
 * and presenting featured pre-defined showcase investigations.
 */

import React, { useState } from 'react';
import { 
  Search, 
  ArrowRight, 
  X, 
  Clock, 
  SlidersHorizontal, 
  Info, 
  AlertCircle,
  StopCircle,
  History,
  Trash2,
  FileCheck2,
  Compass,
  ArrowUpRight
} from 'lucide-react';
import { 
  InvestigationScope, 
  InvestigationDepth, 
  InvestigationResponse 
} from '../types/investigation';
import { SHOWCASE_INVESTIGATIONS, ShowcaseSample } from '../fixtures/sampleInvestigations';

interface RecentItem {
  id: string;
  question: string;
  timestamp: string;
  scope: InvestigationScope;
}

interface InvestigationWorkspaceProps {
  question: string;
  setQuestion: (q: string) => void;
  scope: InvestigationScope;
  setScope: (s: InvestigationScope) => void;
  depth: InvestigationDepth;
  setDepth: (d: InvestigationDepth) => void;
  onSubmit: () => void;
  isLoading: boolean;
  onCancel: () => void;
  loadingPhase: string;
  elapsedSeconds: number;
  recentInvestigations: RecentItem[];
  onSelectRecent: (item: RecentItem) => void;
  onClearRecent: () => void;
  onSelectSample: (sample: ShowcaseSample) => void;
}

const SUGGESTED_QUESTIONS = [
  'Are companies actually adopting open-source AI models in production?',
  'Does intermittent fasting provide benefits beyond caloric restriction in humans?',
  'Has deep-sea mining begun commercial operations in international waters?',
  'What is the verified environmental impact of sodium-ion battery manufacturing compared to lithium-ion?'
];

export const InvestigationWorkspace: React.FC<InvestigationWorkspaceProps> = ({
  question,
  setQuestion,
  scope,
  setScope,
  depth,
  setDepth,
  onSubmit,
  isLoading,
  onCancel,
  loadingPhase,
  elapsedSeconds,
  recentInvestigations,
  onSelectRecent,
  onClearRecent,
  onSelectSample,
}) => {
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) {
      setValidationError('Please enter a research question or claim to investigate.');
      return;
    }
    if (trimmed.length < 5) {
      setValidationError('Investigation question must be at least 5 characters long.');
      return;
    }
    if (trimmed.length > 500) {
      setValidationError('Question length exceeds maximum 500 characters.');
      return;
    }
    setValidationError(null);
    onSubmit();
  };

  const handleSelectExample = (q: string) => {
    setQuestion(q);
    setValidationError(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      
      {/* Workspace Header Introduction */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2 transition-colors">
          Evidence Investigation Console
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed transition-colors">
          Examine what retrieved web sources actually state. Proofline executes live SerpApi search queries via your FastAPI backend, aggregates verifiable source metadata, and transparently groups supporting, conflicting, and unclassified reporting.
        </p>
      </div>

      {/* Main Investigation Input Form */}
      <form onSubmit={handleFormSubmit} className="space-y-6">
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-colors">
          
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="investigation-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Research Question or Claim
            </label>
            <span className="text-xs font-mono text-slate-400 dark:text-slate-500 tabular-nums">
              {question.length}/500
            </span>
          </div>

          <div className="relative">
            <textarea
              id="investigation-input"
              rows={3}
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="e.g., Are companies actually adopting open-source AI models in production?"
              disabled={isLoading}
              className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 focus:border-emerald-500 dark:focus:border-emerald-500 rounded-lg p-3.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 disabled:opacity-50 resize-none transition-colors"
            />
            {question && !isLoading && (
              <button
                type="button"
                onClick={() => setQuestion('')}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
                aria-label="Clear question"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Client-side Validation Error Notice */}
          {validationError && (
            <div className="mt-2 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5" role="alert">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Configuration Parameters: Scope & Depth */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Search Scope */}
            <div>
              <span className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                Search Scope
              </span>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                {(['global', 'news', 'academic', 'regional'] as InvestigationScope[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={isLoading}
                    onClick={() => setScope(s)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors capitalize ${
                      scope === s
                        ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700/80'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Investigation Depth */}
            <div>
              <span className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                Investigation Depth
              </span>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                {(['quick', 'balanced', 'deep'] as InvestigationDepth[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    disabled={isLoading}
                    onClick={() => setDepth(d)}
                    className={`px-2 py-1.5 text-xs font-medium rounded transition-colors capitalize ${
                      depth === d
                        ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700/80'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Submission and Action Controls */}
          <div className="mt-6 flex items-center justify-between flex-wrap gap-4 pt-4 border-t border-slate-200 dark:border-slate-800/80">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
              <span>Queries executed securely via server backend; snippets are never auto-accepted as ground truth.</span>
            </div>

            <div className="flex items-center gap-3">
              {isLoading ? (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <StopCircle className="w-3.5 h-3.5" />
                  <span>Cancel Request</span>
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white dark:text-slate-950 bg-emerald-600 dark:bg-emerald-400 hover:bg-emerald-500 dark:hover:bg-emerald-300 rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Start Investigation</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </form>

      {/* Honest Live Loading State */}
      {isLoading && (
        <div className="mt-6 bg-slate-50 dark:bg-slate-900/60 border border-emerald-300 dark:border-emerald-900/50 rounded-xl p-6 text-center animate-pulse">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-full mb-3 text-emerald-600 dark:text-emerald-400">
            <Search className="w-5 h-5 animate-spin" />
          </div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
            Executing Live Search Investigation
          </h2>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-mono mb-2">
            Phase: {loadingPhase}
          </p>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            Elapsed: {elapsedSeconds}s (timeout budget: 45s)
          </div>
          <p className="text-xs text-slate-500 mt-4 max-w-md mx-auto">
            Dispatched via backend SerpApi client. Gathering organic snippets across search indices and evaluating provenance.
          </p>
        </div>
      )}

      {/* Featured Showcase Investigations (Pre-defined examples to showcase potential) */}
      {!isLoading && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Featured Sample Investigations
              </h2>
            </div>
            <span className="text-xs text-slate-500">Explore full ledger, graph, and dossiers</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {SHOWCASE_INVESTIGATIONS.map((sample) => (
              <div
                key={sample.id}
                onClick={() => onSelectSample(sample)}
                className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 transition-all cursor-pointer group shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">{sample.domainFocus}</span>
                    <span className="font-mono tabular-nums">{sample.sourceCount} sources</span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors leading-snug line-clamp-2 mb-2">
                    {sample.title}
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                    {sample.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Explore Evidence</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Questions Section */}
      {!isLoading && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>Quick Prompt Suggestions</span>
            </h2>
            <span className="text-xs text-slate-500">Click to populate prompt input</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SUGGESTED_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectExample(q)}
                className="text-left p-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900/80 transition-colors group cursor-pointer"
              >
                <p className="text-xs text-slate-700 dark:text-slate-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors line-clamp-2">
                  &ldquo;{q}&rdquo;
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent Investigations (Backed strictly by client session state) */}
      {!isLoading && recentInvestigations.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span>Recent Inquiries</span>
            </h2>
            <button
              onClick={onClearRecent}
              className="text-xs text-slate-500 hover:text-rose-500 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear History</span>
            </button>
          </div>
          <div className="space-y-1.5">
            {recentInvestigations.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectRecent(item)}
                className="w-full text-left p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 flex items-center justify-between gap-3 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <span className="truncate">{item.question}</span>
                <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px] shrink-0 tabular-nums">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
