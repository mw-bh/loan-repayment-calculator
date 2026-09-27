/**
 * What went wrong, as a machine-readable value for logging and branching.
 * Messages are for humans; `kind` is what code (and dashboards) should use.
 */
export type ExchangeRateErrorKind =
  /** fetch rejected: offline, DNS failure, CORS, etc. */
  | 'network'
  /** No response within the timeout; we aborted the request. */
  | 'timeout'
  /** The server responded with a non-2xx status (see `status`). */
  | 'http'
  /** The body wasn't valid JSON. */
  | 'invalid-json'
  /** Valid JSON, but the wrong shape or missing/invalid rates. */
  | 'invalid-data'
  /** Anything else — most likely a bug on our side. */
  | 'unknown';

interface ExchangeRateErrorDetails {
  /** HTTP status, for `http` errors. */
  status?: number;
  /** The underlying error, kept for debugging (standard `Error.cause`). */
  cause?: unknown;
}

export class ExchangeRateError extends Error {
  readonly kind: ExchangeRateErrorKind;
  readonly status?: number;

  constructor(
    kind: ExchangeRateErrorKind,
    message: string,
    details: ExchangeRateErrorDetails = {},
  ) {
    super(message, { cause: details.cause });
    this.name = 'ExchangeRateError';
    this.kind = kind;
    this.status = details.status;
  }
}
