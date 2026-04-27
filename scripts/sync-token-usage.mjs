import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";

const TIMEZONE = "Asia/Shanghai";
const TIMEZONE_OFFSET_MS = 8 * 60 * 60 * 1000;
const CODEX_HOME = process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
const OUTPUT_FILE = path.join(process.cwd(), "public", "stats", "token-usage.json");

function getShanghaiParts(date) {
  const shifted = new Date(date.getTime() + TIMEZONE_OFFSET_MS);

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    date: shifted.getUTCDate(),
    day: shifted.getUTCDay(),
  };
}

function fromShanghaiStartOfDay({ year, month, date }) {
  return new Date(Date.UTC(year, month, date) - TIMEZONE_OFFSET_MS);
}

function getPeriodStarts(now) {
  const parts = getShanghaiParts(now);
  const today = fromShanghaiStartOfDay(parts);
  const daysSinceMonday = (parts.day + 6) % 7;
  const week = new Date(today.getTime() - daysSinceMonday * 24 * 60 * 60 * 1000);
  const month = fromShanghaiStartOfDay({ ...parts, date: 1 });

  return { today, week, month };
}

function createBucket(startAt) {
  return {
    startAt: startAt.toISOString(),
    totalTokens: 0,
    inputTokens: 0,
    cachedInputTokens: 0,
    outputTokens: 0,
    reasoningOutputTokens: 0,
    events: 0,
  };
}

function addUsage(bucket, usage) {
  const inputTokens = toNumber(usage.input_tokens);
  const cachedInputTokens = toNumber(usage.cached_input_tokens);
  const outputTokens = toNumber(usage.output_tokens);
  const reasoningOutputTokens = toNumber(usage.reasoning_output_tokens);
  const explicitTotal = toNumber(usage.total_tokens);
  const totalTokens =
    explicitTotal ||
    inputTokens + cachedInputTokens + outputTokens + reasoningOutputTokens;

  bucket.totalTokens += totalTokens;
  bucket.inputTokens += inputTokens;
  bucket.cachedInputTokens += cachedInputTokens;
  bucket.outputTokens += outputTokens;
  bucket.reasoningOutputTokens += reasoningOutputTokens;
  bucket.events += 1;
}

function toNumber(value) {
  return Number.isFinite(value) ? value : 0;
}

async function collectJsonlFiles(root) {
  const filesByName = new Map();
  const roots = [
    path.join(root, "sessions"),
    path.join(root, "archived_sessions"),
  ];

  for (const currentRoot of roots) {
    await walk(currentRoot, (file) => {
      if (file.endsWith(".jsonl")) {
        filesByName.set(path.basename(file), file);
      }
    });
  }

  return [...filesByName.values()].sort();
}

async function walk(dir, onFile) {
  let entries;

  try {
    entries = await fs.promises.readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return;
    }

    throw error;
  }

  await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath, onFile);
        return;
      }

      if (entry.isFile()) {
        onFile(fullPath);
      }
    })
  );
}

async function readUsageEvents(file, onEvent) {
  const stream = fs.createReadStream(file, { encoding: "utf8" });
  const lines = readline.createInterface({
    input: stream,
    crlfDelay: Infinity,
  });

  for await (const line of lines) {
    if (!line.includes("\"token_count\"")) {
      continue;
    }

    let entry;

    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }

    const usage = entry?.payload?.info?.last_token_usage;
    const timestamp = Date.parse(entry?.timestamp);

    if (
      entry?.type !== "event_msg" ||
      entry?.payload?.type !== "token_count" ||
      !Number.isFinite(timestamp) ||
      !usage
    ) {
      continue;
    }

    onEvent(new Date(timestamp), usage);
  }
}

async function main() {
  const now = new Date();
  const starts = getPeriodStarts(now);
  const periods = {
    today: createBucket(starts.today),
    week: createBucket(starts.week),
    month: createBucket(starts.month),
  };
  const files = await collectJsonlFiles(CODEX_HOME);

  if (files.length === 0 && fs.existsSync(OUTPUT_FILE)) {
    console.log(`No Codex session logs found under ${CODEX_HOME}; kept existing token usage file.`);
    return;
  }

  const oldestStart = starts.month.getTime();
  const nowWithSkew = now.getTime() + 5 * 60 * 1000;

  for (const file of files) {
    await readUsageEvents(file, (timestamp, usage) => {
      const time = timestamp.getTime();

      if (time < oldestStart || time > nowWithSkew) {
        return;
      }

      if (time >= starts.today.getTime()) {
        addUsage(periods.today, usage);
      }

      if (time >= starts.week.getTime()) {
        addUsage(periods.week, usage);
      }

      addUsage(periods.month, usage);
    });
  }

  const snapshot = {
    schemaVersion: 1,
    updatedAt: now.toISOString(),
    timezone: TIMEZONE,
    source: "local-codex-jsonl",
    filesScanned: files.length,
    periods,
  };

  await fs.promises.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await fs.promises.writeFile(OUTPUT_FILE, `${JSON.stringify(snapshot, null, 2)}\n`);

  console.log(
    `Synced token usage: today=${periods.today.totalTokens}, week=${periods.week.totalTokens}, month=${periods.month.totalTokens}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
