/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Centralized Error Handling Service for Proofline.
 * Normalizes, classifies, and broadcasts errors across the application.
 */

export type ErrorSeverity = 'error' | 'warning' | 'info';

export type ErrorCategory = 
  | 'network_offline'
  | 'backend_unavailable'
  | 'rate_limited'
  | 'timeout'
  | 'invalid_response'
  | 'validation'
  | 'unknown';

export interface AppError {
  id: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  title: string;
  message: string;
  solution?: string;
  retryAction?: () => void;
  timestamp: number;
}

type ErrorListener = (error: AppError | null) => void;

class ErrorService {
  private listeners: Set<ErrorListener> = new Set();
  private currentError: AppError | null = null;

  subscribe(listener: ErrorListener): () => void {
    this.listeners.add(listener);
    listener(this.currentError);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.currentError));
  }

  clearError() {
    this.currentError = null;
    this.notify();
  }

  report(err: unknown, retryAction?: () => void): AppError {
    const errorObj = this.classify(err, retryAction);
    this.currentError = errorObj;
    this.notify();
    return errorObj;
  }

  reportValidation(message: string, solution = 'Please review and adjust your input.'): AppError {
    const errorObj: AppError = {
      id: `val-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      category: 'validation',
      severity: 'warning',
      title: 'Input Validation Notice',
      message,
      solution,
      timestamp: Date.now(),
    };
    this.currentError = errorObj;
    this.notify();
    return errorObj;
  }

  private classify(err: any, retryAction?: () => void): AppError {
    const id = `err-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const timestamp = Date.now();

    // Check offline browser status (in real browser environment)
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.onLine === false) {
      return {
        id,
        category: 'network_offline',
        severity: 'error',
        title: 'Network Connection Offline',
        message: 'Your browser is currently disconnected from the internet.',
        solution: 'Check your Wi-Fi or cellular network connection and try again.',
        retryAction,
        timestamp,
      };
    }

    // Check timeout
    if (err?.isTimeout || err?.name === 'AbortError' || (typeof err?.message === 'string' && err.message.toLowerCase().includes('timeout'))) {
      return {
        id,
        category: 'timeout',
        severity: 'warning',
        title: 'Request Timed Out',
        message: 'The investigation search query exceeded the 45-second execution budget.',
        solution: 'Try selecting the "Quick" depth mode for faster turnaround, or check network stability.',
        retryAction,
        timestamp,
      };
    }

    // Check HTTP status codes
    const status = err?.statusCode || err?.status;
    if (status === 429) {
      return {
        id,
        category: 'rate_limited',
        severity: 'warning',
        title: 'Rate Limit Reached',
        message: 'Upstream search provider rate limit was exceeded.',
        solution: 'Please wait 60 seconds before initiating a new investigation or reduce depth.',
        retryAction,
        timestamp,
      };
    }

    if (status === 502 || status === 503 || status === 504 || err?.isNetworkError) {
      return {
        id,
        category: 'backend_unavailable',
        severity: 'error',
        title: 'FastAPI Backend Reachability Issue',
        message: err?.message || 'Unable to establish a connection with the FastAPI backend.',
        solution: 'Verify your backend is running (port 8000) or update the backend URL in Settings.',
        retryAction,
        timestamp,
      };
    }

    if (status === 400 || status === 422) {
      return {
        id,
        category: 'validation',
        severity: 'warning',
        title: 'Investigation Parameter Error',
        message: err?.message || 'The submitted parameters did not meet backend validation constraints.',
        solution: 'Ensure the question is between 5 and 500 characters with allowed scope/depth values.',
        retryAction,
        timestamp,
      };
    }

    if (err?.details && typeof err.message === 'string' && err.message.includes('response format')) {
      return {
        id,
        category: 'invalid_response',
        severity: 'error',
        title: 'Malformed Server Response',
        message: 'The backend returned an unexpected response structure.',
        solution: 'Ensure the backend matches the Proofline FastAPI schema contracts.',
        retryAction,
        timestamp,
      };
    }

    return {
      id,
      category: 'unknown',
      severity: 'error',
      title: 'Investigation Error',
      message: err?.message || 'An unexpected error occurred while executing the investigation.',
      solution: 'Please retry your request. If the issue persists, inspect the backend logs.',
      retryAction,
      timestamp,
    };
  }
}

export const errorHandler = new ErrorService();
