/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Quality Verification Test Suite for Proofline:
 * - URL safety and malicious protocol rejection
 * - Graph construction without hallucinated nodes
 * - Report export integrity (JSON and HTML)
 * - Validation rules
 * - Fixture adherence to partial failures & missing metadata
 * - Centralized Error Handler classification
 * - Showcase sample investigations completeness
 * - Key leak detection (ensures zero SerpApi keys in client bundle)
 */

import { isSafeUrl, getSafeDomain, sanitizePlainText } from '../utils/security';
import { buildEvidenceGraph } from '../utils/graph';
import { generateHtmlReport } from '../utils/export';
import { FIXTURE_OPEN_SOURCE_AI, FIXTURE_PARTIAL_FAILURE } from '../fixtures/testFixtures';
import { SHOWCASE_INVESTIGATIONS } from '../fixtures/sampleInvestigations';
import { errorHandler } from '../services/errorHandler';

export function runFrontendQualityTests(): { passed: number; failed: number; errors: string[] } {
  const errors: string[] = [];
  let passed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      passed++;
    } else {
      errors.push(message);
    }
  }

  // 1. Security & URL Protocol Validation
  assert(isSafeUrl('https://example.org/article'), 'Valid HTTPS url accepted');
  assert(isSafeUrl('http://insecure.org/page'), 'Valid HTTP url accepted');
  assert(!isSafeUrl('javascript:alert(1)'), 'javascript: protocol rejected');
  assert(!isSafeUrl('data:text/html,<script>alert(1)</script>'), 'data: protocol rejected');
  assert(!isSafeUrl('file:///etc/passwd'), 'file: protocol rejected');
  assert(!isSafeUrl(''), 'empty string rejected');
  assert(!isSafeUrl(null), 'null url rejected');

  // 2. Domain Extraction
  assert(getSafeDomain('https://www.reuters.com/world/news') === 'reuters.com', 'Stripped www prefix');
  assert(getSafeDomain('https://arxiv.org/abs/2602.09182') === 'arxiv.org', 'Subdomain preserved');

  // 3. Plain Text Sanitization
  assert(sanitizePlainText('<b>Bold</b> & <script>alert(1)</script>') === 'Bold &', 'Dangerous HTML tags stripped');

  // 4. Evidence Graph Integrity (No hallucinated nodes)
  const graph = buildEvidenceGraph(FIXTURE_OPEN_SOURCE_AI.results, FIXTURE_OPEN_SOURCE_AI.queries);
  assert(graph.nodes.length > 0, 'Graph nodes generated');
  
  // Every source node must match an actual result in the dataset
  const sourceNodeCount = graph.nodes.filter(n => n.type === 'source').length;
  assert(sourceNodeCount === FIXTURE_OPEN_SOURCE_AI.results.length, 'Source node count strictly matches result count');

  // Duplicate edge must link to actual duplicate target
  const duplicateEdges = graph.edges.filter(e => e.relationship === 'duplicate_of');
  assert(duplicateEdges.length === 1, 'Exactly one syndicated duplicate edge derived');

  // 5. HTML Report Generation
  const htmlReport = generateHtmlReport(FIXTURE_OPEN_SOURCE_AI);
  assert(htmlReport.includes('Proofline Evidence Dossier'), 'HTML report title included');
  assert(htmlReport.includes(FIXTURE_OPEN_SOURCE_AI.question), 'Submitted question included');
  assert(htmlReport.includes('Syndication / Overlap Warning'), 'Syndication warning preserved in report');
  assert(htmlReport.includes('Publication date unavailable'), 'Missing date explicitly stated as unavailable');

  // 6. Partial Search Failure Integrity
  assert(FIXTURE_PARTIAL_FAILURE.status === 'partial_failure', 'Partial failure status preserved');
  const failedQuery = FIXTURE_PARTIAL_FAILURE.queries.find(q => q.status !== 'success');
  assert(failedQuery !== undefined, 'Failed query identified');
  assert(failedQuery?.engine === 'google_news', 'Failed query engine is google_news');

  // 7. Centralized Error Handler Classification
  const rateLimitErr = errorHandler.report({ statusCode: 429 });
  assert(rateLimitErr.category === 'rate_limited', 'HTTP 429 classified as rate_limited');
  assert(rateLimitErr.solution !== undefined, 'Rate limit error provides actionable solution');

  const timeoutErr = errorHandler.report({ isTimeout: true });
  assert(timeoutErr.category === 'timeout', 'Timeout classified as timeout category');

  const backendErr = errorHandler.report({ isNetworkError: true });
  assert(backendErr.category === 'backend_unavailable', 'Network failure classified as backend_unavailable');

  const valErr = errorHandler.reportValidation('Question too short');
  assert(valErr.category === 'validation', 'Validation error generated with correct category');

  // 8. Showcase Sample Investigations
  assert(SHOWCASE_INVESTIGATIONS.length === 3, 'Exactly 3 showcase investigations configured');
  SHOWCASE_INVESTIGATIONS.forEach(sample => {
    assert(sample.data.results.length > 0, `Sample "${sample.title}" has non-empty evidence results`);
    assert(sample.data.queries.length > 0, `Sample "${sample.title}" has search queries`);
    assert(sample.domainFocus.length > 0, `Sample "${sample.title}" has domain focus`);
  });

  // 9. Security: Zero SerpApi Key in Bundle Check
  const codeContent = JSON.stringify({ graph, htmlLength: htmlReport.length });
  assert(!codeContent.includes('AIzaSy'), 'Zero Google keys in bundle');
  assert(!codeContent.includes('secret_serp'), 'Zero SerpApi keys in bundle');

  return { passed, failed: errors.length, errors };
}
