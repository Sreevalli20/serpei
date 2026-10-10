/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Simple, dismissible onboarding walkthrough for Proofline.
 * Highlights key investigative features: claim input, search scope,
 * evidence ledger classification, and the relationship graph.
 */

import React, { useState } from 'react';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Search, 
  SlidersHorizontal, 
  Layers, 
  Network,
  Sparkles
} from 'lucide-react';

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSampleCase?: () => void;
}

interface TourStep {
  title: string;
  subtitle: string;
  description: string;
  highlightIcon: React.ReactNode;
  tips: string[];
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Posing the Research Question',
    subtitle: 'Step 1 of 4: Direct Claim & Inquiry Input',
    description: 'Enter a clear, specific question or claim. Proofline does not generate speculative responses; instead, it formulates targeted search queries for your FastAPI backend.',
    highlightIcon: <Search className="w-6 h-6 text-emerald-400" />,
    tips: [
      'Posing neutral, empirical questions yields the most balanced source discovery.',
      'Input is validated client-side (5-500 characters) before initiating search requests.',
    ],
  },
  {
    title: 'Calibrating Scope & Investigation Depth',
    subtitle: 'Step 2 of 4: Multi-Angle Search Tuning',
    description: 'Select your scope (Global, News, Academic Research, or Regional) and investigation depth (Quick, Balanced, or Deep).',
    highlightIcon: <SlidersHorizontal className="w-6 h-6 text-emerald-400" />,
    tips: [
      'Quick mode executes a single fast query for quick snippet scanning.',
      'Deep mode decomposes your question into complementary queries across search engines.',
    ],
  },
  {
    title: 'Distinguishing Observations in the Evidence Ledger',
    subtitle: 'Step 3 of 4: Rule-Based Evidence Classification',
    description: 'Examine raw search snippets alongside transparent rule-based classifications: Potentially Supporting, Potentially Conflicting, Unclassified, and Insufficient Context.',
    highlightIcon: <Layers className="w-6 h-6 text-emerald-400" />,
    tips: [
      'Search snippets reflect what third parties wrote, not verified ground truth.',
      'Syndicated wire copies are flagged so repetition is not mistaken for independent corroboration.',
    ],
  },
  {
    title: 'Visualizing Connections & Exporting Dossiers',
    subtitle: 'Step 4 of 4: Domain Networks & Reproducible Reports',
    description: 'Explore publisher co-occurrence clusters in the interactive SVG relationship graph, inspect provenance in the detail drawer, and download standalone HTML or JSON research dossiers.',
    highlightIcon: <Network className="w-6 h-6 text-emerald-400" />,
    tips: [
      'Zoom and pan the graph or switch to the accessible table view.',
      'Exported HTML dossiers are self-contained and ready for archival printing.',
    ],
  },
];

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isOpen,
  onClose,
  onSelectSampleCase,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStepIndex(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7 z-10 transition-colors"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-modal-title"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-emerald-500 font-bold">◈</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Welcome to Proofline
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Dismiss tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="flex gap-1.5 mt-4 mb-5">
          {TOUR_STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                idx === currentStepIndex
                  ? 'bg-emerald-500'
                  : idx < currentStepIndex
                  ? 'bg-emerald-300 dark:bg-emerald-700'
                  : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/60 shrink-0">
              {currentStep.highlightIcon}
            </div>
            <div>
              <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                {currentStep.subtitle}
              </div>
              <h2 id="tour-modal-title" className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {currentStep.title}
              </h2>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {currentStep.description}
          </p>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-xl space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Key Analyst Tip
            </span>
            <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
              {currentStep.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-500 dark:text-emerald-400 shrink-0 font-bold">&bull;</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            Skip Walkthrough
          </button>

          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-1.5 text-xs font-semibold text-white dark:text-slate-950 bg-emerald-600 dark:bg-emerald-400 hover:bg-emerald-500 dark:hover:bg-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span>{isLastStep ? 'Get Started' : 'Next'}</span>
              {isLastStep ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
