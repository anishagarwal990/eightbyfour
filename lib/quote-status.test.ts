/** Quote display status. Run: node --test lib/quote-status.test.ts */
import test from "node:test";
import assert from "node:assert/strict";
import { quoteDisplayStatus, type QuoteVersionSummary } from "./quote-status.ts";

const v = (n: number, over: Partial<QuoteVersionSummary> = {}): QuoteVersionSummary => ({
  version_no: n,
  status: "DRAFT",
  frozen_at: null,
  sent_at: null,
  ...over,
});

test("fresh draft, one version", () => {
  const d = quoteDisplayStatus("DRAFT", [v(1)]);
  assert.equal(d.label, "Draft");
  assert.equal(d.tone, "draft");
  assert.equal(d.lastSent, null);
});

test("single READY version, never sent", () => {
  const d = quoteDisplayStatus("READY", [v(1, { status: "READY", frozen_at: "x" })]);
  assert.equal(d.label, "Ready");
  assert.equal(d.tone, "ready");
});

test("current version is the sent one", () => {
  const d = quoteDisplayStatus("SENT", [
    v(1, { status: "DRAFT", frozen_at: "x" }),
    v(2, { status: "READY", frozen_at: "x", sent_at: "2026-09-07T14:10:00Z" }),
  ]);
  assert.equal(d.label, "Sent");
  assert.equal(d.tone, "sent");
  assert.deepEqual(d.lastSent, { versionNo: 2, at: "2026-09-07T14:10:00Z" });
});

test("V2 sent, V3 draft -> Revision draft + last sent V2 (the Q-8UVJJE case)", () => {
  const d = quoteDisplayStatus("DRAFT", [
    v(1, { status: "DRAFT", frozen_at: "x" }),
    v(2, { status: "READY", frozen_at: "x", sent_at: "2026-09-07T14:10:00Z" }),
    v(3, { status: "DRAFT" }),
  ]);
  assert.equal(d.label, "Revision draft");
  assert.equal(d.tone, "revision");
  assert.equal(d.currentVersionNo, 3);
  assert.equal(d.currentVersionLabel, "Draft");
  assert.deepEqual(d.lastSent, { versionNo: 2, at: "2026-09-07T14:10:00Z" });
});

test("V2 sent, V3 ready -> Revision ready", () => {
  const d = quoteDisplayStatus("READY", [
    v(2, { status: "READY", frozen_at: "x", sent_at: "2026-09-07T14:10:00Z" }),
    v(3, { status: "READY", frozen_at: "x" }),
  ]);
  assert.equal(d.label, "Revision ready");
  assert.equal(d.tone, "revision");
  assert.deepEqual(d.lastSent, { versionNo: 2, at: "2026-09-07T14:10:00Z" });
});

test("picks the newest sent version when several were sent", () => {
  const d = quoteDisplayStatus("DRAFT", [
    v(1, { sent_at: "2026-09-01T00:00:00Z" }),
    v(2, { sent_at: "2026-09-05T00:00:00Z" }),
    v(3, { status: "DRAFT" }),
  ]);
  assert.equal(d.lastSent?.versionNo, 2);
});

test("no versions falls back to quote status", () => {
  assert.equal(quoteDisplayStatus("SENT", []).label, "Sent");
});
