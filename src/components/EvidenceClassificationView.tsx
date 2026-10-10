/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Evidence Classification View:
 * Categorization into Potentially Supporting, Potentially Conflicting,
 * Unclassified, and Insufficient Context groups.
 * Fully adapted for Light and Dark themes.
 */

import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  HelpCircle, 
  AlertCircle, 
  Info
} from 'lucide-react';
import { SourceResult, EvidenceClassification } from '../types/investigation';
import { EvidenceSourceCard } from './EvidenceSourceCard';

interface EvidenceClassificationViewProps {
  results: SourceResult[];
  onInspectSource: (source: SourceResult) => void;
}

export const EvidenceClassificationView: React.FC<EvidenceClassificationViewProps> = ({
  results,
  onInspectSource,
}) => {
  const [activeCategory, setActiveCategory] = useState<EvidenceClassification>('supporting');

  const supportingSources = results.filter(r => r.classification === 'supporting');
  const conflictingSources = results.filter(r => r.classification === 'conflicting');
  const unclassifiedSources = results.filter(r => r.classification === 'unclassified');
  const insufficientSources = results.filter(r => r.classification === 'insufficient_context');

  const getSourcesForActiveCategory = () => {
    switch (activeCategory) {
      case 'supporting': return supportingSources;
      case 'conflicting': return conflictingSources;
      case 'unclassified': return unclassifiedSources;
      case 'insufficient_context': return insufficientSources;
    }
  };

  const currentSources = getSourcesForActiveCategory();

  return (
    <div className="space-y-6">
      
      {/* Integrity & Methodology Disclaimer */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-3 shadow-xs transition-colors">
        <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-900 dark:text-slate-200">
            Automated Rule-Based Interpretation Notice
          </p>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            These categories are driven strictly by backend snippet parsing against the submitted question. Classification does not constitute forensic fact-checking of complete articles. Unclassified sources provide important background and must not be disregarded as irrelevant.
          </p>
        </div>
      </div>

      {/* Segmented Category Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors">
        
        <button
          type="button"
          onClick={() => setActiveCategory('supporting')}
          className={`p-3 rounded-lg text-left transition-colors cursor-pointer flex flex-col justify-between ${
            activeCategory === 'supporting'
              ? 'bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white shadow-xs border border-emerald-500/50'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold">Potentially Supporting</span>
            <CheckCircle className={`w-4 h-4 ${activeCategory === 'supporting' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
          </div>
          <span className="text-xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
            {supportingSources.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('conflicting')}
          className={`p-3 rounded-lg text-left transition-colors cursor-pointer flex flex-col justify-between ${
            activeCategory === 'conflicting'
              ? 'bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white shadow-xs border border-rose-500/50'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold">Potentially Conflicting</span>
            <XCircle className={`w-4 h-4 ${activeCategory === 'conflicting' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`} />
          </div>
          <span className="text-xl font-bold font-mono tabular-nums text-rose-700 dark:text-rose-400">
            {conflictingSources.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('unclassified')}
          className={`p-3 rounded-lg text-left transition-colors cursor-pointer flex flex-col justify-between ${
            activeCategory === 'unclassified'
              ? 'bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white shadow-xs border border-slate-400 dark:border-slate-600'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold">Unclassified Sources</span>
            <HelpCircle className={`w-4 h-4 ${activeCategory === 'unclassified' ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`} />
          </div>
          <span className="text-xl font-bold font-mono tabular-nums text-slate-800 dark:text-slate-300">
            {unclassifiedSources.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('insufficient_context')}
          className={`p-3 rounded-lg text-left transition-colors cursor-pointer flex flex-col justify-between ${
            activeCategory === 'insufficient_context'
              ? 'bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white shadow-xs border border-amber-500/50'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold">Insufficient Context</span>
            <AlertCircle className={`w-4 h-4 ${activeCategory === 'insufficient_context' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
          </div>
          <span className="text-xl font-bold font-mono tabular-nums text-amber-700 dark:text-amber-400">
            {insufficientSources.length}
          </span>
        </button>

      </div>

      {/* Active Category Description Header */}
      <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-lg p-3 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between transition-colors">
        <span>
          Showing <strong className="text-slate-900 dark:text-slate-200 font-mono tabular-nums">{currentSources.length}</strong> items in this category.
        </span>
        <span className="text-slate-500">
          {activeCategory === 'supporting' && 'Snippets indicating corroboration or positive affirmation.'}
          {activeCategory === 'conflicting' && 'Snippets indicating counter-evidence, skepticism, or alternative findings.'}
          {activeCategory === 'unclassified' && 'Contextual, technical, or exploratory findings that do not take a binary stance.'}
          {activeCategory === 'insufficient_context' && 'Snippets with inadequate textual detail to determine orientation.'}
        </span>
      </div>

      {/* Sources Display */}
      <div className="space-y-4">
        {currentSources.map((source, idx) => (
          <EvidenceSourceCard
            key={source.id || idx}
            source={source}
            index={idx}
            onInspect={onInspectSource}
          />
        ))}

        {currentSources.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800/60 rounded-xl transition-colors">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              No sources were classified under this category in the current search response.
            </p>
            <p className="text-xs text-slate-500">
              Check the Evidence Ledger for full coverage across all categories.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
