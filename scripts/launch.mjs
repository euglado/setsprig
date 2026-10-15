import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const target = process.argv[2];
if (!["main", "register"].includes(target)) {
  console.error("Unknown launch mode.");
  process.exitCode = 1;
} else if (!existsSync(`dist/${target}.js`)) {
  console.error(
    "Önce setup dosyasını çalıştırın. / Run the setup helper first.",
  );
  process.exitCode = 1;
} else {
  const result = spawnSync(process.execPath, [`dist/${target}.js`], {
    stdio: "inherit",
  });
  process.exitCode = result.status ?? 1;
}
