import {
  ChannelType,
  type Client,
  type GuildTextBasedChannel,
  type Interaction,
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js";
import type { Config } from "./config.js";
import { InputError, language, makePlan, renderPlan, words } from "./plan.js";
import { type Context, Cooldowns, Drafts } from "./store.js";
import { controls, modal } from "./ui.js";

const required = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
];
export const safeMentions = { parse: [] as never[], repliedUser: false };
export function createHandler(
  config: Config,
  client: Client,
  drafts = new Drafts(),
  forms = new Cooldowns(),
  shares = new Cooldowns(),
) {
  async function handler(interaction: Interaction): Promise<void> {
    if (
      !interaction.isChatInputCommand() &&
      !interaction.isModalSubmit() &&
      !interaction.isButton()
    )
      return;
    const i = interaction;
    if (
      i.isChatInputCommand()
        ? i.commandName !== "setsprig"
        : !i.customId.startsWith("ss:")
    )
      return;
    const lang = language(i.locale);
    const say = (tr: string, en: string) => words(lang, tr, en);
    const notice = async (content: string): Promise<void> => {
      const body = { content, components: [], allowedMentions: safeMentions };
      if (i.deferred || i.replied) await i.editReply(body);
      else await i.reply({ ...body, flags: MessageFlags.Ephemeral });
    };
    if (
      !i.inCachedGuild() ||
      !i.channelId ||
      i.guildId !== config.guild ||
      i.applicationId !== config.application
    ) {
      await notice(
        say(
          "Bot yalnızca ayarlanan sunucuda çalışır.",
          "This bot only works in its configured server.",
        ),
      );
      return;
    }
    const context: Context = {
      user: i.user.id,
      guild: i.guildId,
      channel: i.channelId,
      application: i.applicationId,
    };
    const expired = say(
      "Bu taslak geçersiz, kullanılmış veya süresi dolmuş. /setsprig ile yeniden başlayın.",
      "This draft is invalid, used or expired. Start again with /setsprig.",
    );
    const permitted = (): boolean =>
      i.memberPermissions.has(required) && !!i.appPermissions?.has(required);
    const permissionError = say(
      "Sizin ve botun bu kanalda Kanalı Görüntüle ve Mesaj Gönder izinlerine ihtiyacı var; metin/duyuru kanalı kullanın.",
      "You and the bot need View Channel and Send Messages here; use a text or announcement channel.",
    );
    try {
      if (i.isChatInputCommand()) {
        if (
          !permitted() ||
          !i.channel ||
          ![ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(
            i.channel.type,
          )
        ) {
          await notice(permissionError);
          return;
        }
        if (!forms.claim(`${i.guildId}:${i.user.id}`, 5000)) {
          await notice(
            say(
              "Birkaç saniye bekleyin; bot meşgulse daha sonra deneyin.",
              "Wait a few seconds; if the bot is busy, try later.",
            ),
          );
          return;
        }
        const draft = drafts.create(context, lang, "form");
        if (!draft) {
          await notice(
            say(
              "Taslak kapasitesi dolu; beş dakika sonra deneyin.",
              "Draft capacity is full; try again in five minutes.",
            ),
          );
          return;
        }
        try {
          await i.showModal(modal(draft.id, lang));
        } catch {
          drafts.remove(draft.id);
          throw new Error("Modal response failed");
        }
        return;
      }
      const match = /^ss:(form|share|discard):([a-f0-9]{36})$/.exec(i.customId);
      if (!match) {
        await notice(expired);
        return;
      }
      const id = match[2] ?? "";
      if (i.isModalSubmit()) {
        if (match[1] !== "form") {
          await notice(expired);
          return;
        }
        const form = drafts.take(id, context, "form");
        if (!form) {
          await notice(expired);
          return;
        }
        await i.deferReply({ flags: MessageFlags.Ephemeral });
        const plan = makePlan(
          {
            title: i.fields.getTextInputValue("title"),
            lines: i.fields.getTextInputValue("lines"),
            gap: i.fields.getTextInputValue("gap"),
            budget: i.fields.getTextInputValue("budget"),
          },
          form.lang,
        );
        const content = renderPlan(plan, form.lang);
        const preview = drafts.create(context, form.lang, "preview", content);
        if (!preview) {
          await notice(
            say(
              "Taslak kapasitesi dolu; yeniden başlayın.",
              "Draft capacity is full; start again later.",
            ),
          );
          return;
        }
        try {
          const message = await i.editReply({
            content: `${content}\n\n${words(form.lang, "Özel önizleme · 5 dakika. Paylaş düğmesi yukarıdaki planı bu kanala gönderir.", "Private preview · 5 minutes. Share posts the plan above in this channel.")}`,
            components: [controls(preview.id, form.lang)],
            allowedMentions: safeMentions,
            flags: MessageFlags.SuppressEmbeds,
          });
          drafts.bind(preview.id, message.id);
        } catch {
          drafts.remove(preview.id);
          throw new Error("Preview response failed");
        }
        return;
      }
      if (
        match[1] === "form" ||
        i.message.author.id !== client.user?.id ||
        i.message.webhookId !== config.application ||
        !i.message.flags.has(MessageFlags.Ephemeral)
      ) {
        await notice(expired);
        return;
      }
      const draft = drafts.take(id, context, "preview", i.message.id);
      if (!draft) {
        await notice(expired);
        return;
      }
      // Consume synchronously, before any acknowledgement or network request.
      await i.deferUpdate();
      if (match[1] === "discard") {
        await notice(words(draft.lang, "Taslak silindi.", "Draft discarded."));
        return;
      }
      if (!shares.claim(`${i.guildId}:${i.channelId}`, 60000)) {
        await notice(
          say(
            "Bu kanalda dakikada bir paylaşım yapılabilir; taslak kapatıldı. Daha sonra yeniden başlayın.",
            "One share per channel per minute; draft closed. Start again later.",
          ),
        );
        return;
      }
      // Fetch roles and members again to avoid publishing with revoked permissions.
      await i.guild.roles.fetch();
      const [channel, member, bot] = await Promise.all([
        i.guild.channels.fetch(i.channelId, { force: true }),
        i.guild.members.fetch({ user: i.user.id, force: true, cache: false }),
        i.guild.members.fetch({
          user: config.application,
          force: true,
          cache: false,
        }),
      ]);
      if (
        !channel ||
        (channel.type !== ChannelType.GuildText &&
          channel.type !== ChannelType.GuildAnnouncement) ||
        !channel.permissionsFor(member).has(required) ||
        !channel.permissionsFor(bot).has(required) ||
        member.isCommunicationDisabled()
      ) {
        await notice(permissionError);
        return;
      }
      if ((channel.rateLimitPerUser ?? 0) > 60) {
        await notice(
          say(
            "Kanalın yavaş modu 60 saniyeyi aşıyor. Taslak kapatıldı; daha düşük yavaş modlu bir metin kanalı kullanın.",
            "This channel's slowmode exceeds 60 seconds. Draft closed; use a text channel with lower slowmode.",
          ),
        );
        return;
      }
      await (channel as GuildTextBasedChannel).send({
        content: draft.content,
        allowedMentions: safeMentions,
        flags: MessageFlags.SuppressEmbeds,
      });
      await notice(
        words(
          draft.lang,
          "Plan bu kanalda paylaşıldı. Silmek için normal Discord mesaj denetimlerini kullanın.",
          "Plan shared in this channel. Use normal Discord message controls to delete it.",
        ),
      );
    } catch (error) {
      // Never print interaction bodies, REST errors or credentials.
      const content =
        error instanceof InputError
          ? error.message
          : say(
              "İşlem tamamlanamadı. İzinleri/bağlantıyı kontrol edin. Paylaşım sırasında hata olduysa kanalı kontrol edin; körlemesine tekrar göndermeyin.",
              "Could not finish. Check permissions/connection. If sharing failed, inspect the channel before trying again.",
            );
      try {
        await notice(content);
      } catch {
        console.error("Discord response failed; no interaction data logged.");
      }
    }
  }
  return {
    handler,
    prune: () => {
      drafts.prune();
      forms.prune();
      shares.prune();
    },
  };
}
