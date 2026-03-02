import { escapeRegExp } from "../utils.js";

export const HEARTBEAT_TOKEN = "HEARTBEAT_OK";
export const SILENT_REPLY_TOKEN = "NO_REPLY";

export function isSilentReplyText(
  text: string | undefined,
  token: string = SILENT_REPLY_TOKEN,
): boolean {
  if (!text) {
    return false;
  }
  const escaped = escapeRegExp(token);
  // Match only the exact silent token with optional surrounding whitespace.
  // This prevents
  // substantive replies ending with NO_REPLY from being suppressed (#19537).
  return new RegExp(`^\\s*${escaped}\\s*$`).test(text);
}

export function isSilentReplyPrefixText(
  text: string | undefined,
  token: string = SILENT_REPLY_TOKEN,
): boolean {
  if (!text) {
    return false;
  }
  const normalized = text.trimStart().toUpperCase();
  if (!normalized) {
    return false;
  }
  if (!normalized.includes("_")) {
    return false;
  }
  if (/[^A-Z_]/.test(normalized)) {
    return false;
  }
  return token.toUpperCase().startsWith(normalized);
}

/** Check whether text (or a streaming prefix) matches any silent reply token (NO_REPLY or HEARTBEAT_OK). */
export function isAnySilentStreamingText(text: string | undefined): boolean {
  if (!text) {
    return false;
  }
  return (
    isSilentReplyText(text) ||
    isSilentReplyPrefixText(text) ||
    isSilentReplyText(text, HEARTBEAT_TOKEN) ||
    isSilentReplyPrefixText(text, HEARTBEAT_TOKEN)
  );
}
