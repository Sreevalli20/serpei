/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Evidence Source Card:
 * Complies with Zero-Pill discipline (metadata rendered as clean unboxed text with · separators).
 * Supports seamless light and dark mode presentation.
 */

import React from 'react';
import { ExternalLink, AlertTriangle, ChevronRight, Copy, Check } from 'lucide-react';
import { SourceResult } from '../types/investigation';
import { isSafeUrl, SAFE_EXTERNAL_LINK_ATTRS } from '../utils/security';

interface EvidenceSourceCardProps {
  source: SourceResult;
  index: number;
  onInspect: (source: SourceResult) => void;
}

export const EvidenceSourceCard: React.FC<EvidenceSourceCardProps> = ({
  source,
  index,
  onInspect,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (source.url) {
      navigator.clipboard.writeText(source.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getClassificationLabel = (c: string) => {
    switch (c) {
      case 'supporting': return 'Potentially Supporting';
      case 'conflicting': return 'Potentially Conflicting';
      case 'insufficient_context': return 'Insufficient Context';
      default: return 'Unclassified';
    }
  };

  const getClassificationColor = (c: string) => {
    switch (c) {
      case 'supporting': return 'text-emerald-700 dark:text-emerald-400';
      case 'conflicting': return 'text-rose-700 dark:text-rose-400';
      case 'insufficient_context': return 'text-amber-700 dark:text-amber-400';
      default: return 'text-slate-600 dark:text-slate-400';
    }
  };

  const safeUrl = isSafeUrl(source.url) ? source.url : null;

  return (
    <article 
      onClick={() => onInspect(source)}
      className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700/90 rounded-xl p-5 transition-all cursor-pointer group shadow-xs hover:shadow-sm"
    >
      {/* Kicker: Clean unboxed metadata with typographic separators (Zero-Pill compliant) */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-400 dark:text-slate-500 tabular-nums">{index + 1}.</span>
          <span className="font-semibold text-slate-800 dark:text-slate-300">{source.domain}</span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
          <span>{source.publishedat ? source.publishedat : 'Publication date unavailable'}</span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
          <span className="font-mono text-slate-500">{source.engine}</span>
        </div>

        {/* Classification text (unboxed) */}
        <span className={`text-xs font-semibold ${getClassificationColor(source.classification)}`}>
          {getClassificationLabel(source.classification)}
        </span>
      </div>

      {/* Primary Title */}
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors mb-2.5 leading-snug">
        {source.title}
      </h3>

      {/* Snippet Blockquote */}
      <blockquote className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/50 rounded-lg p-3 mb-3 border-l-2 border-slate-300 dark:border-slate-700 leading-relaxed font-sans">
        {source.snippet}
      </blockquote>

      {/* Classification explanation */}
      <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
        <strong className="text-slate-800 dark:text-slate-300">Rationale: </strong>
        {source.classificationreason}
      </p>

      {/* Syndication / Duplicate Notice if present */}
      {source.duplicate_of && (
        <div className="mb-3 p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-lg text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong>Syndication / Overlap Warning: </strong>
            <span>Shared reporting identified with {source.duplicate_of}. May not constitute independent corroboration.</span>
          </div>
        </div>
      )}

      {/* Card Footer: Query provenance & action buttons */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 flex-wrap gap-2">
        <div className="truncate max-w-sm text-slate-500 font-mono text-[11px]" title={`Query: ${source.query}`}>
          Query: &ldquo;{source.query}&rdquo;
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCopyLink}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors p-1 flex items-center gap-1 cursor-pointer"
            title="Copy URL"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {safeUrl && (
            <a
              href={safeUrl}
              onClick={(e) => e.stopPropagation()}
              {...SAFE_EXTERNAL_LINK_ATTRS}
              className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer font-medium"
              title="Open verified source link"
            >
              <span>Inspect Source</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
};
