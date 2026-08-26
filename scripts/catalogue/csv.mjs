// RFC 4180 CSV, hand-rolled — the catalogue has product descriptions with
// embedded commas, apostrophes and newlines, and shade names with quotes, so
// a naive split(",") round-trip would silently corrupt rows. Everything here
// is built around one guarantee: parse(stringify(rows)) === rows.

/**
 * Quote a field only when it needs it, so hand-edited files stay readable.
 *
 * Leading/trailing whitespace forces quoting too: the parser trims unquoted
 * fields (hand-edited files pick up stray spaces around values), so a real
 * trailing space would not survive the round-trip unless it is quoted here.
 */
function quote(value) {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/.test(s) || s !== s.trim() ? `"${s.replace(/"/g, '""')}"` : s;
}

export function stringify(headers, rows) {
  const lines = [headers.map(quote).join(",")];
  for (const row of rows) lines.push(headers.map((h) => quote(row[h])).join(","));
  // Trailing newline: without it, some editors treat the last row as unterminated.
  return lines.join("\r\n") + "\r\n";
}

/**
 * Parse CSV text into an array of objects keyed by the header row.
 *
 * Character-by-character rather than line-by-line, because a quoted field may
 * contain CR, LF or CRLF — splitting on newlines first would tear a
 * description in half and turn one product into two malformed rows.
 */
export function parse(text) {
  // Strip a UTF-8 BOM: Excel writes one on "Save as CSV UTF-8", and left in
  // place it becomes part of the first header name ("﻿slug" !== "slug").
  const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  let fieldWasQuoted = false;
  let i = 0;

  const endField = () => {
    row.push(fieldWasQuoted ? field : field.trim());
    field = "";
    fieldWasQuoted = false;
  };
  const endRow = () => {
    endField();
    // Skip lines that are entirely empty (a stray blank line at EOF, or
    // between blocks in a hand-edited file) rather than emitting a null row.
    if (!(row.length === 1 && row[0] === "")) rows.push(row);
    row = [];
  };

  while (i < input.length) {
    const c = input[i];
    if (inQuotes) {
      if (c === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      fieldWasQuoted = true;
      i++;
      continue;
    }
    if (c === ",") {
      endField();
      i++;
      continue;
    }
    if (c === "\r") {
      endRow();
      if (input[i + 1] === "\n") i++;
      i++;
      continue;
    }
    if (c === "\n") {
      endRow();
      i++;
      continue;
    }
    field += c;
    i++;
  }
  if (inQuotes) throw new Error("Unterminated quoted field — the file has an odd number of double quotes.");
  if (field !== "" || row.length > 0) endRow();

  if (rows.length === 0) return { headers: [], records: [] };
  const headers = rows[0];
  const records = rows.slice(1).map((values, idx) => {
    if (values.length !== headers.length) {
      throw new Error(`Row ${idx + 2} has ${values.length} fields but the header has ${headers.length}. Check for an unquoted comma.`);
    }
    return Object.fromEntries(headers.map((h, j) => [h, values[j]]));
  });
  return { headers, records };
}
