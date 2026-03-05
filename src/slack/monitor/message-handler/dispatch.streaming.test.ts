import { describe, expect, it } from "vitest";
import { SlackChannelSchema } from "../../../config/zod-schema.providers-core.js";
import { resolveSlackStreamingConfig } from "../../stream-mode.js";
import { isSlackStreamingEnabled, resolveSlackStreamingThreadHint } from "./dispatch.js";

describe("slack native streaming defaults", () => {
  it("is enabled for partial mode when native streaming is on", () => {
    expect(isSlackStreamingEnabled({ mode: "partial", nativeStreaming: true })).toBe(true);
  });

  it("is disabled outside partial mode or when native streaming is off", () => {
    expect(isSlackStreamingEnabled({ mode: "partial", nativeStreaming: false })).toBe(false);
    expect(isSlackStreamingEnabled({ mode: "block", nativeStreaming: true })).toBe(false);
    expect(isSlackStreamingEnabled({ mode: "progress", nativeStreaming: true })).toBe(false);
    expect(isSlackStreamingEnabled({ mode: "off", nativeStreaming: true })).toBe(false);
  });
});

describe("slack native streaming thread hint", () => {
  it("stays off-thread when replyToMode=off and message is not in a thread", () => {
    expect(
      resolveSlackStreamingThreadHint({
        replyToMode: "off",
        incomingThreadTs: undefined,
        messageTs: "1000.1",
      }),
    ).toBeUndefined();
  });

  it("uses first-reply thread when replyToMode=first", () => {
    expect(
      resolveSlackStreamingThreadHint({
        replyToMode: "first",
        incomingThreadTs: undefined,
        messageTs: "1000.2",
      }),
    ).toBe("1000.2");
  });

  it("uses the existing incoming thread regardless of replyToMode", () => {
    expect(
      resolveSlackStreamingThreadHint({
        replyToMode: "off",
        incomingThreadTs: "2000.1",
        messageTs: "1000.3",
      }),
    ).toBe("2000.1");
  });
});

describe("per-channel streaming override", () => {
  it("channel streaming:'off' overrides account streaming:'partial'", () => {
    const channelStreaming = "off" as const;
    const accountStreaming = "partial" as const;
    const result = resolveSlackStreamingConfig({
      streaming: channelStreaming ?? accountStreaming,
    });
    expect(result.mode).toBe("off");
  });

  it("channel nativeStreaming:false overrides account nativeStreaming:true", () => {
    const channelNative = false;
    const accountNative = true;
    const result = resolveSlackStreamingConfig({
      nativeStreaming: channelNative ?? accountNative,
    });
    expect(result.nativeStreaming).toBe(false);
  });

  it("null channelConfig falls back to account-level values", () => {
    const channelConfig = null;
    const result = resolveSlackStreamingConfig({
      streaming: channelConfig?.streaming ?? "partial",
      nativeStreaming: channelConfig?.nativeStreaming ?? true,
    });
    expect(result.mode).toBe("partial");
    expect(result.nativeStreaming).toBe(true);
  });

  it("channelConfig without streaming fields falls back to account values", () => {
    const channelConfig: {
      allowed: boolean;
      requireMention: boolean;
      streaming?: unknown;
      nativeStreaming?: boolean;
    } = { allowed: true, requireMention: false };
    const result = resolveSlackStreamingConfig({
      streaming: channelConfig.streaming ?? "partial",
      nativeStreaming: channelConfig.nativeStreaming ?? true,
    });
    expect(result.mode).toBe("partial");
    expect(result.nativeStreaming).toBe(true);
  });

  it("channel streaming:false disables streaming even when account has 'partial'", () => {
    const channelStreaming: boolean | string = false;
    const result = resolveSlackStreamingConfig({
      streaming: channelStreaming ?? "partial",
    });
    expect(result.mode).toBe("off");
  });

  it("isSlackStreamingEnabled reflects per-channel override", () => {
    const resolved = resolveSlackStreamingConfig({ streaming: "off" });
    expect(
      isSlackStreamingEnabled({
        mode: resolved.mode,
        nativeStreaming: resolved.nativeStreaming,
      }),
    ).toBe(false);
  });
});

describe("SlackChannelSchema streaming fields", () => {
  it("accepts streaming enum values", () => {
    expect(SlackChannelSchema.safeParse({ streaming: "off" }).success).toBe(true);
    expect(SlackChannelSchema.safeParse({ streaming: "partial" }).success).toBe(true);
    expect(SlackChannelSchema.safeParse({ streaming: false }).success).toBe(true);
  });

  it("accepts nativeStreaming boolean", () => {
    expect(SlackChannelSchema.safeParse({ nativeStreaming: true }).success).toBe(true);
    expect(SlackChannelSchema.safeParse({ nativeStreaming: false }).success).toBe(true);
  });

  it("rejects invalid streaming values", () => {
    expect(SlackChannelSchema.safeParse({ streaming: "invalid" }).success).toBe(false);
    expect(SlackChannelSchema.safeParse({ nativeStreaming: "yes" }).success).toBe(false);
  });
});
