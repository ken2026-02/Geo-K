import { getValue, setValue } from "../../data/idb/storage";

export interface PerformanceMetric {
  id: string;
  metricType: "import" | "chunk" | "image_processing" | "commit" | "search" | "backup" | "restore";
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  details?: Record<string, string | number>;
}

const PERFORMANCE_METRICS_KEY = "ekv:performance-metrics";
const MAX_METRICS = 50;

function nowIso(): string {
  return new Date().toISOString();
}

function createId(metricType: PerformanceMetric["metricType"]): string {
  return `${metricType}-${nowIso()}-${Math.random().toString(16).slice(2, 8)}`;
}

export class PerformanceMetricsService {
  start(metricType: PerformanceMetric["metricType"], details?: PerformanceMetric["details"]): PerformanceMetric {
    return {
      id: createId(metricType),
      metricType,
      startedAt: nowIso(),
      details
    };
  }

  finish(metric: PerformanceMetric, details?: PerformanceMetric["details"]): PerformanceMetric {
    const finishedAt = nowIso();
    return {
      ...metric,
      finishedAt,
      durationMs: new Date(finishedAt).getTime() - new Date(metric.startedAt).getTime(),
      details: details ? { ...(metric.details ?? {}), ...details } : metric.details
    };
  }

  async record(metric: PerformanceMetric): Promise<void> {
    const existing = await this.listRecent();
    await setValue(PERFORMANCE_METRICS_KEY, [metric, ...existing].slice(0, MAX_METRICS));
  }

  async listRecent(): Promise<PerformanceMetric[]> {
    return (await getValue<PerformanceMetric[]>(PERFORMANCE_METRICS_KEY)) ?? [];
  }

  async measure<T>(metricType: PerformanceMetric["metricType"], details: PerformanceMetric["details"] | undefined, action: () => Promise<T>): Promise<T> {
    const metric = this.start(metricType, details);
    try {
      const result = await action();
      await this.record(this.finish(metric));
      return result;
    } catch (error) {
      await this.record(this.finish(metric, { status: "failed" }));
      throw error;
    }
  }
}
