import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const allowed = new Set([
  "MIT",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "ISC",
  "0BSD",
  "MIT OR Apache-2.0",
  "(MIT OR Apache-2.0)",
]);
const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
let dependencies = 0;
for (const [name, pkg] of Object.entries(lock.packages)) {
  if (!name) continue;
  if (
    !pkg.resolved?.startsWith("https://registry.npmjs.org/") ||
    !/^sha512-[A-Za-z\d+/]+=*$/.test(pkg.integrity ?? "") ||
    !allowed.has(pkg.license) ||
    pkg.hasInstallScript ||
    pkg.link
  )
    throw new Error(`Review dependency metadata: ${name}`);
  dependencies++;
}
const tracked = execFileSync(
  "git",
  ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
  { encoding: "utf8" },
)
  .split("\0")
  .filter(Boolean);
let files = 0;
for (const file of new Set(tracked)) {
  if (/(?:^|\/)\.env(?:\.|$)/.test(file) && file !== ".env.example")
    throw new Error("Private configuration is tracked");
  if (file.includes("..") || file.startsWith("/") || file.includes("\\"))
    throw new Error("Unexpected source path");
  if (/^(?:node_modules|dist|\.git)\//.test(file))
    throw new Error("Generated files are tracked");
  const text = readFileSync(file, "utf8");
  if (
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text) ||
    /(?:gh[pousr]_[A-Za-z\d]{30,}|github_pat_[A-Za-z\d_]{40,})/.test(text) ||
    /(?:mfa\.[A-Za-z\d_-]{40,}|[A-Za-z\d_-]{23,28}\.[A-Za-z\d_-]{6}\.[A-Za-z\d_-]{27,})/.test(
      text,
    )
  )
    throw new Error(`Possible credential in source: ${file}`);
  files++;
}
console.log(
  `Supply check passed: ${dependencies} dependency license/registry/SHA-512/no-install-script records; ${files} source credential-pattern scans. Heuristic scan only.`,
);
