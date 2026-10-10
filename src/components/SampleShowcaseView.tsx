/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sample Investigations Showcase View:
 * Presents curated pre-defined investigations to showcase Proofline's
 * evidence analysis, relationship graph, and export potential.
 */

import React from 'react';
import { 
  Compass, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  Network, 
  FileText,
  Search,
  ExternalLink
} from 'lucide-react';
import { SHOWCASE_INVESTIGATIONS, ShowcaseSample } from '../fixtures/sampleInvestigations';

interface SampleShowcaseViewProps {
  onSelectSample: (sample: ShowcaseSample) => void;
  onBackToSearch: () => void;
}

export const SampleShowcaseView: React.FC<SampleShowcaseViewProps> = ({
  onSelectSample,
  onBackToSearch,
}) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400 font-mono text-xs uppercase tracking-wider">
          <Compass className="w-4 h-4" />
          <span>Platform Showcase Cases</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
          Pre-Defined Example Investigations
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          Examine realistic investigation responses demonstrating multi-query provenance, rule-based classification, syndicated duplicate detection, and relationship network clustering.
        </p>
      </div>

      {/* Grid of Showcase Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {SHOWCASE_INVESTIGATIONS.map((sample, idx) => {
          const supporting = sample.data.results.filter(r => r.classification === 'supporting').length;
          const conflicting = sample.data.results.filter(r => r.classification === 'conflicting').length;
          const other = sample.data.results.length - supporting - conflicting;

          return (
            <div
              key={sample.id}
              className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{sample.domainFocus}</span>
                  <span className="font-mono tabular-nums">{sample.sourceCount} Sources</span>
                </div>

                <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 leading-snug">
                  {sample.title}
                </h2>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  {sample.description}
                </p>

                {/* Evidence breakdown preview */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1.5 mb-4 font-mono">
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider font-sans font-semibold">
                    Evidence Stance Breakdown
                  </div>
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span className="text-emerald-600 dark:text-emerald-400">Supporting Snippets:</span>
                    <span className="font-bold tabular-nums">{supporting}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span className="text-rose-600 dark:text-rose-400">Conflicting Snippets:</span>
                    <span className="font-bold tabular-nums">{conflicting}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>Unclassified / Other:</span>
                    <span className="tabular-nums">{other}</span>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] text-slate-500">
                  <div><strong>Queries:</strong> {sample.data.queries.length} executed</div>
                  <div><strong>Scope:</strong> <span className="capitalize">{sample.data.scope}</span></div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => onSelectSample(sample)}
                  className="w-full py-2.5 px-3 rounded-lg text-xs font-semibold text-white dark:text-slate-950 bg-emerald-600 dark:bg-emerald-400 hover:bg-emerald-500 dark:hover:bg-emerald-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span>Launch Investigation Dossier</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
