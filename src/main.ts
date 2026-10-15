import { Client, Events, GatewayIntentBits, Options } from "discord.js";
import { readConfig } from "./config.js";
import { createHandler, safeMentions } from "./handler.js";

async function main(): Promise<void> {
  const config = readConfig();
  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
    allowedMentions: safeMentions,
    makeCache: Options.cacheWithLimits({
      ...Options.DefaultMakeCacheSettings,
      MessageManager: 0,
      GuildMemberManager: 0,
      UserManager: 0,
    }),
    rest: { retries: 0, timeout: 10000 },
  });
  const { handler, prune } = createHandler(config, client);
  const timer = setInterval(prune, 30000);
  timer.unref();
  client.once(Events.ClientReady, () => {
    if (client.user?.id !== config.application) {
      console.error(
        "Application ID does not match token. / Uygulama kimliği tokenla eşleşmiyor.",
      );
      clearInterval(timer);
      client.destroy();
      process.exitCode = 1;
      return;
    }
    console.log("SetSprig ready. / SetSprig hazır.");
  });
  client.on(Events.InteractionCreate, (i) => {
    void handler(i).catch(() =>
      console.error("Interaction failed; no private data logged."),
    );
  });
  client.on(Events.Error, () =>
    console.error("Discord connection error; check network and configuration."),
  );
  for (const signal of ["SIGINT", "SIGTERM"] as const)
    process.once(signal, () => {
      clearInterval(timer);
      client.destroy();
    });
  try {
    await client.login(config.token);
  } catch {
    clearInterval(timer);
    client.destroy();
    throw new Error(
      "Discord login failed. Check token and network. / Discord girişi başarısız; tokenı ve bağlantıyı kontrol edin.",
    );
  }
}
main().catch((error) => {
  console.error(
    error instanceof Error && error.message.startsWith("Ayarlar")
      ? error.message
      : "Startup failed. Check configuration and network. / Başlatılamadı; ayarları ve bağlantıyı kontrol edin.",
  );
  process.exitCode = 1;
});
