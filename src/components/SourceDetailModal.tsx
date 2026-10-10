/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Source Detail Panel:
 * Slide-over / modal inspection panel providing exhaustive provenance,
 * snippet inspection, classification rationale, and secure external links.
 * Fully adapted for Light and Dark themes.
 */

import React from 'react';
import { 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  Search, 
  Globe
} from 'lucide-react';
import { SourceResult } from '../types/investigation';
import { isSafeUrl, SAFE_EXTERNAL_LINK_ATTRS } from '../utils/security';

interface SourceDetailModalProps {
  source: SourceResult | null;
  onClose: () => void;
}

export const SourceDetailModal: React.FC<SourceDetailModalProps> = ({
  source,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!source) return null;

  const handleCopyCitation = () => {
    const citation = `"${source.title}". ${source.domain}. Retrieved: ${source.retrievedat}. ${source.url}`;
    navigator.clipboard.writeText(citation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const safeUrl = isSafeUrl(source.url) ? source.url : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex justify-end">
      
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Slide-over Drawer Container */}
      <aside 
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 flex flex-col justify-between overflow-y-auto z-10 transition-colors"
        role="dialog"
        aria-modal="true"
        aria-labelledby="source-detail-title"
      >
        <div>
          
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Source Provenance Inspector</span>
            </span>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close detail panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Title & Domain */}
          <div className="mt-6">
            <h2 id="source-detail-title" className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {source.title}
            </h2>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-emerald-700 dark:text-emerald-400 font-mono">{source.domain}</span>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
              <span className="font-mono">Engine: {source.engine}</span>
            </div>
          </div>

          {/* Verification Warning if syndicated */}
          {source.duplicate_of && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/80 rounded-lg text-xs text-amber-900 dark:text-amber-300">
              <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-200 mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Syndicated / Duplicate Reporting Flag</span>
              </div>
              <p className="text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                This item shares verbatim text or syndicated wire coverage with:
              </p>
              <p className="font-mono text-[11px] text-amber-900 dark:text-amber-200 mt-1 break-all">
                {source.duplicate_of}
              </p>
            </div>
          )}

          {/* Snippet Content */}
          <div className="mt-6">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Retrieved Search Snippet
            </label>
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-lg text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
              &ldquo;{source.snippet}&rdquo;
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Snippet retrieved via SerpApi observation. The complete webpage was not ingested into memory.
            </p>
          </div>

          {/* Classification & Reason */}
          <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Evidence Classification
              </span>
              <span className="text-xs font-mono font-semibold capitalize text-emerald-700 dark:text-emerald-400">
                {source.classification.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong className="text-slate-900 dark:text-slate-200">Rule-based Reason: </strong>
              {source.classificationreason}
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 rounded-lg">
              <div className="text-slate-500 flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Publication Date</span>
              </div>
              <div className="text-slate-800 dark:text-slate-200 font-mono">
                {source.publishedat ? source.publishedat : 'Publication date unavailable'}
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 rounded-lg">
              <div className="text-slate-500 flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Retrieved Timestamp</span>
              </div>
              <div className="text-slate-800 dark:text-slate-200 font-mono text-[11px] truncate">
                {source.retrievedat}
              </div>
            </div>
          </div>

          {/* Executing Query Provenance */}
          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 rounded-lg text-xs">
            <div className="text-slate-500 flex items-center gap-1.5 mb-1">
              <Search className="w-3.5 h-3.5" />
              <span>Query Provenance</span>
            </div>
            <div className="text-slate-700 dark:text-slate-300 font-mono">
              &ldquo;{source.query}&rdquo;
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopyCitation}
            className="px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Citation Copied' : 'Copy Citation'}</span>
          </button>

          {safeUrl ? (
            <a
              href={safeUrl}
              {...SAFE_EXTERNAL_LINK_ATTRS}
              className="px-4 py-2 text-xs font-semibold text-white dark:text-slate-950 bg-emerald-600 dark:bg-emerald-400 hover:bg-emerald-500 dark:hover:bg-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span>Open Original Source</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <span className="text-xs text-rose-600 dark:text-rose-400">
              Invalid or unsafe URL scheme
            </span>
          )}
        </div>

      </aside>

    </div>
  );
};
