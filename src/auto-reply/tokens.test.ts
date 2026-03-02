import { describe, it, expect } from "vitest";
import { isAnySilentStreamingText, isSilentReplyPrefixText, isSilentReplyText } from "./tokens.js";

describe("isSilentReplyText", () => {
  it("returns true for exact token", () => {
    expect(isSilentReplyText("NO_REPLY")).toBe(true);
  });

  it("returns true for token with surrounding whitespace", () => {
    expect(isSilentReplyText("  NO_REPLY  ")).toBe(true);
    expect(isSilentReplyText("\nNO_REPLY\n")).toBe(true);
  });

  it("returns false for undefined/empty", () => {
    expect(isSilentReplyText(undefined)).toBe(false);
    expect(isSilentReplyText("")).toBe(false);
  });

  it("returns false for substantive text ending with token (#19537)", () => {
    const text = "Here is a helpful response.\n\nNO_REPLY";
    expect(isSilentReplyText(text)).toBe(false);
  });

  it("returns false for substantive text starting with token", () => {
    const text = "NO_REPLY but here is more content";
    expect(isSilentReplyText(text)).toBe(false);
  });

  it("returns false for token embedded in text", () => {
    expect(isSilentReplyText("Please NO_REPLY to this")).toBe(false);
  });

  it("works with custom token", () => {
    expect(isSilentReplyText("HEARTBEAT_OK", "HEARTBEAT_OK")).toBe(true);
    expect(isSilentReplyText("Checked inbox. HEARTBEAT_OK", "HEARTBEAT_OK")).toBe(false);
  });
});

describe("isSilentReplyPrefixText", () => {
  it("matches uppercase underscore prefixes", () => {
    expect(isSilentReplyPrefixText("NO_")).toBe(true);
    expect(isSilentReplyPrefixText("NO_RE")).toBe(true);
    expect(isSilentReplyPrefixText("NO_REPLY")).toBe(true);
    expect(isSilentReplyPrefixText("  HEARTBEAT_", "HEARTBEAT_OK")).toBe(true);
  });

  it("rejects ambiguous natural-language prefixes", () => {
    expect(isSilentReplyPrefixText("N")).toBe(false);
    expect(isSilentReplyPrefixText("No")).toBe(false);
    expect(isSilentReplyPrefixText("Hello")).toBe(false);
  });

  it("rejects non-prefixes and mixed characters", () => {
    expect(isSilentReplyPrefixText("NO_X")).toBe(false);
    expect(isSilentReplyPrefixText("NO_REPLY more")).toBe(false);
    expect(isSilentReplyPrefixText("NO-")).toBe(false);
  });
});

describe("isAnySilentStreamingText", () => {
  it("catches NO_REPLY exact and underscore-containing prefixes", () => {
    expect(isAnySilentStreamingText("NO_REPLY")).toBe(true);
    expect(isAnySilentStreamingText("NO_")).toBe(true);
    expect(isAnySilentStreamingText("NO_RE")).toBe(true);
    expect(isAnySilentStreamingText("  NO_REPLY  ")).toBe(true);
  });

  it("catches HEARTBEAT_OK exact and underscore-containing prefixes", () => {
    expect(isAnySilentStreamingText("HEARTBEAT_OK")).toBe(true);
    expect(isAnySilentStreamingText("HEARTBEAT_")).toBe(true);
    expect(isAnySilentStreamingText("HEARTBEAT_O")).toBe(true);
    expect(isAnySilentStreamingText("  HEARTBEAT_OK  ")).toBe(true);
  });

  it("returns false for real content", () => {
    expect(isAnySilentStreamingText("Hello")).toBe(false);
    expect(isAnySilentStreamingText("Here is my answer")).toBe(false);
    expect(isAnySilentStreamingText("HEARTBEAT_OK but more text")).toBe(false);
  });

  it("returns false for undefined/empty", () => {
    expect(isAnySilentStreamingText(undefined)).toBe(false);
    expect(isAnySilentStreamingText("")).toBe(false);
  });
});
