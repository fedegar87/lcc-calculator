export type LCCzeroErrorCode =
  | "INVALID_INPUT"
  | "MISSING_DATA"
  | "COMPUTE_TIMEOUT"
  | "NETWORK"
  | "UNKNOWN";

interface LCCzeroErrorInit {
  code: LCCzeroErrorCode;
  message?: string;
  cause?: unknown;
}

export class LCCzeroError extends Error {
  readonly code: LCCzeroErrorCode;

  constructor({ code, message, cause }: LCCzeroErrorInit) {
    super(message ?? defaultMessageFor(code));
    this.name = "LCCzeroError";
    this.code = code;
    if (cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = cause;
    }
  }
}

function defaultMessageFor(code: LCCzeroErrorCode): string {
  switch (code) {
    case "INVALID_INPUT":
      return "Some inputs are invalid or out of range.";
    case "MISSING_DATA":
      return "Required inputs are missing.";
    case "COMPUTE_TIMEOUT":
      return "The calculation took longer than 30 seconds and was aborted.";
    case "NETWORK":
      return "Network request failed. Check your connection and retry.";
    case "UNKNOWN":
    default:
      return "An unexpected error occurred.";
  }
}

export function isLCCzeroError(value: unknown): value is LCCzeroError {
  return value instanceof LCCzeroError;
}

/** Best-effort classification for arbitrary errors thrown during render or
 *  caught from network code. Used by the ErrorBoundary to render a more
 *  specific fallback. */
export function classifyError(value: unknown): LCCzeroErrorCode {
  if (isLCCzeroError(value)) return value.code;
  if (value instanceof Error) {
    const name = value.name?.toLowerCase() ?? "";
    const msg = value.message?.toLowerCase() ?? "";
    if (name === "aborterror" || msg.includes("abort") || msg.includes("timeout")) {
      return "COMPUTE_TIMEOUT";
    }
    if (msg.includes("network") || msg.includes("fetch") || msg.includes("offline")) {
      return "NETWORK";
    }
    if (msg.includes("missing") || msg.includes("required")) {
      return "MISSING_DATA";
    }
    if (msg.includes("invalid") || msg.includes("validation")) {
      return "INVALID_INPUT";
    }
  }
  return "UNKNOWN";
}
