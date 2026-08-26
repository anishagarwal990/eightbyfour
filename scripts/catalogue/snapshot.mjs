import { mkdirSync, writeFileSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import { PROJECT_ROOT } from "./db.mjs";

// Every --apply writes a full copy of the affected rows first. The service
// role key bypasses RLS and there is no undo in PostgREST, so an unattended
// snapshot is the difference between a bad import being a five-minute
// restore and being a rebuild from a stale seed script.
const SNAPSHOT_DIR = join(PROJECT_ROOT, "scripts", "snapshots");

export function writeSnapshot(rows, label) {
  mkdirSync(SNAPSHOT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const path = join(SNAPSHOT_DIR, `${stamp}-${label}.json`);
  writeFileSync(path, JSON.stringify({ takenAt: new Date().toISOString(), label, count: rows.length, rows }, null, 2));
  return path;
}

export function readSnapshot(path) {
  const parsed = JSON.parse(readFileSync(path, "utf8"));
  if (!Array.isArray(parsed.rows)) throw new Error(`${path} is not a catalogue snapshot.`);
  return parsed;
}

export function listSnapshots() {
  try {
    return readdirSync(SNAPSHOT_DIR).filter((f) => f.endsWith(".json")).sort().reverse();
  } catch {
    return [];
  }
}

export { SNAPSHOT_DIR };
