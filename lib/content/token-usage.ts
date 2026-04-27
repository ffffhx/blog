import fs from "node:fs";
import path from "node:path";

export type TokenUsagePeriodKey = "today" | "week" | "month";

export type TokenUsagePeriod = {
  startAt: string;
  totalTokens: number;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  reasoningOutputTokens: number;
  events: number;
};

export type TokenUsageSnapshot = {
  schemaVersion: number;
  updatedAt: string;
  timezone: string;
  source: string;
  filesScanned: number;
  periods: Record<TokenUsagePeriodKey, TokenUsagePeriod>;
};

const EMPTY_PERIOD: TokenUsagePeriod = {
  startAt: new Date(0).toISOString(),
  totalTokens: 0,
  inputTokens: 0,
  cachedInputTokens: 0,
  outputTokens: 0,
  reasoningOutputTokens: 0,
  events: 0,
};

export const EMPTY_TOKEN_USAGE_SNAPSHOT: TokenUsageSnapshot = {
  schemaVersion: 1,
  updatedAt: new Date(0).toISOString(),
  timezone: "Asia/Shanghai",
  source: "empty",
  filesScanned: 0,
  periods: {
    today: EMPTY_PERIOD,
    week: EMPTY_PERIOD,
    month: EMPTY_PERIOD,
  },
};

export function getTokenUsageSnapshot() {
  const filePath = path.join(process.cwd(), "public", "stats", "token-usage.json");

  try {
    const content = fs.readFileSync(filePath, "utf8");
    return normalizeTokenUsageSnapshot(JSON.parse(content));
  } catch {
    return EMPTY_TOKEN_USAGE_SNAPSHOT;
  }
}

function normalizeTokenUsageSnapshot(value: unknown): TokenUsageSnapshot {
  if (!value || typeof value !== "object") {
    return EMPTY_TOKEN_USAGE_SNAPSHOT;
  }

  const snapshot = value as Partial<TokenUsageSnapshot>;
  const schemaVersion = toFiniteNumber(snapshot.schemaVersion);

  return {
    schemaVersion: schemaVersion > 0 ? schemaVersion : 1,
    updatedAt: typeof snapshot.updatedAt === "string" ? snapshot.updatedAt : new Date(0).toISOString(),
    timezone: typeof snapshot.timezone === "string" ? snapshot.timezone : "Asia/Shanghai",
    source: typeof snapshot.source === "string" ? snapshot.source : "unknown",
    filesScanned: toFiniteNumber(snapshot.filesScanned),
    periods: {
      today: normalizePeriod(snapshot.periods?.today),
      week: normalizePeriod(snapshot.periods?.week),
      month: normalizePeriod(snapshot.periods?.month),
    },
  };
}

function normalizePeriod(value: unknown): TokenUsagePeriod {
  if (!value || typeof value !== "object") {
    return EMPTY_PERIOD;
  }

  const period = value as Partial<TokenUsagePeriod>;

  return {
    startAt: typeof period.startAt === "string" ? period.startAt : new Date(0).toISOString(),
    totalTokens: toFiniteNumber(period.totalTokens),
    inputTokens: toFiniteNumber(period.inputTokens),
    cachedInputTokens: toFiniteNumber(period.cachedInputTokens),
    outputTokens: toFiniteNumber(period.outputTokens),
    reasoningOutputTokens: toFiniteNumber(period.reasoningOutputTokens),
    events: toFiniteNumber(period.events),
  };
}

function toFiniteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
