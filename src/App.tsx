/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Proofline: Professional Evidence Investigation Platform
 * Main application coordinator.
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  InvestigationScope, 
  InvestigationDepth, 
  InvestigationResponse, 
  SourceResult, 
  HealthCheckResponse 
} from './types/investigation';
import { apiClient } from './services/api';
import { errorHandler } from './services/errorHandler';
import { ThemeProvider, useTheme } from './services/themeContext';
import { Header } from './components/Header';
import { ServiceStatusBar } from './components/ServiceStatusBar';
import { InvestigationWorkspace } from './components/InvestigationWorkspace';
import { InvestigationResults } from './components/InvestigationResults';
import { SampleShowcaseView } from './components/SampleShowcaseView';
import { SourceDetailModal } from './components/SourceDetailModal';
import { ReportExportModal } from './components/ReportExportModal';
import { BackendConfigModal } from './components/BackendConfigModal';
import { ErrorNotification } from './components/ErrorNotification';
import { ShowcaseSample } from './fixtures/sampleInvestigations';

const RECENT_STORAGE_KEY = 'proofline_recent_inquiries_v2';

function MainApp() {
  // Navigation: Workspace vs Sample Showcase
  const [activeTab, setActiveTab] = useState<'workspace' | 'showcase'>('workspace');
  
  // Workspace input parameters
  const [question, setQuestion] = useState('');
  const [scope, setScope] = useState<InvestigationScope>('global');
  const [depth, setDepth] = useState<InvestigationDepth>('balanced');

  // Execution & Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<number | null>(null);

  // Results & Inspection state
  const [investigation, setInvestigation] = useState<InvestigationResponse | null>(null);
  const [selectedSource, setSelectedSource] = useState<SourceResult | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Health check state
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);

  // Client session history
  const [recentInvestigations, setRecentInvestigations] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Check health on mount
  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    setIsCheckingHealth(true);
    setHealthError(null);
    try {
      const res = await apiClient.checkHealth();
      setHealth(res);
      setHealthError(null);
    } catch (err: any) {
      setHealth(null);
      setHealthError(err.message || 'FastAPI backend unreachable');
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const saveToRecent = (q: string, s: InvestigationScope, id: string) => {
    const newItem = {
      id,
      question: q,
      scope: s,
      timestamp: new Date().toISOString(),
    };
    const updated = [newItem, ...recentInvestigations.filter(item => item.question !== q)].slice(0, 10);
    setRecentInvestigations(updated);
    try {
      localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // storage quota or private browsing
    }
  };

  const handleClearRecent = () => {
    setRecentInvestigations([]);
    try {
      localStorage.removeItem(RECENT_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  // Submit Investigation with centralized error handling
  const handleSubmitInvestigation = async () => {
    const trimmed = question.trim();
    if (!trimmed) {
      errorHandler.reportValidation('Please enter a research question or proposition to investigate.');
      return;
    }
    if (trimmed.length < 5) {
      errorHandler.reportValidation('Investigation question must be at least 5 characters long.');
      return;
    }

    setIsLoading(true);
    setElapsedSeconds(0);
    setLoadingPhase('Formulating search queries via backend...');
    errorHandler.clearError();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Start timer with progressive truthful phase updates
    timerRef.current = window.setInterval(() => {
      setElapsedSeconds(prev => {
        const next = prev + 1;
        if (next === 2) setLoadingPhase('Executing SerpApi requests on web indices...');
        if (next === 5) setLoadingPhase('Retrieving organic snippets & publisher metadata...');
        if (next === 8) setLoadingPhase('Performing rule-based evidence classification...');
        return next;
      });
    }, 1000);

    try {
      const result = await apiClient.submitInvestigation(
        { question: trimmed, scope, depth },
        controller.signal
      );
      setInvestigation(result);
      saveToRecent(trimmed, scope, result.id || `inv-${Date.now()}`);
      setActiveTab('workspace');
    } catch (err: any) {
      errorHandler.report(err, () => handleSubmitInvestigation());
    } finally {
      setIsLoading(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      abortControllerRef.current = null;
    }
  };

  const handleCancelInvestigation = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Select pre-defined showcase sample investigation
  const handleSelectSample = (sample: ShowcaseSample) => {
    setQuestion(sample.data.question);
    setScope(sample.data.scope);
    setDepth(sample.data.depth);
    setInvestigation(sample.data);
    setActiveTab('workspace');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      
      {/* Top Bar Header with Theme Switch */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isBackendHealthy={health ? health.status === 'ok' : healthError ? false : null}
      />

      {/* Service Status and Fixture Banner */}
      <ServiceStatusBar
        health={health}
        isCheckingHealth={isCheckingHealth}
        onRefreshHealth={checkBackendHealth}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isTestFixtureActive={Boolean(investigation?.isTestFixture)}
        onClearFixture={() => setInvestigation(null)}
        backendError={healthError}
      />

      {/* Main Viewport */}
      <main className="flex-1">
        {activeTab === 'workspace' && (
          investigation ? (
            <InvestigationResults
              investigation={investigation}
              onBackToSearch={() => setInvestigation(null)}
              onInspectSource={(source) => setSelectedSource(source)}
              onOpenExportModal={() => setIsExportModalOpen(true)}
            />
          ) : (
            <InvestigationWorkspace
              question={question}
              setQuestion={setQuestion}
              scope={scope}
              setScope={setScope}
              depth={depth}
              setDepth={setDepth}
              onSubmit={handleSubmitInvestigation}
              isLoading={isLoading}
              onCancel={handleCancelInvestigation}
              loadingPhase={loadingPhase}
              elapsedSeconds={elapsedSeconds}
              recentInvestigations={recentInvestigations}
              onSelectRecent={(item) => {
                setQuestion(item.question);
                setScope(item.scope);
              }}
              onClearRecent={handleClearRecent}
              onSelectSample={handleSelectSample}
            />
          )
        )}

        {activeTab === 'showcase' && (
          <SampleShowcaseView
            onSelectSample={handleSelectSample}
            onBackToSearch={() => setActiveTab('workspace')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 py-6 text-xs text-slate-500 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-400">Proofline</span>
            <span aria-hidden="true">·</span>
            <span>SerpApi India Hackathon 2026</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Backend Settings
            </button>
          </div>
        </div>
      </footer>

      {/* Global Non-intrusive Error Notification */}
      <ErrorNotification onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Modal Drawers */}
      <SourceDetailModal
        source={selectedSource}
        onClose={() => setSelectedSource(null)}
      />

      <ReportExportModal
        investigation={investigation}
        onClose={() => setIsExportModalOpen(false)}
      />

      <BackendConfigModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        health={health}
        isCheckingHealth={isCheckingHealth}
        onCheckHealth={checkBackendHealth}
        healthError={healthError}
        onUrlUpdated={checkBackendHealth}
      />

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}
