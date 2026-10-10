/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Evidence Ledger:
 * Full searchable and filterable ledger containing only actual returned results.
 * Supports light and dark mode with high contrast.
 */

import React, { useState, useMemo } from 'react';
import { 
  Filter, 
  Search, 
  RotateCcw, 
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { SourceResult, ExecutedQuery, InvestigationFilters, EvidenceClassification } from '../types/investigation';
import { EvidenceSourceCard } from './EvidenceSourceCard';

interface EvidenceLedgerProps {
  results: SourceResult[];
  queries: ExecutedQuery[];
  onInspectSource: (source: SourceResult) => void;
}

export const EvidenceLedger: React.FC<EvidenceLedgerProps> = ({
  results,
  queries,
  onInspectSource,
}) => {
  const [filters, setFilters] = useState<InvestigationFilters>({
    searchQuery: '',
    domain: 'all',
    classification: 'all',
    dateFilter: 'all',
    uniquenessFilter: 'all',
    executedQuery: 'all',
  });

  const [sortOption, setSortOption] = useState<'default' | 'domain' | 'date_desc'>('default');

  // Collect available unique domains for the dropdown
  const uniqueDomains = useMemo(() => {
    const set = new Set<string>();
    results.forEach(r => {
      if (r.domain) set.add(r.domain);
    });
    return Array.from(set).sort();
  }, [results]);

  // Collect executed queries for the query filter
  const executedQueryStrings = useMemo(() => {
    const set = new Set<string>();
    queries.forEach(q => set.add(q.query));
    return Array.from(set);
  }, [queries]);

  // Apply filters strictly client-side over loaded data
  const filteredResults = useMemo(() => {
    return results.filter(item => {
      // Free text match (title or snippet)
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesSnippet = item.snippet.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSnippet) return false;
      }

      // Domain filter
      if (filters.domain !== 'all' && item.domain !== filters.domain) {
        return false;
      }

      // Classification filter
      if (filters.classification !== 'all' && item.classification !== filters.classification) {
        return false;
      }

      // Date filter
      if (filters.dateFilter === 'has_date' && !item.publishedat) {
        return false;
      }
      if (filters.dateFilter === 'missing_date' && item.publishedat) {
        return false;
      }

      // Uniqueness filter
      if (filters.uniquenessFilter === 'unique_only' && item.duplicate_of) {
        return false;
      }
      if (filters.uniquenessFilter === 'duplicates_only' && !item.duplicate_of) {
        return false;
      }

      // Executed query filter
      if (filters.executedQuery !== 'all' && item.query !== filters.executedQuery) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortOption === 'domain') {
        return a.domain.localeCompare(b.domain);
      }
      if (sortOption === 'date_desc') {
        const dateA = a.publishedat ? new Date(a.publishedat).getTime() : 0;
        const dateB = b.publishedat ? new Date(b.publishedat).getTime() : 0;
        return dateB - dateA;
      }
      return 0; // default order
    });
  }, [results, filters, sortOption]);

  const hasActiveFilters = 
    filters.searchQuery !== '' ||
    filters.domain !== 'all' ||
    filters.classification !== 'all' ||
    filters.dateFilter !== 'all' ||
    filters.uniquenessFilter !== 'all' ||
    filters.executedQuery !== 'all';

  const resetFilters = () => {
    setFilters({
      searchQuery: '',
      domain: 'all',
      classification: 'all',
      dateFilter: 'all',
      uniquenessFilter: 'all',
      executedQuery: 'all',
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Filter and Search Bar Controls */}
      <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4 shadow-xs transition-colors">
        
        {/* Top Filter Row: Search snippet text & quick stats */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              placeholder="Search terms across titles and snippets..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="text-xs text-slate-600 dark:text-slate-400">Sort:</label>
            <select
              id="sort-select"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 transition-colors"
            >
              <option value="default">Query Order</option>
              <option value="domain">Domain (A-Z)</option>
              <option value="date_desc">Publication Date (Newest)</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                title="Reset all filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Segment Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          
          {/* Classification Filter */}
          <div>
            <label htmlFor="classification-select" className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Classification
            </label>
            <select
              id="classification-select"
              value={filters.classification}
              onChange={(e) => setFilters(prev => ({ ...prev, classification: e.target.value as any }))}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 transition-colors"
            >
              <option value="all">All Classifications</option>
              <option value="supporting">Supporting Only</option>
              <option value="conflicting">Conflicting Only</option>
              <option value="unclassified">Unclassified</option>
              <option value="insufficient_context">Insufficient Context</option>
            </select>
          </div>

          {/* Domain Filter */}
          <div>
            <label htmlFor="domain-select" className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Publisher Domain
            </label>
            <select
              id="domain-select"
              value={filters.domain}
              onChange={(e) => setFilters(prev => ({ ...prev, domain: e.target.value }))}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 transition-colors"
            >
              <option value="all">All Domains ({uniqueDomains.length})</option>
              {uniqueDomains.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Date Availability */}
          <div>
            <label htmlFor="date-select" className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Date Metadata
            </label>
            <select
              id="date-select"
              value={filters.dateFilter}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFilter: e.target.value as any }))}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 transition-colors"
            >
              <option value="all">All Dates</option>
              <option value="has_date">Has Publication Date</option>
              <option value="missing_date">Date Unavailable</option>
            </select>
          </div>

          {/* Uniqueness / Syndication */}
          <div>
            <label htmlFor="unique-select" className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Uniqueness
            </label>
            <select
              id="unique-select"
              value={filters.uniquenessFilter}
              onChange={(e) => setFilters(prev => ({ ...prev, uniquenessFilter: e.target.value as any }))}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 transition-colors"
            >
              <option value="all">All Sources</option>
              <option value="unique_only">Unique Sources Only</option>
              <option value="duplicates_only">Flagged Syndication Only</option>
            </select>
          </div>

        </div>

        {/* Results Counter Bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/60">
          <div>
            Showing <strong className="text-slate-900 dark:text-slate-200 font-mono tabular-nums">{filteredResults.length}</strong> of{' '}
            <span className="font-mono tabular-nums">{results.length}</span> sources
          </div>
          {filteredResults.length === 0 && (
            <span className="text-amber-600 dark:text-amber-400 font-medium">No sources match current filter combination</span>
          )}
        </div>

      </div>

      {/* Source Cards List */}
      <div className="space-y-4">
        {filteredResults.map((source, idx) => (
          <EvidenceSourceCard
            key={source.id || idx}
            source={source}
            index={idx}
            onInspect={onInspectSource}
          />
        ))}

        {filteredResults.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">No evidence sources match the selected criteria.</p>
            <button
              onClick={resetFilters}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer font-medium"
            >
              Clear filters to view all {results.length} sources
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
