import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

for (const relative of [
  "dist/main.js",
  "dist/register.js",
  "scripts/setup.mjs",
])
  test(`unconfigured ${relative} exits safely without writing credentials`, () => {
    const prefix = path.join(tmpdir(), "setsprig-check-");
    const folder = mkdtempSync(prefix);
    const env = { ...process.env };
    for (const key of ["DISCORD_TOKEN", "APPLICATION_ID", "GUILD_ID"])
      delete env[key];
    try {
      const result = spawnSync(process.execPath, [path.resolve(relative)], {
        cwd: folder,
        env,
        encoding: "utf8",
        timeout: 10000,
        input: "",
      });
      assert.equal(result.status, 1);
      assert.equal(result.error, undefined);
      assert.equal(existsSync(path.join(folder, ".env")), false);
      assert.match(result.stderr, /setup|interactive terminal/i);
    } finally {
      assert.ok(
        path.resolve(folder).startsWith(path.resolve(prefix)) &&
          path.dirname(folder) === path.resolve(tmpdir()),
      );
      rmSync(folder, { recursive: true, force: true });
    }
  });
