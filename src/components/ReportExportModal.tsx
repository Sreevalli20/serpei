/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Report Export Modal:
 * Generates structured JSON files and self-contained, printer-friendly HTML research dossiers.
 * Supports Light and Dark themes.
 */

import React from 'react';
import { X, FileCode, FileText, Download, Check, ShieldCheck, Printer } from 'lucide-react';
import { InvestigationResponse } from '../types/investigation';
import { downloadJsonReport, downloadHtmlReport } from '../utils/export';

interface ReportExportModalProps {
  investigation: InvestigationResponse | null;
  onClose: () => void;
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({
  investigation,
  onClose,
}) => {
  const [downloadedFormat, setDownloadedFormat] = React.useState<'json' | 'html' | null>(null);

  if (!investigation) return null;

  const handleDownloadJson = () => {
    downloadJsonReport(investigation);
    setDownloadedFormat('json');
    setTimeout(() => setDownloadedFormat(null), 3000);
  };

  const handleDownloadHtml = () => {
    downloadHtmlReport(investigation);
    setDownloadedFormat('html');
    setTimeout(() => setDownloadedFormat(null), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 z-10 transition-colors"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 id="export-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
              Export Evidence Dossier
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Generate reproducible research artifacts from actual retrieved data.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close export dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          
          {/* HTML Dossier Option */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-emerald-500/40 transition-colors flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-400 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Standalone HTML Research Brief
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Self-contained HTML dossier containing executive metrics, full query logs, classified source ledger, and provenance notes. Ready for archiving and browser printing.
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadHtml}
              className="px-3.5 py-2 text-xs font-semibold text-white dark:text-slate-950 bg-emerald-600 dark:bg-emerald-400 hover:bg-emerald-500 dark:hover:bg-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
            >
              {downloadedFormat === 'html' ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
              <span>{downloadedFormat === 'html' ? 'Downloaded' : 'Export HTML'}</span>
            </button>
          </div>

          {/* JSON Structured Data Option */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 shrink-0">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Raw JSON Research Artifact
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Standardized JSON payload for downstream analysis, programmatic verification, or CI/CD automated evaluation.
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadJson}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
            >
              {downloadedFormat === 'json' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
              <span>{downloadedFormat === 'json' ? 'Downloaded' : 'Export JSON'}</span>
            </button>
          </div>

          {/* Quick Browser Print */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={handlePrint}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print current investigation view</span>
            </button>
          </div>

        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-500 shrink-0" />
          <span>Reports contain only actual returned data and transparent snippet limits.</span>
        </div>

      </div>

    </div>
  );
};
