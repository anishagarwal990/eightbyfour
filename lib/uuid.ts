const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Postgres throws `22P02 invalid input syntax for type uuid` on a malformed
 * uuid rather than returning no rows, so `.eq("id", <garbage>)` surfaces as an
 * unhandled 500. Guard route params with this and return notFound() instead.
 */
export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}
