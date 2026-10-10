/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Typed contracts for Proofline evidence investigation.
 * Strictly reflects backend response schemas without fabricated metrics.
 */

export type InvestigationScope = 'global' | 'news' | 'academic' | 'regional';
export type InvestigationDepth = 'quick' | 'balanced' | 'deep';

export type EvidenceClassification = 
  | 'supporting' 
  | 'conflicting' 
  | 'unclassified' 
  | 'insufficient_context';

export interface ExecutedQuery {
  engine: string;
  query: string;
  status: 'success' | 'failed' | 'rate_limited';
  resultcount: number;
  error?: string;
}

export interface SourceResult {
  id: string;
  title: string;
  url: string;
  domain: string;
  snippet: string;
  publishedat: string | null;
  retrievedat: string;
  engine: string;
  query: string;
  classification: EvidenceClassification;
  classificationreason: string;
  duplicate_of: string | null;
  overlap_domains?: string[];
}

export interface InvestigationSummary {
  headline: string;
  supporting_count: number;
  conflicting_count: number;
  unclassified_count: number;
  insufficient_count: number;
  observation_notes: string[];
}

export interface InvestigationResponse {
  id: string;
  question: string;
  scope: InvestigationScope;
  depth: InvestigationDepth;
  status: 'completed' | 'partial_failure' | 'failed';
  createdat: string;
  completedat: string;
  queries: ExecutedQuery[];
  results: SourceResult[];
  summary?: InvestigationSummary | null;
  warnings: string[];
  isTestFixture?: boolean;
}

export interface InvestigationRequest {
  question: string;
  scope: InvestigationScope;
  depth: InvestigationDepth;
}

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  search_provider: string;
  version?: string;
  timestamp?: string;
}

export interface InvestigationFilters {
  searchQuery: string;
  domain: string;
  classification: 'all' | EvidenceClassification;
  dateFilter: 'all' | 'has_date' | 'missing_date';
  uniquenessFilter: 'all' | 'unique_only' | 'duplicates_only';
  executedQuery: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'query' | 'domain' | 'source';
  sourceData?: SourceResult;
  classification?: EvidenceClassification;
  size?: number;
  x?: number;
  y?: number;
  domain?: string;
  duplicateCount?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: 'retrieved_by' | 'hosted_on' | 'duplicate_of' | 'shares_content';
  label?: string;
}

export interface EvidenceGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
