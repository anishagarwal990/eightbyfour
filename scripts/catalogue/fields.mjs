// Thin re-export of the shared spec in lib/catalogue/fields.ts. Node strips
// TypeScript types natively, so both the admin UI and this CLI read one
// allowlist — a column added or removed there changes both surfaces at once.
export {
  EDITABLE_FIELDS,
  FIELD_NAMES,
  STRUCTURED_COLUMNS,
  IMMUTABLE_COLUMNS,
  toCell,
  fromCell,
  deepEqual,
} from "../../lib/catalogue/fields.ts";

export { deepEqual as sameValue } from "../../lib/catalogue/fields.ts";

/** Read-only context column: exported so a spreadsheet is navigable, ignored on import. */
export const CONTEXT_FIELDS = ["slug"];
