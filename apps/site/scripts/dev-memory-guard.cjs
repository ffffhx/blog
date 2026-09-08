const fs = require("node:fs");
const path = require("node:path");
const v8 = require("node:v8");
const { isMainThread } = require("node:worker_threads");

// Loaded by NODE_OPTIONS in the dev server and its child processes. Worker
// threads share RSS; only sample once per process. Never loaded in production.
if (isMainThread) {
  const directory = path.resolve(__dirname, "../tmp/dev-memory");
  const file = path.join(directory, `${process.pid}.jsonl`);
  const limit = 3 * 1024 ** 3;
  let overLimitSamples = 0;
  let warned = false;
  const timer = setInterval(() => {
    const memory = process.memoryUsage();
    // Heap caps don't cover Buffers/native allocations. This is a sampled
    // guard, not an OS commit limit: include external memory as well as RSS.
    const overLimit = Math.max(memory.rss, memory.heapTotal + memory.external) > limit;
    overLimitSamples = overLimit ? overLimitSamples + 1 : 0;
    const sample = {
      time: new Date().toISOString(), pid: process.pid, ...memory,
      heapLimit: v8.getHeapStatistics().heap_size_limit,
      overLimitSamples,
    };
    try {
      fs.mkdirSync(directory, { recursive: true });
      // Keep only two bounded logs per process; never record environment or
      // page contents. The samples can distinguish heap/Buffer/RSS growth.
      if (fs.existsSync(file) && fs.statSync(file).size > 1024 ** 2) {
        fs.copyFileSync(file, `${file}.previous`);
        fs.truncateSync(file);
      }
      fs.appendFileSync(file, `${JSON.stringify(sample)}\n`);
    } catch (error) {
      if (!warned) console.error("[dev-memory] Cannot write diagnostics:", error.message);
      warned = true;
    }
    if (overLimitSamples >= 3) {
      console.error(`[dev-memory] Memory exceeded 3 GiB in three consecutive samples; stopping PID ${process.pid}. Diagnostics: ${file}`);
      process.exit(86);
    }
  }, 10_000);
  timer.unref();
}
