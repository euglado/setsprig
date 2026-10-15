import { REST, Routes } from "discord.js";
import { readConfig } from "./config.js";
import { command } from "./ui.js";

async function register(): Promise<void> {
  const config = readConfig();
  const rest = new REST({ version: "10", retries: 0, timeout: 10000 }).setToken(
    config.token,
  );
  const me = (await rest.get(Routes.currentApplication())) as { id: string };
  if (me.id !== config.application) throw new Error("Application mismatch");
  // POST upserts this command by name, preserving unrelated application commands.
  await rest.post(
    Routes.applicationGuildCommands(config.application, config.guild),
    { body: command.toJSON() },
  );
  console.log(
    "/setsprig registered for your server. / Komut sunucunuza kaydedildi.",
  );
}
register().catch((error) => {
  console.error(
    error instanceof Error && error.message.startsWith("Ayarlar")
      ? error.message
      : "Command registration failed. Check IDs, token and bot installation. / Komut kaydedilemedi; kimlikleri, tokenı ve bot kurulumunu kontrol edin.",
  );
  process.exitCode = 1;
});
