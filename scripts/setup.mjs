import { existsSync, writeFileSync } from "node:fs";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";

async function secret() {
  stdout.write("Bot token (gizli / hidden): ");
  stdin.setRawMode(true);
  stdin.setEncoding("utf8");
  stdin.resume();
  try {
    return await new Promise((resolve, reject) => {
      let value = "";
      const onData = (chunk) => {
        for (const char of chunk) {
          if (char === "\u0003") {
            cleanup();
            reject(new Error("Cancelled"));
            return;
          }
          if (char === "\r" || char === "\n") {
            cleanup();
            resolve(value);
            return;
          }
          if (char === "\u007f" || char === "\b") value = value.slice(0, -1);
          else if (/^[A-Za-z\d._-]$/.test(char) && value.length < 200)
            value += char;
        }
      };
      const cleanup = () => {
        stdin.off("data", onData);
        stdout.write("\n");
      };
      stdin.on("data", onData);
    });
  } finally {
    stdin.setRawMode(false);
    stdin.pause();
  }
}

async function setup() {
  if (Number(process.versions.node.split(".")[0]) !== 24)
    throw new Error("Node.js 24 gerekli / required.");
  if (existsSync(".env"))
    throw new Error(
      ".env zaten var; üzerine yazılmadı. / .env exists; nothing overwritten.",
    );
  if (!stdin.isTTY || !stdout.isTTY)
    throw new Error(
      "Etkileşimli terminal gerekli. / An interactive terminal is required.",
    );
  console.log(
    "SetSprig · Gizli bilgileri paylaşmayın. / Never share credentials.",
  );
  const reader = createInterface({ input: stdin, output: stdout });
  let application;
  let guild;
  try {
    application = (await reader.question("Application ID: ")).trim();
    guild = (await reader.question("Server / Sunucu ID: ")).trim();
  } finally {
    reader.close();
  }
  if (!/^\d{17,22}$/.test(application) || !/^\d{17,22}$/.test(guild))
    throw new Error("Geçersiz kimlik / Invalid ID.");
  const token = await secret();
  if (!/^[A-Za-z\d._-]{30,200}$/.test(token))
    throw new Error("Geçersiz token biçimi / Invalid token format.");
  writeFileSync(
    ".env",
    `DISCORD_TOKEN=${token}\nAPPLICATION_ID=${application}\nGUILD_ID=${guild}\n`,
    { flag: "wx", mode: 0o600 },
  );
  console.log(
    "Ayarlar .env dosyasına kaydedildi. Register, sonra Start çalıştırın. / Saved .env. Run Register, then Start.",
  );
}
setup().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
