/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Top Bar Navigation:
 * [Brand wordmark] — [Investigation / Sample Navigation] — [Theme Toggle & Service Status]
 */

import React from 'react';
import { Sun, Moon, Server, Settings } from 'lucide-react';
import { useTheme } from '../services/themeContext';

interface HeaderProps {
  activeTab: 'workspace' | 'showcase';
  onSelectTab: (tab: 'workspace' | 'showcase') => void;
  onOpenSettings: () => void;
  isBackendHealthy: boolean | null;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenSettings,
  isBackendHealthy,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Brand wordmark */}
        <button 
          onClick={() => onSelectTab('workspace')}
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
        >
          <span className="text-emerald-600 dark:text-emerald-400">◈</span>
          <span>Proofline</span>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => onSelectTab('workspace')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              activeTab === 'workspace' 
                ? 'text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400 font-semibold' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Investigation Console
          </button>
          <button
            onClick={() => onSelectTab('showcase')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              activeTab === 'showcase' 
                ? 'text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400 font-semibold' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Sample Investigations
          </button>
        </nav>

        {/* Zone 3: Actions (Theme Toggle & Service Status) */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Explicit Theme Toggle Button with visual text and icon */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-xs"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-slate-700" />
                <span>Dark Mode</span>
              </>
            )}
          </button>

          {/* Service Status Action Button */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer shadow-xs"
            aria-label="Service status and backend settings"
          >
            <span 
              className={`w-2 h-2 rounded-full ${
                isBackendHealthy === true 
                  ? 'bg-emerald-500' 
                  : isBackendHealthy === false 
                  ? 'bg-amber-500' 
                  : 'bg-slate-400'
              }`} 
              aria-hidden="true"
            />
            <span>{isBackendHealthy === true ? 'Backend Connected' : 'Service Status'}</span>
          </button>
        </div>

      </div>
    </header>
  );
};
