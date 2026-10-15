import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

export interface Config {
  token: string;
  application: string;
  guild: string;
}
export function readConfig(): Config {
  if (existsSync(".env")) loadEnvFile(".env");
  const token = process.env.DISCORD_TOKEN ?? "";
  const application = process.env.APPLICATION_ID ?? "";
  const guild = process.env.GUILD_ID ?? "";
  if (
    !/^[A-Za-z\d._-]{30,200}$/.test(token) ||
    token === "replace_with_your_bot_token" ||
    !/^\d{17,22}$/.test(application) ||
    !/^\d{17,22}$/.test(guild)
  ) {
    throw new Error(
      "Ayarlar eksik/geçersiz. Önce setup dosyasını çalıştırın. / Configuration missing or invalid. Run the setup helper first.",
    );
  }
  return { token, application, guild };
}
