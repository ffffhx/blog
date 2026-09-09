import { describe, expect, it } from "vitest";
import { snapshotRedirectUrl } from "../../components/snapshot-redirect";

describe("legacy snapshot redirects", () => {
  it("preserves legacy IDs without forwarding credentials or an arbitrary API host", () => {
    expect(snapshotRedirectUrl("https://ffffhx.github.io/garden-lab/snapshots/share/?id=snap_A-b&garden_token=secret&api=https://untrusted.invalid#token=secret", true))
      .toBe("https://ffffhx.github.io/agent-snapshots/share/?id=snap_A-b");
  });
  it("sends missing IDs and retired viewer routes to the independent site", () => {
    expect(snapshotRedirectUrl("https://example.com/snapshots/share/?id=../bad", true)).toBe("https://ffffhx.github.io/agent-snapshots/");
    expect(snapshotRedirectUrl("https://example.com/snapshots/viewer/?url=http://localhost:4321", false)).toBe("https://ffffhx.github.io/agent-snapshots/");
  });
  it("supports a configured independent site", () => {
    expect(snapshotRedirectUrl("https://example.com/?id=abc", true, "https://example.org/sessions"))
      .toBe("https://example.org/sessions/share/?id=abc");
  });
});
