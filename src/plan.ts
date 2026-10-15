export type Language = "tr" | "en";
export class InputError extends Error {}
export const language = (locale: string): Language =>
  locale.startsWith("tr") ? "tr" : "en";
export const words = (lang: Language, tr: string, en: string): string =>
  lang === "tr" ? tr : en;

function fail(lang: Language, tr: string, en: string): never {
  throw new InputError(words(lang, tr, en));
}

export function cleanText(value: string, max: number, lang: Language): string {
  const text = value.trim();
  if (
    !text ||
    text.length > max ||
    /[\p{Cc}\p{Cf}\p{Cs}\p{Zl}\p{Zp}]/u.test(text)
  ) {
    fail(
      lang,
      `Başlıklar 1–${max} karakter olmalı; kontrol karakterleri kullanmayın.`,
      `Titles must contain 1–${max} characters without control characters.`,
    );
  }
  if (/@|https?:|www\.|discord(?:app)?\.(?:gg|com)|mfa\./iu.test(text)) {
    fail(
      lang,
      "Başlıklara bağlantı, etiket veya gizli bilgi koymayın.",
      "Do not put links, mentions or secrets in titles.",
    );
  }
  return text;
}

function integer(
  value: string,
  min: number,
  max: number,
  lang: Language,
): number {
  if (!/^\d{1,3}$/.test(value))
    fail(
      lang,
      `${min}–${max} arasında tam sayı girin.`,
      `Enter an integer from ${min} to ${max}.`,
    );
  const result = Number(value);
  if (result < min || result > max)
    fail(
      lang,
      `${min}–${max} aralığı dışında bir sayı girdiniz.`,
      `The number must be from ${min} to ${max}.`,
    );
  return result;
}

export function seconds(value: string, lang: Language): number {
  const match = /^(\d{1,2}):([0-5]\d)$/.exec(value);
  if (!match)
    fail(
      lang,
      "Süreyi m:ss olarak yazın; örnek 3:20.",
      "Write durations as m:ss, for example 3:20.",
    );
  const duration = Number(match[1]) * 60 + Number(match[2]);
  if (duration < 1 || duration > 1800)
    fail(
      lang,
      "Her parça 0:01–30:00 arasında olmalı.",
      "Each piece must last from 0:01 to 30:00.",
    );
  return duration;
}

export interface Piece {
  title: string;
  duration: number;
  start: number;
  end: number;
}
export interface Plan {
  title: string;
  pieces: Piece[];
  gap: number;
  music: number;
  transitions: number;
  total: number;
  budget: number | null;
}
export interface PlanInput {
  title: string;
  lines: string;
  gap: string;
  budget: string;
}

export function makePlan(input: PlanInput, lang: Language): Plan {
  const title = cleanText(input.title, 60, lang);
  if (input.lines.length > 600)
    fail(
      lang,
      "Parça listesi en fazla 600 karakter olabilir.",
      "The piece list must be at most 600 characters.",
    );
  const lines = input.lines.trim().split(/\r?\n/);
  if (lines.length < 2 || lines.length > 8)
    fail(
      lang,
      "Her satıra bir parça, toplam 2–8 parça girin.",
      "Enter 2–8 pieces, one per line.",
    );
  const gap = integer(input.gap.trim(), 0, 300, lang);
  const budgetText = input.budget.trim();
  const budget =
    budgetText === "" ? null : integer(budgetText, 1, 180, lang) * 60;
  let elapsed = 0;
  let music = 0;
  const pieces = lines.map((line, index) => {
    const parts = line.split("|");
    if (parts.length !== 2)
      fail(
        lang,
        "Her satır m:ss | Parça adı biçiminde olmalı.",
        "Each line must use m:ss | Piece title.",
      );
    const duration = seconds((parts[0] ?? "").trim(), lang);
    const pieceTitle = cleanText(parts[1] ?? "", 40, lang);
    if (index > 0) elapsed += gap;
    const start = elapsed;
    elapsed += duration;
    music += duration;
    return { title: pieceTitle, duration, start, end: elapsed };
  });
  if (elapsed > 10800)
    fail(
      lang,
      "Toplam plan en fazla 3 saat olabilir.",
      "The entire plan must fit within 3 hours.",
    );
  return {
    title,
    pieces,
    gap,
    music,
    transitions: gap * (pieces.length - 1),
    total: elapsed,
    budget,
  };
}

export function clock(value: number): string {
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const secs = String(value % 60).padStart(2, "0");
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${secs}`
    : `${minutes}:${secs}`;
}

const escapeMarkdown = (text: string): string =>
  text.replace(/[\\`*_{}[\]()<>~|#>]/g, "\\$&");
export function renderPlan(plan: Plan, lang: Language): string {
  const lines = [
    `**SetSprig · ${escapeMarkdown(plan.title)}**`,
    words(
      lang,
      "Süreler setin başlangıcına göredir; canlı sayaç değildir.",
      "Times are elapsed from the set start; this is not a live timer.",
    ),
    ...plan.pieces.map(
      (piece, i) =>
        `${i + 1}. ${clock(piece.start)}–${clock(piece.end)} · ${escapeMarkdown(piece.title)} (${clock(piece.duration)})`,
    ),
    words(
      lang,
      `Müzik: ${clock(plan.music)} · Geçişler: ${clock(plan.transitions)} (${plan.gap} sn × ${plan.pieces.length - 1})`,
      `Music: ${clock(plan.music)} · Transitions: ${clock(plan.transitions)} (${plan.gap}s × ${plan.pieces.length - 1})`,
    ),
    words(
      lang,
      `Toplam: **${clock(plan.total)}**`,
      `Total: **${clock(plan.total)}**`,
    ),
  ];
  if (plan.budget !== null) {
    const delta = plan.budget - plan.total;
    lines.push(
      words(
        lang,
        `Hedef: ${clock(plan.budget)} · ${delta < 0 ? "Aşım" : "Kalan"}: ${clock(Math.abs(delta))}`,
        `Budget: ${clock(plan.budget)} · ${delta < 0 ? "Over" : "Remaining"}: ${clock(Math.abs(delta))}`,
      ),
    );
  }
  lines.push(
    words(
      lang,
      "Tahmini plan; gerçek performans ve geçiş süreleri değişebilir.",
      "Estimated plan; actual performance and transition times may vary.",
    ),
  );
  return lines.join("\n");
}
