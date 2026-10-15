import assert from "node:assert/strict";
import test from "node:test";
import {
  cleanText,
  clock,
  InputError,
  language,
  makePlan,
  renderPlan,
  seconds,
} from "../dist/plan.js";

const base = {
  title: "Community rehearsal",
  lines: "3:20 | Opening\n4:10 | Finale",
  gap: "30",
  budget: "10",
};
test("two pieces have exactly one transition and integer cumulative seconds", () => {
  const plan = makePlan(base, "en");
  assert.deepEqual(plan.pieces, [
    { title: "Opening", duration: 200, start: 0, end: 200 },
    { title: "Finale", duration: 250, start: 230, end: 480 },
  ]);
  assert.equal(plan.music, 450);
  assert.equal(plan.transitions, 30);
  assert.equal(plan.total, 480);
  assert.equal(plan.budget, 600);
});
test("zero transitions, blank budget and CRLF are accepted", () => {
  const plan = makePlan(
    { ...base, lines: base.lines.replace("\n", "\r\n"), gap: "0", budget: "" },
    "tr",
  );
  assert.equal(plan.total, 450);
  assert.equal(plan.budget, null);
  assert.equal(plan.pieces[1].start, 200);
});
for (const value of [
  "0:00",
  "30:01",
  "59:59",
  "3:60",
  "3:2",
  "-1:00",
  "1.5:00",
  "00:000",
  "1e2:00",
  "Infinity",
  "",
  "1:00\n",
  "٣:٢٠",
])
  test(`reject duration ${JSON.stringify(value)}`, () =>
    assert.throws(() => seconds(value, "en"), InputError));
for (const [value, expected] of [
  ["0:01", 1],
  ["30:00", 1800],
  ["03:20", 200],
  ["9:59", 599],
])
  test(`accept duration ${value}`, () =>
    assert.equal(seconds(value, "en"), expected));
for (const gap of ["301", "-1", "1.5", "1e2", "", "0000"])
  test(`reject gap ${JSON.stringify(gap)}`, () =>
    assert.throws(() => makePlan({ ...base, gap }, "en"), InputError));
for (const budget of ["0", "181", "1.5", "-1", "1e2"])
  test(`reject budget ${budget}`, () =>
    assert.throws(() => makePlan({ ...base, budget }, "tr"), InputError));
for (const lines of [
  "3:20 | One",
  Array(9).fill("1:00 | Title").join("\n"),
  "3:20 | One\n\n4:10 | Two",
  "3:20 One\n4:10 | Two",
  "3:20 | One | Extra\n4:10 | Two",
  `3:20 | ${"a".repeat(41)}\n4:10 | Two`,
  `3:20 | One\n${"a".repeat(600)}`,
])
  test(`reject malformed list ${lines.length}`, () =>
    assert.throws(() => makePlan({ ...base, lines }, "en"), InputError));
for (const title of [
  "",
  "a".repeat(61),
  "Hi\nthere",
  "\u202eevil",
  "\u200bhidden",
  "@everyone",
  "<@123>",
  "https://example.org",
  "WWW.example.org",
  "discord.gg/test",
  "mfa.example",
  "\ud800",
  "a\u2028b",
])
  test(`reject unsafe title ${JSON.stringify(title)}`, () =>
    assert.throws(() => cleanText(title, 60, "en"), InputError));
test("Unicode names and markdown escape safely", () => {
  const plan = makePlan(
    {
      ...base,
      title: "Türkçe **şarkı**",
      lines: "3:20 | [Açılış]\n4:10 | 🎶 Final",
    },
    "tr",
  );
  const result = renderPlan(plan, "tr");
  assert.ok(result.includes("\\*\\*şarkı\\*\\*"));
  assert.ok(result.includes("\\[Açılış\\]"));
  assert.ok(result.includes("🎶 Final"));
});
test("maximum valid plan is exactly three hours; larger total is rejected", () => {
  const lines = Array(6).fill("30:00 | Long piece").join("\n");
  assert.equal(makePlan({ ...base, lines, gap: "0" }, "en").total, 10800);
  assert.throws(() => makePlan({ ...base, lines, gap: "1" }, "en"), InputError);
});
test("budget result distinguishes remaining, exact and over", () => {
  assert.match(renderPlan(makePlan(base, "en"), "en"), /Remaining: 2:00/);
  assert.match(
    renderPlan(makePlan({ ...base, budget: "8" }, "en"), "en"),
    /Remaining: 0:00/,
  );
  assert.match(
    renderPlan(makePlan({ ...base, budget: "7" }, "en"), "en"),
    /Over: 1:00/,
  );
  assert.match(
    renderPlan(makePlan({ ...base, budget: "7" }, "tr"), "tr"),
    /Aşım: 1:00/,
  );
});
for (const lang of ["en", "tr"])
  test(`worst-case escaped preview fits Discord ${lang}`, () => {
    const plan = makePlan(
      {
        title: "*".repeat(60),
        lines: Array(8)
          .fill(`1:00 | ${"*".repeat(40)}`)
          .join("\n"),
        gap: "300",
        budget: "180",
      },
      lang,
    );
    assert.ok(renderPlan(plan, lang).length + 130 < 2000);
  });
test("clock supports elapsed hour rollover; language selection is predictable", () => {
  assert.equal(clock(0), "0:00");
  assert.equal(clock(3601), "1:00:01");
  assert.equal(clock(10800), "3:00:00");
  assert.equal(language("tr"), "tr");
  assert.equal(language("tr-TR"), "tr");
  assert.equal(language("fr"), "en");
});
