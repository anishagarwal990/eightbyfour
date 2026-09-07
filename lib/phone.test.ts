/** Phone normalisation. Run: node --test lib/phone.test.ts */
import test from "node:test";
import assert from "node:assert/strict";
import { toWhatsAppNumber, whatsAppLink } from "./phone.ts";

const CASES: [string, string | null][] = [
  ["9703739918", "919703739918"],
  ["+919703739918", "919703739918"],
  ["+91 97037 39918", "919703739918"],
  ["919703739918", "919703739918"],
  ["09703739918", "919703739918"],
  ["0091 97037 39918", "919703739918"],
  ["97037-39918", "919703739918"],
  ["  9703739918  ", "919703739918"],
  // refusals
  ["91919703739918", null],   // doubled 91 — must NOT become 9191...
  ["9703739918123", null],    // too long
  ["12345", null],            // too short
  ["1234567890", null],       // 10 digits but not a mobile prefix
  ["04023456789", null],      // landline (starts 4 after trunk 0)
  ["", null],
];

for (const [input, want] of CASES) {
  test(`toWhatsAppNumber(${JSON.stringify(input)}) -> ${want}`, () => {
    assert.equal(toWhatsAppNumber(input), want);
  });
}

test("toWhatsAppNumber(null / undefined) -> null", () => {
  assert.equal(toWhatsAppNumber(null), null);
  assert.equal(toWhatsAppNumber(undefined), null);
});

test("never produces the 91-prepended-twice bug", () => {
  for (const [input] of CASES) {
    const r = toWhatsAppNumber(input);
    if (r) assert.equal(/^91\d{10}$/.test(r), true, `bad shape: ${r}`);
  }
});

test("whatsAppLink builds a wa.me url or null", () => {
  const link = whatsAppLink("9703739918", "Hi there");
  assert.equal(link, "https://wa.me/919703739918?text=Hi%20there");
  assert.equal(whatsAppLink("12345", "x"), null);
});
