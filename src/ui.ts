import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  InteractionContextType,
  LabelBuilder,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { type Language, words } from "./plan.js";

export const command = new SlashCommandBuilder()
  .setName("setsprig")
  .setDescription("Preview a setlist duration plan before sharing it")
  .setDescriptionLocalizations({
    tr: "Setlist süre planını paylaşmadan önce özel olarak incele",
  })
  .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
  .setContexts(InteractionContextType.Guild);

export function modal(id: string, lang: Language): ModalBuilder {
  const field = (
    custom: string,
    label: string,
    description: string,
    max: number,
    paragraph = false,
    required = true,
    value?: string,
  ): LabelBuilder => {
    const input = new TextInputBuilder()
      .setCustomId(custom)
      .setStyle(paragraph ? TextInputStyle.Paragraph : TextInputStyle.Short)
      .setMaxLength(max)
      .setRequired(required);
    if (value !== undefined) input.setValue(value);
    return new LabelBuilder()
      .setLabel(label)
      .setDescription(description)
      .setTextInputComponent(input);
  };
  return new ModalBuilder()
    .setCustomId(`ss:form:${id}`)
    .setTitle(words(lang, "Setlist süre planı", "Setlist duration plan"))
    .addLabelComponents(
      field(
        "title",
        words(lang, "Plan başlığı", "Plan title"),
        words(
          lang,
          "Bağlantı, etiket veya özel bilgi eklemeyin.",
          "No links, mentions or private information.",
        ),
        60,
      ),
      field(
        "lines",
        words(lang, "2–8 parça: m:ss | Ad", "2–8 pieces: m:ss | Title"),
        words(
          lang,
          "Her satıra bir parça. Örnek: 3:20 | Açılış. Ad en fazla 40 karakter.",
          "One per line. Example: 3:20 | Opening. Titles at most 40 characters.",
        ),
        600,
        true,
      ),
      field(
        "gap",
        words(
          lang,
          "Parçalar arası geçiş (saniye)",
          "Transition between pieces (seconds)",
        ),
        words(
          lang,
          "0–300 tam sayı. İlk parçadan önce ve son parçadan sonra eklenmez.",
          "Integer 0–300. No transition before the first or after the last piece.",
        ),
        3,
        false,
        true,
        "30",
      ),
      field(
        "budget",
        words(
          lang,
          "İsteğe bağlı hedef (dakika)",
          "Optional time budget (minutes)",
        ),
        words(
          lang,
          "1–180 tam sayı; karşılaştırma istemiyorsanız boş bırakın.",
          "Integer 1–180; leave blank for no comparison.",
        ),
        3,
        false,
        false,
      ),
    );
}

export function controls(
  id: string,
  lang: Language,
): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`ss:share:${id}`)
      .setStyle(ButtonStyle.Primary)
      .setLabel(words(lang, "Bu kanalda paylaş", "Share in this channel")),
    new ButtonBuilder()
      .setCustomId(`ss:discard:${id}`)
      .setStyle(ButtonStyle.Secondary)
      .setLabel(words(lang, "Vazgeç", "Discard")),
  );
}
