/**
 * AudioGuard – Flask API client
 * In development, requests can use Vite's /api proxy.
 * Otherwise, default to the current host on port 5001.
 */

export function resolveBaseUrl(): string {
  const configuredBaseUrl = import.meta.env.VITE_API_URL?.trim();

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    const { hostname, port, protocol } = window.location;

    if (port === '5173') {
      return '';
    }

    return `${protocol}//${hostname}:5001`;
  }

  return 'http://127.0.0.1:5001';
}

const BASE_URL = resolveBaseUrl();

export function buildApiUrl(path: string): string {
  return `${BASE_URL}${path}`;
}

// ─── Types (shared with components) ──────────────────────────────────────────

export interface AnomalyRegion {
  start_time_seconds: number;
  end_time_seconds: number;
  duration_seconds: number;
  anomaly_intensity: number;
}

export interface ExplainabilityMetrics {
  total_anomaly_regions: number;
  average_entropy: number;
  entropy_std: number;
  average_discontinuity: number;
  discontinuity_std: number;
  anomaly_coverage_percent: number;
}

export interface ExplainabilityVisualization {
  image_base64?: string;
  description?: string;
}

export interface ExplainabilityReport {
  detection_result?: {
    status: string;
    confidence: number;
  };
  findings?: string[];
  anomaly_regions?: AnomalyRegion[];
  metrics?: ExplainabilityMetrics;
  visualization?: ExplainabilityVisualization;
  forensic_visualization?: ExplainabilityVisualization;
  recommendations?: string[];
}

export interface AudioFeatures {
  mfcc: number[];
  spectralCentroid: number;
  zeroCrossingRate: number;
  rmsEnergy: number;
  spectralRolloff: number;
  tempo: number;
  pitchConsistency: number;
}

export interface DetectionResult {
  status: "Real" | "Deepfake" | "AI Generated";
  confidence: number;
  features: AudioFeatures;
}

export interface EnhancementImprovement {
  quality: number;
  noiseReduction: number;
  clarityBoost: number;
}

export interface EnhancementResult {
  improvement: EnhancementImprovement;
  originalUrl?: string;
  enhancedUrl?: string;
  downloadToken?: string;
}

export type IntelligenceRunMode = 'report' | 'full';

export interface IntelligenceStory {
  title: string;
  url: string;
  source: string;
}

export interface IntelligenceInsight {
  text: string;
  title: string;
  url: string;
}

export interface IntelligenceThemeArticle {
  title: string;
  url: string;
  source: string;
  date: string;
  score: number | null;
  snippet: string;
}

export interface IntelligenceTheme {
  label: string;
  articles: IntelligenceThemeArticle[];
}

export interface IntelligenceSource {
  index: number;
  title: string;
  url: string;
  source: string;
  date: string;
  score: number | null;
}

export interface IntelligenceReport {
  status: 'ready' | 'empty' | 'unavailable';
  title: string;
  generatedAt: string | null;
  reportPath: string | null;
  message: string;
  stats: {
    articlesRetrieved: number;
    dbTotal: number;
    sourceCount: number;
    themeCount: number;
  };
  overview: {
    summary: string;
    topStories: IntelligenceStory[];
  };
  keyInsights: IntelligenceInsight[];
  themes: IntelligenceTheme[];
  threats: string[];
  prevention: string[];
  sources: IntelligenceSource[];
}

async function parseJsonResponse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (body && typeof body === 'object' && 'status' in body) {
      return body as T;
    }

    const errorBody = body as { error?: string };
    throw new Error(errorBody.error ?? `Server error: ${res.status}`);
  }

  return body as T;
}

// ─── Detect ───────────────────────────────────────────────────────────────────

export async function detectAudio(file: File, mode: string = 'Single Upload'): Promise<DetectionResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("mode", mode);

  const res = await fetch(buildApiUrl('/api/detect'), {
    method: "POST",
    body: form,
  });

  const data = await parseJsonResponse<any>(res);
  // The backend returns { status: "success", detection: {...}, explainability: {...} }
  // We need to return it as a DetectionResult
  if (data.detection) {
      return {
          ...data.detection,
          explainability: data.explainability
      } as DetectionResult;
  }
  
  // Fallback if the backend directly returns the detection result
  return data as DetectionResult;
}

// ─── Enhance ──────────────────────────────────────────────────────────────────

export interface EnhanceParams {
  quality: number;        // 0-100
  denoiseStrength: number; // 0-100
  epochs: number;
  learningRate: number;   // 0-100
}

export async function enhanceAudio(
  file: File,
  params: EnhanceParams
): Promise<EnhancementResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("quality", String(params.quality));
  form.append("denoiseStrength", String(params.denoiseStrength));
  form.append("epochs", String(params.epochs));
  form.append("learningRate", String(params.learningRate));

  const res = await fetch(buildApiUrl('/api/enhance'), {
    method: "POST",
    body: form,
  });

  return parseJsonResponse<EnhancementResult>(res);
}

export async function getIntelligenceReport(options: {
  refresh?: boolean;
  mode?: IntelligenceRunMode;
} = {}): Promise<IntelligenceReport> {
  const params = new URLSearchParams();

  if (options.refresh) {
    params.set('refresh', 'true');
  }

  if (options.mode) {
    params.set('mode', options.mode);
  }

  const query = params.toString();
  const res = await fetch(buildApiUrl(`/api/intel/report${query ? `?${query}` : ''}`));
  return parseJsonResponse<IntelligenceReport>(res);
}

export async function runIntelligencePipeline(
  mode: IntelligenceRunMode = 'full'
): Promise<IntelligenceReport> {
  const res = await fetch(buildApiUrl('/api/intel/run'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mode }),
  });

  return parseJsonResponse<IntelligenceReport>(res);
}

// ─── Download enhanced file ───────────────────────────────────────────────────

export function getDownloadUrl(token: string): string {
  return buildApiUrl(`/api/download/${token}`);
}

// ─── Health check ─────────────────────────────────────────────────────────────

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(buildApiUrl('/api/health'));
    return res.ok;
  } catch {
    return false;
  }
}

// ─── History & Analytics ───────────────────────────────────────────────────────

export interface HistorySummary {
  totals: {
    totalAnalyzed: number;
    real: number;
    deepfake: number;
    aiGenerated: number;
    totalAnalyzedInRange: number;
    realInRange: number;
    deepfakeInRange: number;
    aiGeneratedInRange: number;
    filesEnhanced: number;
    filesEnhancedInRange: number;
    awarenessArticlesCompleted: number;
    awarenessArticlesCompletedInRange: number;
    averageConfidence: number;
  };
  safetyScore: {
    value: number;
    max: number;
    label: string;
    deltaPercent: number;
    sparkline: { v: number }[];
  };
  threatPrevention: {
    blocked: number;
    blockedInRange: number;
    sparkline: { v: number }[];
  };
  enhancement: {
    count: number;
    coveragePercent: number;
  };
  upgrades: { name: string; value: number }[];
  trend: { label: string; real: number; deepfake: number; ai: number }[];
  activityLog: {
    source: string;
    classification: string;
    status: string;
    action: string;
    confidence: string;
    timestamp: string;
  }[];
  rangeDays: number;
}

export async function getHistorySummary(rangeDays: number = 30): Promise<HistorySummary> {
  const res = await fetch(buildApiUrl(`/api/history/summary?range_days=${rangeDays}`));
  return parseJsonResponse<HistorySummary>(res);
}

export async function toggleArticleCompletion(
  url: string,
  title: string,
  source: string,
  completed: boolean
): Promise<boolean> {
  const res = await fetch(buildApiUrl('/api/history/article-completion'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ article_url: url, article_title: title, source, completed }),
  });
  const data = await parseJsonResponse<{ success: boolean; completed: boolean }>(res);
  return data.completed;
}

export async function getCompletedArticleUrls(): Promise<string[]> {
  const res = await fetch(buildApiUrl('/api/history/completed-articles'));
  return parseJsonResponse<string[]>(res);
}

// ─── History & Analytics ──────────────────────────────────────────────────────

export type ActivityStatus = 'authentic' | 'deepfake' | 'suspicious' | 'enhanced' | 'awareness';

export interface ActivityLogRow {
  source: string;
  classification: string;
  status: ActivityStatus;
  action: string;
  confidence: string;
  timestamp: string;
}

export interface AnalyticsSparklinePoint {
  v: number;
}

export interface AnalyticsTrendPoint {
  label: string;
  real: number;
  deepfake: number;
  ai: number;
}

export interface AnalyticsUpgrade {
  name: string;
  value: number;
}

export interface AnalyticsSummary {
  totals: {
    totalAnalyzed: number;
    real: number;
    deepfake: number;
    aiGenerated: number;
    totalAnalyzedInRange: number;
    realInRange: number;
    deepfakeInRange: number;
    aiGeneratedInRange: number;
    filesEnhanced: number;
    filesEnhancedInRange: number;
    awarenessArticlesCompleted: number;
    awarenessArticlesCompletedInRange: number;
    awarenessLinksOpened: number;
    awarenessLinksOpenedInRange: number;
    averageConfidence: number;
  };
  safetyScore: {
    value: number;
    max: number;
    label: string;
    deltaPercent: number;
    sparkline: AnalyticsSparklinePoint[];
  };
  threatPrevention: {
    blocked: number;
    blockedInRange: number;
    sparkline: AnalyticsSparklinePoint[];
  };
  enhancement: {
    count: number;
    coveragePercent: number;
  };
  upgrades: AnalyticsUpgrade[];
  trend: AnalyticsTrendPoint[];
  activityLog: ActivityLogRow[];
  rangeDays: number;
}

export async function getAnalyticsSummary(rangeDays: number = 30): Promise<AnalyticsSummary> {
  const res = await fetch(buildApiUrl(`/api/analytics/summary?range=${rangeDays}`));
  return parseJsonResponse<AnalyticsSummary>(res);
}

// ─── Awareness article completion ─────────────────────────────────────────────

export interface CompletedArticle {
  article_url: string;
  article_title: string;
  source: string;
  completed_at: string;
}

export async function setArticleCompletion(
  articleUrl: string,
  articleTitle: string,
  source: string,
  completed: boolean
): Promise<{ articleUrl: string; completed: boolean }> {
  const res = await fetch(buildApiUrl('/api/awareness/complete'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ articleUrl, articleTitle, source, completed }),
  });
  return parseJsonResponse(res);
}

export async function getCompletedArticles(): Promise<{ count: number; articles: CompletedArticle[] }> {
  const res = await fetch(buildApiUrl('/api/awareness/completed'));
  return parseJsonResponse(res);
}

/**
 * Logs that the user opened an Aware & Sincere article/source link.
 * Fire-and-forget: never blocks or breaks the outbound navigation.
 */
export function logArticleOpened(articleUrl: string, articleTitle: string, source: string): void {
  try {
    fetch(buildApiUrl('/api/awareness/open'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleUrl, articleTitle, source }),
      keepalive: true,
    }).catch(() => {
      /* non-critical: ignore network errors so link-opening is never blocked */
    });
  } catch {
    /* no-op */
  }
}