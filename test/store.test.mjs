import assert from "node:assert/strict";
import test from "node:test";
import { Cooldowns, Drafts } from "../dist/store.js";

const context = { user: "u1", guild: "g", channel: "c", application: "a" };
test("random nonce is 36 lowercase hexadecimal characters", () =>
  assert.match(
    new Drafts().create(context, "en", "form").id,
    /^[a-f0-9]{36}$/,
  ));
for (const key of ["user", "guild", "channel", "application"])
  test(`draft rejects wrong ${key} without consuming owner draft`, () => {
    const store = new Drafts();
    const draft = store.create(context, "en", "form");
    assert.equal(
      store.take(draft.id, { ...context, [key]: "other" }, "form"),
      undefined,
    );
    assert.equal(store.take(draft.id, context, "form").id, draft.id);
    assert.equal(store.take(draft.id, context, "form"), undefined);
  });
test("preview is bound to stage and message", () => {
  const store = new Drafts();
  const draft = store.create(context, "tr", "preview", "safe");
  store.bind(draft.id, "m");
  assert.equal(store.take(draft.id, context, "form", "m"), undefined);
  assert.equal(store.take(draft.id, context, "preview", "wrong"), undefined);
  assert.equal(store.take(draft.id, context, "preview", "m").content, "safe");
});
test("expiration is inclusive and bound to injected clock", () => {
  let now = 0;
  const store = new Drafts(() => now);
  const draft = store.create(context, "en", "form");
  now = 300000;
  assert.equal(store.take(draft.id, context, "form"), undefined);
  assert.equal(store.size, 0);
});
test("capacity preserves other users and permits same-user replacement at capacity", () => {
  const store = new Drafts(Date.now, 1);
  const original = store.create(context, "en", "form");
  assert.equal(
    store.create({ ...context, user: "other" }, "en", "form"),
    undefined,
  );
  const replaced = store.create(context, "tr", "preview", "text");
  assert.notEqual(original.id, replaced.id);
  assert.equal(store.size, 1);
  store.remove(replaced.id);
  assert.equal(store.size, 0);
});
test("cooldown caps memory and recovers after expiry", () => {
  let now = 0;
  const limit = new Cooldowns(() => now, 1);
  assert.equal(limit.claim("c1", 5000), true);
  assert.equal(limit.claim("c1", 5000), false);
  assert.equal(limit.claim("c2", 5000), false);
  now = 5000;
  assert.equal(limit.claim("c2", 5000), true);
  assert.equal(limit.size, 1);
  now = 10000;
  limit.prune();
  assert.equal(limit.size, 0);
});
