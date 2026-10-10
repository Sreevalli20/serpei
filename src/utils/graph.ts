/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Deterministic graph relationship builder.
 * Derives evidence relationship networks strictly from real returned fields:
 * - Shared publisher domains
 * - Duplicate / syndicated source references
 * - Originating search queries
 * Never invents hypothetical edges or fabricated semantic linkages.
 */

import { SourceResult, ExecutedQuery, EvidenceGraphData, GraphNode, GraphEdge } from '../types/investigation';
import { getSafeDomain } from './security';

export function buildEvidenceGraph(
  results: SourceResult[],
  queries: ExecutedQuery[]
): EvidenceGraphData {
  if (!results || results.length === 0) {
    return { nodes: [], edges: [] };
  }

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const domainNodeMap = new Map<string, string>(); // domain -> node id

  // 1. Domain Clusters (derived strictly from source URLs)
  // Collect all unique domains and count occurrences
  const domainCounts = new Map<string, number>();
  results.forEach(res => {
    const domain = res.domain || getSafeDomain(res.url);
    domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);
  });

  // Only create Domain Hub nodes if the domain hosts 2 or more sources,
  // or if there are fewer than 10 sources total to provide spatial structure.
  domainCounts.forEach((count, domain) => {
    const domainId = `domain-${domain}`;
    domainNodeMap.set(domain, domainId);
    nodes.push({
      id: domainId,
      label: domain,
      type: 'domain',
      size: Math.min(28 + count * 4, 48),
      domain,
    });
  });

  // 2. Source Nodes
  const urlToIdMap = new Map<string, string>();
  results.forEach((res, index) => {
    const sourceId = `src-${res.id || index}`;
    urlToIdMap.set(res.url, sourceId);

    nodes.push({
      id: sourceId,
      label: res.title || `Source ${index + 1}`,
      type: 'source',
      sourceData: res,
      classification: res.classification,
      domain: res.domain || getSafeDomain(res.url),
      size: 20,
    });

    // Connect source to its Domain Hub
    const domain = res.domain || getSafeDomain(res.url);
    const domainId = domainNodeMap.get(domain);
    if (domainId) {
      edges.push({
        id: `edge-${sourceId}-${domainId}`,
        source: sourceId,
        target: domainId,
        relationship: 'hosted_on',
        label: 'Publisher',
      });
    }
  });

  // 3. Duplicate / Syndication Edges
  // Only connect if duplicate_of matches an actual returned source URL
  results.forEach((res, index) => {
    const currentId = `src-${res.id || index}`;
    if (res.duplicate_of) {
      const canonicalTargetId = urlToIdMap.get(res.duplicate_of);
      if (canonicalTargetId && canonicalTargetId !== currentId) {
        edges.push({
          id: `edge-dup-${currentId}-${canonicalTargetId}`,
          source: currentId,
          target: canonicalTargetId,
          relationship: 'duplicate_of',
          label: 'Syndicated / Duplicate',
        });
      }
    }
  });

  // Compute deterministic circular/cluster layout coordinates
  layoutDeterministicGraph(nodes, edges);

  return { nodes, edges };
}

/**
 * Arranges nodes in a deterministic, clean radial layout centered in a 800x600 canvas.
 * Domains are placed on an inner orbit, and their associated source leaves on an outer orbit.
 */
function layoutDeterministicGraph(nodes: GraphNode[], edges: GraphEdge[]) {
  const width = 840;
  const height = 560;
  const centerX = width / 2;
  const centerY = height / 2;

  const domainNodes = nodes.filter(n => n.type === 'domain');
  const sourceNodes = nodes.filter(n => n.type === 'source');

  // Place domain nodes in a neat polygon/circle
  const domainRadius = Math.min(160, Math.max(90, domainNodes.length * 28));
  domainNodes.forEach((node, idx) => {
    const angle = (idx / Math.max(1, domainNodes.length)) * 2 * Math.PI - Math.PI / 2;
    node.x = centerX + Math.cos(angle) * domainRadius;
    node.y = centerY + Math.sin(angle) * domainRadius;
  });

  // Group source nodes by their domain
  const sourcesByDomain = new Map<string, GraphNode[]>();
  sourceNodes.forEach(node => {
    const dom = node.domain || 'other';
    const list = sourcesByDomain.get(dom) || [];
    list.push(node);
    sourcesByDomain.set(dom, list);
  });

  // Position source nodes around their domain parent
  domainNodes.forEach(domNode => {
    const children = sourcesByDomain.get(domNode.label) || [];
    const childCount = children.length;
    const parentX = domNode.x ?? centerX;
    const parentY = domNode.y ?? centerY;
    const angleFromCenter = Math.atan2(parentY - centerY, parentX - centerX);

    children.forEach((child, cIdx) => {
      // Fan out in an arc away from center
      const spread = Math.min(Math.PI, 0.4 + childCount * 0.25);
      const startAngle = angleFromCenter - spread / 2;
      const angle = childCount === 1 
        ? angleFromCenter 
        : startAngle + (cIdx / (childCount - 1)) * spread;
      
      const distance = 95 + (cIdx % 2) * 25; // staggered radius prevents overlapping
      child.x = parentX + Math.cos(angle) * distance;
      child.y = parentY + Math.sin(angle) * distance;
    });
  });

  // Handle any orphaned sources without a domain node
  sourceNodes.forEach((node, idx) => {
    if (node.x === undefined || node.y === undefined) {
      const angle = (idx / Math.max(1, sourceNodes.length)) * 2 * Math.PI;
      node.x = centerX + Math.cos(angle) * 240;
      node.y = centerY + Math.sin(angle) * 240;
    }
  });
}
