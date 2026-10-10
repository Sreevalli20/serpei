/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Security and sanitization utilities for Proofline.
 * Prevents XSS, unsafe URL schemes, and uncontrolled external access.
 */

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

/**
 * Validates whether a URL is a legitimate and safe external HTTP/HTTPS link.
 * Blocks javascript:, file:, data:, blob:, and malformed protocols.
 */
export function isSafeUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const trimmed = url.trim();
    // Pre-check to disallow javascript: even if browser URL parser normalizes
    if (/^(?:javascript|data|vbscript|file):/i.test(trimmed)) {
      return false;
    }
    const parsed = new URL(trimmed);
    return ALLOWED_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Extracts a normalized, sanitized domain hostname from a URL.
 */
export function getSafeDomain(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return 'Unknown domain';
  try {
    const parsed = new URL(url.trim());
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return 'Invalid domain';
  }
}

/**
 * Strips dangerous HTML entities or tag delimiters from unparsed text.
 * Proofline renders snippets and titles via React text nodes, but this
 * ensures extra defense-in-depth against template injection.
 */
export function sanitizePlainText(text: string | null | undefined): string {
  if (!text) return '';
  return String(text)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * Safe attributes for external anchor elements.
 */
export const SAFE_EXTERNAL_LINK_ATTRS = {
  target: '_blank',
  rel: 'noopener noreferrer',
} as const;
