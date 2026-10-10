/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Centralized API Service for Proofline.
 * Connects exclusively to the FastAPI backend over /api endpoints.
 * Never calls SerpApi directly. Never stores external API keys.
 */

import {
  HealthCheckResponse,
  InvestigationRequest,
  InvestigationResponse,
} from '../types/investigation';

// Local storage key for optional manual backend base URL override during testing
const OVERRIDE_STORAGE_KEY = 'proofline_api_base_override';

export function getEffectiveApiBaseUrl(): string {
  const customOverride = typeof window !== 'undefined' ? localStorage.getItem(OVERRIDE_STORAGE_KEY) : null;
  if (customOverride && customOverride.trim().length > 0) {
    return customOverride.trim().replace(/\/+$/, '');
  }
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL || '';
  return envUrl.replace(/\/+$/, '');
}

export function setCustomApiBaseUrl(url: string | null) {
  if (typeof window === 'undefined') return;
  if (!url || url.trim().length === 0) {
    localStorage.removeItem(OVERRIDE_STORAGE_KEY);
  } else {
    localStorage.setItem(OVERRIDE_STORAGE_KEY, url.trim().replace(/\/+$/, ''));
  }
}

export interface ApiError {
  message: string;
  statusCode?: number;
  isNetworkError?: boolean;
  isTimeout?: boolean;
  details?: unknown;
}

export class ProoflineApiClient {
  private timeoutMs: number;

  constructor(timeoutMs = 45000) {
    this.timeoutMs = timeoutMs;
  }

  /**
   * Health check endpoint: GET /api/health
   * Confirms actual FastAPI backend connectivity and SerpApi provider readiness.
   */
  async checkHealth(signal?: AbortSignal): Promise<HealthCheckResponse> {
    const baseUrl = getEffectiveApiBaseUrl();
    const endpoint = `${baseUrl}/api/health`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const onExternalAbort = () => controller.abort();
    if (signal) signal.addEventListener('abort', onExternalAbort);

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw {
          message: `Backend health check failed with HTTP ${response.status} (${response.statusText})`,
          statusCode: response.status,
        } as ApiError;
      }

      const data = await response.json();
      if (!data || typeof data.status !== 'string') {
        throw {
          message: 'Invalid health response format from backend.',
          details: data,
        } as ApiError;
      }

      return data as HealthCheckResponse;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw {
          message: 'Health check timed out or was cancelled.',
          isTimeout: true,
        } as ApiError;
      }
      if (err.message && err.statusCode) {
        throw err;
      }
      throw {
        message: err.message || 'Unable to connect to backend server. Ensure FastAPI is running.',
        isNetworkError: true,
      } as ApiError;
    } finally {
      clearTimeout(timeout);
      if (signal) signal.removeEventListener('abort', onExternalAbort);
    }
  }

  /**
   * Submits a research question for live search and evidence synthesis.
   * POST /api/investigations
   */
  async submitInvestigation(
    request: InvestigationRequest,
    signal?: AbortSignal
  ): Promise<InvestigationResponse> {
    const baseUrl = getEffectiveApiBaseUrl();
    const endpoint = `${baseUrl}/api/investigations`;

    // Validate request constraints client-side before sending
    const trimmedQuestion = request.question?.trim();
    if (!trimmedQuestion || trimmedQuestion.length < 5) {
      throw {
        message: 'Investigation question must be at least 5 characters long.',
        statusCode: 400,
      } as ApiError;
    }

    if (trimmedQuestion.length > 500) {
      throw {
        message: 'Investigation question cannot exceed 500 characters.',
        statusCode: 400,
      } as ApiError;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    const onExternalAbort = () => controller.abort();
    if (signal) signal.addEventListener('abort', onExternalAbort);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          question: trimmedQuestion,
          scope: request.scope || 'global',
          depth: request.depth || 'balanced',
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorBody: any = null;
        try {
          errorBody = await response.json();
        } catch {
          // ignore parsing error
        }

        const msg = errorBody?.detail || errorBody?.message || 
          `Backend returned error HTTP ${response.status} (${response.statusText})`;

        throw {
          message: msg,
          statusCode: response.status,
          details: errorBody,
        } as ApiError;
      }

      const data = await response.json();

      // Validate core required fields per Section 6 schema
      if (!data || !Array.isArray(data.queries) || !Array.isArray(data.results)) {
        throw {
          message: 'Received unexpected response format from backend: queries or results array missing.',
          details: data,
        } as ApiError;
      }

      return data as InvestigationResponse;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw {
          message: 'Investigation was cancelled or exceeded execution timeout limit (45s).',
          isTimeout: true,
        } as ApiError;
      }
      if (err.message && err.statusCode) {
        throw err;
      }
      throw {
        message: err.message || 'Network connection failed while communicating with the backend.',
        isNetworkError: true,
      } as ApiError;
    } finally {
      clearTimeout(timeout);
      if (signal) signal.removeEventListener('abort', onExternalAbort);
    }
  }

  /**
   * Fetches an existing investigation by ID if backend supports persistence.
   * GET /api/investigations/{id}
   */
  async getInvestigation(id: string, signal?: AbortSignal): Promise<InvestigationResponse> {
    const baseUrl = getEffectiveApiBaseUrl();
    const endpoint = `${baseUrl}/api/investigations/${encodeURIComponent(id)}`;

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal,
      });

      if (!response.ok) {
        throw {
          message: `Could not retrieve investigation ${id}: HTTP ${response.status}`,
          statusCode: response.status,
        } as ApiError;
      }

      return await response.json();
    } catch (err: any) {
      if (err.statusCode) throw err;
      throw {
        message: err.message || `Failed to fetch investigation ${id}`,
        isNetworkError: true,
      } as ApiError;
    }
  }
}

export const apiClient = new ProoflineApiClient();
