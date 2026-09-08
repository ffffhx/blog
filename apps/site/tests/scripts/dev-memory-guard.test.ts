import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { describe, expect, it, vi } from "vitest";

const source = fs.readFileSync(path.resolve("scripts/dev-memory-guard.cjs"), "utf8");

function createGuard(mainThread = true) {
  let tick = () => {};
  const memory = { rss: 100, heapTotal: 50, external: 20 };
  const exit = vi.fn();
  const appendFileSync = vi.fn();
  const disk = {
    mkdirSync: vi.fn(), existsSync: () => false, appendFileSync,
  };
  const timer = vi.fn((callback: () => void) => {
    tick = callback;
    return { unref: vi.fn() };
  });
  vm.runInNewContext(source, {
    require: (id: string) => ({
      "node:fs": disk, "node:path": path,
      "node:v8": { getHeapStatistics: () => ({ heap_size_limit: 1536 * 1024 ** 2 }) },
      "node:worker_threads": { isMainThread: mainThread },
    } as Record<string, unknown>)[id],
    __dirname: path.resolve("scripts"),
    process: { pid: 123, memoryUsage: () => memory, exit },
    console: { error: vi.fn() }, setInterval: timer,
  });
  return { tick: () => tick(), memory, exit, appendFileSync, timer };
}

describe("development memory guard", () => {
  it("stops sustained Buffer growth even when RSS is low", () => {
    const guard = createGuard();
    guard.memory.external = 4 * 1024 ** 3;
    guard.tick(); guard.tick();
    expect(guard.exit).not.toHaveBeenCalled();
    guard.tick();
    expect(guard.exit).toHaveBeenCalledWith(86);
    expect(JSON.parse(guard.appendFileSync.mock.calls[2][1]).overLimitSamples).toBe(3);
  });

  it("allows transient compilation peaks and resets after recovery", () => {
    const guard = createGuard();
    guard.memory.rss = 4 * 1024 ** 3;
    guard.tick(); guard.tick();
    guard.memory.rss = 100;
    guard.tick();
    guard.memory.rss = 4 * 1024 ** 3;
    guard.tick(); guard.tick();
    expect(guard.exit).not.toHaveBeenCalled();
  });

  it("does not install a duplicate monitor inside worker threads", () => {
    const guard = createGuard(false);
    expect(guard.timer).not.toHaveBeenCalled();
  });
});
