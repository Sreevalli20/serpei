/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Backend Configuration & Service Status Modal:
 * Allows configuring the FastAPI base URL, executing real health checks,
 * inspecting active provider status, and reviewing the API integration contract.
 * Supports Light and Dark themes.
 */

import React, { useState } from 'react';
import { 
  X, 
  Server, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert
} from 'lucide-react';
import { HealthCheckResponse } from '../types/investigation';
import { getEffectiveApiBaseUrl, setCustomApiBaseUrl } from '../services/api';

interface BackendConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  health: HealthCheckResponse | null;
  isCheckingHealth: boolean;
  onCheckHealth: () => void;
  healthError: string | null;
  onUrlUpdated: () => void;
}

export const BackendConfigModal: React.FC<BackendConfigModalProps> = ({
  isOpen,
  onClose,
  health,
  isCheckingHealth,
  onCheckHealth,
  healthError,
  onUrlUpdated,
}) => {
  const [urlInput, setUrlInput] = useState(() => getEffectiveApiBaseUrl());
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomApiBaseUrl(urlInput);
    setSaveSuccess(true);
    onUrlUpdated();
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleResetToDefault = () => {
    setCustomApiBaseUrl(null);
    const def = (import.meta as any).env?.VITE_API_BASE_URL || '';
    setUrlInput(def);
    onUrlUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 z-10 transition-colors"
        role="dialog"
        aria-modal="true"
        aria-labelledby="backend-config-title"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 id="backend-config-title" className="text-sm font-bold text-slate-900 dark:text-white">
              Backend Integration & Status
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Service Health Status */}
        <div className="mt-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Service Health
            </span>
            <button
              onClick={onCheckHealth}
              disabled={isCheckingHealth}
              className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50 font-medium"
            >
              <RefreshCw className={`w-3 h-3 ${isCheckingHealth ? 'animate-spin' : ''}`} />
              <span>Ping /api/health</span>
            </button>
          </div>

          {health ? (
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Backend status: {health.status}</span>
              </div>
              <div className="text-slate-600 dark:text-slate-400">
                Search provider: <span className="text-slate-900 dark:text-slate-200 font-mono">{health.search_provider}</span>
              </div>
              {health.version && (
                <div className="text-slate-600 dark:text-slate-400">
                  Backend version: <span className="text-slate-900 dark:text-slate-200 font-mono">{health.version}</span>
                </div>
              )}
            </div>
          ) : healthError ? (
            <div className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Health Check Unreachable</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px] mt-1">
                {healthError}
              </p>
            </div>
          ) : (
            <div className="text-xs text-slate-500">
              No health check performed yet in this session.
            </div>
          )}
        </div>

        {/* Backend Base URL Form */}
        <form onSubmit={handleSaveUrl} className="mt-5 space-y-3">
          <label htmlFor="backend-url" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            FastAPI Base URL
          </label>
          <div className="flex gap-2">
            <input
              id="backend-url"
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="e.g. http://localhost:8000 or https://api.yourdomain.com"
              className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
            />
            <button
              type="submit"
              className="px-3.5 py-2 text-xs font-semibold text-white dark:text-slate-950 bg-emerald-600 dark:bg-emerald-400 hover:bg-emerald-500 dark:hover:bg-emerald-300 rounded-lg transition-colors font-sans cursor-pointer shadow-xs"
            >
              {saveSuccess ? 'Saved' : 'Apply'}
            </button>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Leave empty if frontend and backend share the origin.</span>
            <button
              type="button"
              onClick={handleResetToDefault}
              className="text-slate-600 dark:text-slate-400 hover:underline cursor-pointer"
            >
              Reset to default
            </button>
          </div>
        </form>

        {/* Security & Deployment Notice */}
        <div className="mt-6 p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-lg text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-300 font-medium text-[11px]">
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Strict Security Discipline</span>
          </div>
          <p className="leading-relaxed text-[11px]">
            SerpApi credentials are stored strictly in private server-side environment variables on Render. The frontend never requests, stores, or handles SerpApi secrets.
          </p>
        </div>

      </div>
    </div>
  );
};
