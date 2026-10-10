/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Truthful report export generator for Proofline.
 * Exports actual returned search data, queries, provenance, and rule-based classifications
 * in structured JSON and self-contained HTML research briefs.
 */

import { InvestigationResponse } from '../types/investigation';
import { sanitizePlainText, isSafeUrl } from './security';

/**
 * Downloads the investigation as a formatted JSON file.
 */
export function downloadJsonReport(investigation: InvestigationResponse) {
  const exportData = {
    exported_at: new Date().toISOString(),
    generator: 'Proofline Evidence Investigation Platform (SerpApi Hackathon 2026)',
    methodology_note: 'Search observations reflect live web queries via SerpApi. Classifications are rule-based snippet interpretations, not independent verifications of complete sources.',
    investigation,
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const filename = `proofline-investigation-${sanitizeFilename(investigation.question)}-${investigation.id || Date.now()}.json`;
  triggerDownload(blob, filename);
}

/**
 * Generates and downloads a clean, self-contained HTML evidence dossier.
 */
export function downloadHtmlReport(investigation: InvestigationResponse) {
  const htmlContent = generateHtmlReport(investigation);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const filename = `proofline-evidence-dossier-${sanitizeFilename(investigation.question)}-${investigation.id || Date.now()}.html`;
  triggerDownload(blob, filename);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function sanitizeFilename(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 32)
    .replace(/^-|-$/g, '') || 'report';
}

/**
 * Produces an executive, printer-friendly standalone HTML dossier.
 */
export function generateHtmlReport(investigation: InvestigationResponse): string {
  const uniqueDomains = new Set(investigation.results.map(r => r.domain)).size;
  const uniqueUrls = new Set(investigation.results.map(r => r.url)).size;
  const supporting = investigation.results.filter(r => r.classification === 'supporting');
  const conflicting = investigation.results.filter(r => r.classification === 'conflicting');
  const unclassified = investigation.results.filter(r => r.classification === 'unclassified');
  const insufficient = investigation.results.filter(r => r.classification === 'insufficient_context');
  const duplicates = investigation.results.filter(r => r.duplicate_of);

  const queryRows = investigation.queries.map(q => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${escapeHtml(q.engine)}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${escapeHtml(q.query)}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(q.status)}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace;">${q.resultcount}</td>
    </tr>
  `).join('');

  const sourceRows = investigation.results.map((r, i) => {
    const safeUrl = isSafeUrl(r.url) ? r.url : '#';
    const classificationBadgeColor = 
      r.classification === 'supporting' ? '#047857' :
      r.classification === 'conflicting' ? '#b91c1c' :
      r.classification === 'insufficient_context' ? '#b45309' : '#475569';

    return `
      <div style="margin-bottom: 24px; padding: 18px; border: 1px solid #e2e8f0; border-radius: 6px; background-color: #ffffff;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
          <h3 style="margin: 0; font-size: 16px; color: #0f172a;">${i + 1}. ${escapeHtml(r.title)}</h3>
          <span style="font-size: 12px; font-weight: 600; color: ${classificationBadgeColor}; text-transform: uppercase;">
            ${escapeHtml(r.classification.replace('_', ' '))}
          </span>
        </div>
        
        <div style="font-size: 13px; color: #64748b; margin-bottom: 10px;">
          <span><strong>Publisher:</strong> ${escapeHtml(r.domain)}</span> &middot;
          <span><strong>Date:</strong> ${r.publishedat ? escapeHtml(r.publishedat) : 'Publication date unavailable'}</span> &middot;
          <span><strong>Engine:</strong> ${escapeHtml(r.engine)}</span>
        </div>

        <blockquote style="margin: 0 0 12px 0; padding: 10px 14px; background-color: #f8fafc; border-left: 3px solid #cbd5e1; font-size: 14px; color: #334155; line-height: 1.5;">
          ${escapeHtml(r.snippet)}
        </blockquote>

        <div style="font-size: 13px; color: #475569; margin-bottom: 8px;">
          <strong>Classification Rationale:</strong> ${escapeHtml(r.classificationreason)}
        </div>

        ${r.duplicate_of ? `
          <div style="font-size: 12px; color: #b45309; margin-bottom: 8px;">
            ⚠️ <strong>Syndication / Overlap Warning:</strong> Shared reporting with ${escapeHtml(r.duplicate_of)}
          </div>
        ` : ''}

        <div style="font-size: 12px;">
          <a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer" style="color: #0284c7; text-decoration: underline; word-break: break-all;">
            ${escapeHtml(r.url)}
          </a>
        </div>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Proofline Evidence Dossier — ${escapeHtml(investigation.question)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #0f172a;
      background-color: #f8fafc;
      margin: 0;
      padding: 40px 20px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background-color: #ffffff;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    h1 { font-size: 24px; margin-top: 0; color: #022c22; }
    h2 { font-size: 18px; margin-top: 32px; border-bottom: 2px solid #047857; padding-bottom: 6px; }
    .metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin: 24px 0;
    }
    .metric-card {
      padding: 16px;
      background-color: #f1f5f9;
      border-radius: 6px;
    }
    .metric-val { font-size: 24px; font-weight: bold; color: #0f172a; }
    .metric-lbl { font-size: 12px; color: #64748b; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    .disclaimer-box {
      margin-top: 32px;
      padding: 16px;
      background-color: #fffbeb;
      border: 1px solid #fef3c7;
      border-radius: 6px;
      font-size: 13px;
      color: #92400e;
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .container { box-shadow: none; padding: 0; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px;">
      <div>
        <span style="font-weight: 700; font-size: 20px; color: #047857; letter-spacing: -0.5px;">PROOFLINE</span>
        <span style="color: #64748b; font-size: 14px; margin-left: 12px;">Evidence Investigation Dossier</span>
      </div>
      <div style="font-size: 12px; color: #64748b; text-align: right;">
        ID: <code>${escapeHtml(investigation.id || 'N/A')}</code><br>
        Date: ${escapeHtml(investigation.completedat || new Date().toISOString())}
      </div>
    </div>

    <h1>Investigation Question</h1>
    <p style="font-size: 18px; color: #1e293b; font-weight: 500; background: #f8fafc; padding: 16px; border-radius: 6px;">
      &ldquo;${escapeHtml(investigation.question)}&rdquo;
    </p>

    <div class="metrics">
      <div class="metric-card">
        <div class="metric-val">${investigation.results.length}</div>
        <div class="metric-lbl">Total Results</div>
      </div>
      <div class="metric-card">
        <div class="metric-val">${uniqueUrls}</div>
        <div class="metric-lbl">Unique Sources</div>
      </div>
      <div class="metric-card">
        <div class="metric-val">${uniqueDomains}</div>
        <div class="metric-lbl">Unique Domains</div>
      </div>
      <div class="metric-card">
        <div class="metric-val">${supporting.length} / ${conflicting.length}</div>
        <div class="metric-lbl">Supporting / Conflicting</div>
      </div>
    </div>

    <h2>Executed Queries & Provenance</h2>
    <table>
      <thead>
        <tr style="background-color: #f8fafc; text-align: left; font-size: 12px; color: #64748b;">
          <th style="padding: 8px 12px;">Engine</th>
          <th style="padding: 8px 12px;">Query String</th>
          <th style="padding: 8px 12px;">Status</th>
          <th style="padding: 8px 12px; text-align: right;">Results</th>
        </tr>
      </thead>
      <tbody>
        ${queryRows}
      </tbody>
    </table>

    <h2>Evidence Ledger (${investigation.results.length} items)</h2>
    ${sourceRows}

    <div class="disclaimer-box">
      <strong>Methodological & Integrity Notice:</strong>
      <p style="margin: 6px 0 0 0;">
        This document reflects search snippets retrieved via SerpApi. Classifications represent automated rule-based interpretations of snippets against the query, not full forensic audits of complete source texts. Repetition across syndicated outlets does not constitute independent corroboration. Always inspect primary sources directly.
      </p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
