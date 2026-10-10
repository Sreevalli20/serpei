/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Non-intrusive, contextual Error Notification Component.
 * Listens to the centralized errorHandler service and displays
 * clear diagnostic details, potential solutions, and interactive action buttons.
 */

import React, { useEffect, useState } from 'react';
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  X, 
  RotateCcw, 
  ExternalLink,
  WifiOff,
  ServerCrash
} from 'lucide-react';
import { AppError, errorHandler } from '../services/errorHandler';

interface ErrorNotificationProps {
  onOpenSettings?: () => void;
}

export const ErrorNotification: React.FC<ErrorNotificationProps> = ({ onOpenSettings }) => {
  const [activeError, setActiveError] = useState<AppError | null>(null);

  useEffect(() => {
    return errorHandler.subscribe((err) => {
      setActiveError(err);
    });
  }, []);

  if (!activeError) return null;

  const handleDismiss = () => {
    errorHandler.clearError();
  };

  const getIcon = () => {
    switch (activeError.category) {
      case 'network_offline':
        return <WifiOff className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />;
      case 'backend_unavailable':
        return <ServerCrash className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />;
      case 'rate_limited':
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />;
      case 'timeout':
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />;
      case 'validation':
        return <Info className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />;
      default:
        return <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />;
    }
  };

  const isSevere = activeError.severity === 'error';

  return (
    <div 
      className="fixed bottom-5 right-5 z-50 max-w-md w-full animate-in fade-in slide-in-from-bottom-5 duration-200"
      role="alert"
    >
      <div className={`p-4 rounded-xl shadow-2xl border transition-colors ${
        isSevere
          ? 'bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-900/60 text-slate-900 dark:text-slate-100'
          : 'bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-900/60 text-slate-900 dark:text-slate-100'
      }`}>
        <div className="flex items-start gap-3">
          {getIcon()}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold tracking-tight uppercase text-slate-900 dark:text-white">
                {activeError.title}
              </h3>
              <button
                onClick={handleDismiss}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-0.5 rounded cursor-pointer"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              {activeError.message}
            </p>

            {activeError.solution && (
              <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                <strong className="text-slate-700 dark:text-slate-300">Suggested Action: </strong>
                {activeError.solution}
              </div>
            )}

            <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {activeError.retryAction && (
                <button
                  onClick={() => {
                    activeError.retryAction?.();
                    handleDismiss();
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-white bg-slate-900 dark:bg-emerald-500 dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-emerald-400 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              )}

              {activeError.category === 'backend_unavailable' && onOpenSettings && (
                <button
                  onClick={() => {
                    onOpenSettings();
                    handleDismiss();
                  }}
                  className="px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Configure Backend URL
                </button>
              )}

              <button
                onClick={handleDismiss}
                className="ml-auto text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
