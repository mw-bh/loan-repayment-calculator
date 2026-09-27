/**
 * The single place errors leave the app for logging. Swap the body for
 * Sentry, Datadog, etc. in production; callers don't need to change.
 */
export function reportError(
  error: unknown,
  context: Record<string, unknown> = {},
): void {
  console.error(error, context);
}
