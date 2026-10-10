/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Evidence Relationship Graph:
 * Grounded interactive graph derived strictly from actual returned data:
 * - Shared publisher domains
 * - Duplicate / syndicated source references
 * Includes zoom/pan controls, node inspection tooltips, and an accessible list alternative.
 * Dynamically adapts to Light and Dark themes.
 */

import React, { useState, useMemo, useRef } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  List, 
  Network, 
  Info, 
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { SourceResult, ExecutedQuery, GraphNode } from '../types/investigation';
import { buildEvidenceGraph } from '../utils/graph';
import { isSafeUrl } from '../utils/security';
import { useTheme } from '../services/themeContext';

interface EvidenceRelationshipGraphProps {
  results: SourceResult[];
  queries: ExecutedQuery[];
  onInspectSource: (source: SourceResult) => void;
}

export const EvidenceRelationshipGraph: React.FC<EvidenceRelationshipGraphProps> = ({
  results,
  queries,
  onInspectSource,
}) => {
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Build graph strictly from real returned results
  const graphData = useMemo(() => {
    return buildEvidenceGraph(results, queries);
  }, [results, queries]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const getNodeColor = (node: GraphNode) => {
    if (node.type === 'domain') {
      return theme === 'dark' ? '#334155' : '#64748b';
    }
    switch (node.classification) {
      case 'supporting': return theme === 'dark' ? '#10b981' : '#059669';
      case 'conflicting': return theme === 'dark' ? '#f43f5e' : '#dc2626';
      case 'insufficient_context': return theme === 'dark' ? '#f59e0b' : '#d97706';
      default: return theme === 'dark' ? '#94a3b8' : '#64748b';
    }
  };

  // Groupings for accessible list view
  const domainClusters = useMemo(() => {
    const map = new Map<string, SourceResult[]>();
    results.forEach(r => {
      const list = map.get(r.domain) || [];
      list.push(r);
      map.set(r.domain, list);
    });
    return Array.from(map.entries());
  }, [results]);

  const duplicatesList = useMemo(() => {
    return results.filter(r => Boolean(r.duplicate_of));
  }, [results]);

  if (results.length < 2) {
    return (
      <div className="text-center py-12 bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl p-6 transition-colors">
        <Network className="w-8 h-8 text-slate-400 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-300 mb-1">
          Insufficient Relationship Data
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          At least 2 sources are required to compute verifiable domain clustering and syndication overlaps. Only {results.length} source is available.
        </p>
      </div>
    );
  }

  const isDark = theme === 'dark';

  return (
    <div className="space-y-4">
      
      {/* Top Toolbar: View mode toggle & Zoom controls */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-center justify-between flex-wrap gap-3 shadow-xs transition-colors">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode('graph')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'graph'
                ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Interactive Graph</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Accessible List View</span>
          </button>
        </div>

        {viewMode === 'graph' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setZoom(prev => Math.min(prev + 0.2, 2.5))}
                className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Zoom in"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.4))}
                className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Zoom out"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={resetView}
                className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Reset zoom and pan"
                aria-label="Reset zoom and pan"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mode A: Interactive SVG Canvas */}
      {viewMode === 'graph' ? (
        <div 
          className="relative bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden h-[540px] cursor-grab active:cursor-grabbing select-none transition-colors"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Canvas Grid Background */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-25"
            style={{
              backgroundImage: isDark 
                ? 'radial-gradient(#334155 1px, transparent 1px)' 
                : 'radial-gradient(#cbd5e1 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* SVG Renderer */}
          <svg 
            className="w-full h-full"
            viewBox="0 0 840 560"
            preserveAspectRatio="xMidYMid meet"
          >
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              
              {/* Edges */}
              {graphData.edges.map((edge) => {
                const sourceNode = graphData.nodes.find(n => n.id === edge.source);
                const targetNode = graphData.nodes.find(n => n.id === edge.target);
                if (!sourceNode || !targetNode) return null;

                const isDuplicateEdge = edge.relationship === 'duplicate_of';
                const edgeColor = isDuplicateEdge 
                  ? (isDark ? '#f59e0b' : '#d97706') 
                  : (isDark ? '#334155' : '#cbd5e1');

                return (
                  <line
                    key={edge.id}
                    x1={sourceNode.x ?? 0}
                    y1={sourceNode.y ?? 0}
                    x2={targetNode.x ?? 0}
                    y2={targetNode.y ?? 0}
                    stroke={edgeColor}
                    strokeWidth={isDuplicateEdge ? 2 : 1.2}
                    strokeDasharray={isDuplicateEdge ? '4 3' : undefined}
                    opacity={isDuplicateEdge ? 0.9 : 0.6}
                  />
                );
              })}

              {/* Nodes */}
              {graphData.nodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isHovered = hoveredNode?.id === node.id;
                const radius = node.type === 'domain' ? 22 : 12;

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x ?? 0}, ${node.y ?? 0})`}
                    className="cursor-pointer transition-transform"
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNodeId(node.id);
                      if (node.sourceData) {
                        onInspectSource(node.sourceData);
                      }
                    }}
                  >
                    {/* Highlight ring if selected */}
                    {isSelected && (
                      <circle
                        r={radius + 6}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                        className="animate-pulse"
                      />
                    )}

                    {/* Outer node circle */}
                    <circle
                      r={radius}
                      fill={getNodeColor(node)}
                      stroke={isDark ? '#0f172a' : '#ffffff'}
                      strokeWidth="2"
                      opacity={isHovered ? 1 : 0.9}
                    />

                    {/* Node Label */}
                    <text
                      y={node.type === 'domain' ? 34 : 22}
                      textAnchor="middle"
                      fill={isDark ? '#94a3b8' : '#475569'}
                      fontSize={node.type === 'domain' ? 11 : 9}
                      fontFamily="monospace"
                      className="pointer-events-none select-none font-medium"
                    >
                      {node.type === 'domain' 
                        ? node.label 
                        : (node.label.length > 20 ? `${node.label.slice(0, 18)}...` : node.label)
                      }
                    </text>
                  </g>
                );
              })}

            </g>
          </svg>

          {/* Interactive Inspection Tooltip Overlay */}
          {hoveredNode && (
            <div className="absolute bottom-4 left-4 max-w-sm p-3 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl text-xs pointer-events-none backdrop-blur z-20">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-semibold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">
                  {hoveredNode.type === 'domain' ? 'Publisher Domain Hub' : 'Source Document'}
                </span>
                {hoveredNode.classification && (
                  <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 capitalize">
                    {hoveredNode.classification.replace('_', ' ')}
                  </span>
                )}
              </div>
              <p className="text-slate-800 dark:text-slate-200 font-medium line-clamp-2">
                {hoveredNode.label}
              </p>
              {hoveredNode.sourceData && (
                <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-1 line-clamp-2">
                  {hoveredNode.sourceData.snippet}
                </p>
              )}
              {hoveredNode.sourceData?.duplicate_of && (
                <div className="mt-1 text-amber-600 dark:text-amber-400 text-[10px] flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Syndication overlap detected</span>
                </div>
              )}
            </div>
          )}

          {/* Legend / Key Overlay */}
          <div className="absolute top-3 right-3 p-2.5 bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] text-slate-700 dark:text-slate-300 space-y-1.5 backdrop-blur pointer-events-none shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-500 dark:bg-slate-700" />
              <span>Publisher Domain Hub</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-emerald-500" />
              <span>Supporting Source</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 dark:bg-rose-500" />
              <span>Conflicting Source</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span>Unclassified Source</span>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
              <span className="w-4 h-0 border-t border-dashed border-amber-500 dark:border-amber-400" />
              <span>Duplicate / Syndicated Link</span>
            </div>
          </div>

        </div>
      ) : (
        /* Mode B: Accessible Relationship Table and List View */
        <div className="space-y-6 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
          
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-200 mb-1">
              Domain Co-Occurrence Clusters
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
              Identifies which reporting outlets account for multiple retrieved search results.
            </p>
            <div className="space-y-3">
              {domainClusters.map(([domain, sources]) => (
                <div key={domain} className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 font-mono">
                      {domain}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                      {sources.length} {sources.length === 1 ? 'source' : 'sources'}
                    </span>
                  </div>
                  <ul className="space-y-1 pl-2">
                    {sources.map(s => (
                      <li key={s.id} className="text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between gap-2">
                        <button
                          onClick={() => onInspectSource(s)}
                          className="hover:underline text-left truncate hover:text-emerald-700 dark:hover:text-emerald-300 cursor-pointer"
                        >
                          &bull; {s.title}
                        </button>
                        <span className="text-[11px] text-slate-500 capitalize shrink-0 font-mono">
                          {s.classification.replace('_', ' ')}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {duplicatesList.length > 0 && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Flagged Duplicate & Syndicated Coverage</span>
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                Sources sharing verbatim reporting or wire syndicate coverage.
              </p>
              <div className="space-y-2">
                {duplicatesList.map(dup => (
                  <div key={dup.id} className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg text-xs text-slate-700 dark:text-slate-300">
                    <div className="font-semibold text-slate-900 dark:text-slate-200">{dup.title} ({dup.domain})</div>
                    <div className="text-amber-700 dark:text-amber-400 text-[11px] mt-1">
                      Duplicate of canonical source: <span className="font-mono">{dup.duplicate_of}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
