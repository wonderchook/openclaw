import { describe, expect, it } from "vitest";
import { resolveSlackChannelConfig } from "./channel-config.js";

describe("resolveSlackChannelConfig streaming fields", () => {
  it("returns streaming fields from exact channel match", () => {
    const result = resolveSlackChannelConfig({
      channelId: "C123",
      channels: {
        C123: { allow: true, streaming: "off", nativeStreaming: false },
      },
    });
    expect(result?.streaming).toBe("off");
    expect(result?.nativeStreaming).toBe(false);
  });

  it("uses wildcard streaming as fallback when channel has no override", () => {
    const result = resolveSlackChannelConfig({
      channelId: "C456",
      channels: {
        "*": { allow: true, streaming: "off" },
      },
    });
    expect(result?.streaming).toBe("off");
  });

  it("channel-specific streaming overrides wildcard", () => {
    const result = resolveSlackChannelConfig({
      channelId: "C123",
      channels: {
        C123: { allow: true, streaming: "partial" },
        "*": { allow: true, streaming: "off" },
      },
    });
    expect(result?.streaming).toBe("partial");
  });

  it("returns undefined streaming when not set in channel config", () => {
    const result = resolveSlackChannelConfig({
      channelId: "C123",
      channels: {
        C123: { allow: true },
      },
    });
    expect(result?.streaming).toBeUndefined();
    expect(result?.nativeStreaming).toBeUndefined();
  });
});
