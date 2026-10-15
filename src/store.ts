import { randomBytes } from "node:crypto";
import type { Language } from "./plan.js";

export interface Context {
  user: string;
  guild: string;
  channel: string;
  application: string;
}
export interface Draft extends Context {
  id: string;
  expires: number;
  lang: Language;
  stage: "form" | "preview";
  content: string;
  message: string;
}
export const sameContext = (a: Context, b: Context): boolean =>
  a.user === b.user &&
  a.guild === b.guild &&
  a.channel === b.channel &&
  a.application === b.application;

export class Drafts {
  private readonly data = new Map<string, Draft>();
  constructor(
    private readonly now: () => number = Date.now,
    private readonly capacity = 100,
    private readonly nonce: () => string = () =>
      randomBytes(18).toString("hex"),
  ) {}
  prune(): void {
    for (const [id, draft] of this.data)
      if (draft.expires <= this.now()) this.data.delete(id);
  }
  create(
    context: Context,
    lang: Language,
    stage: Draft["stage"],
    content = "",
  ): Draft | undefined {
    this.prune();
    for (const [id, draft] of this.data)
      if (draft.user === context.user && draft.guild === context.guild)
        this.data.delete(id);
    if (this.data.size >= this.capacity) return undefined;
    const id = this.nonce();
    if (!/^[a-f0-9]{36}$/.test(id) || this.data.has(id))
      throw new Error("Invalid draft identifier");
    const draft: Draft = {
      ...context,
      id,
      lang,
      stage,
      content,
      message: "",
      expires: this.now() + 300000,
    };
    this.data.set(id, draft);
    return draft;
  }
  bind(id: string, message: string): void {
    const draft = this.data.get(id);
    if (draft) draft.message = message;
  }
  take(
    id: string,
    context: Context,
    stage: Draft["stage"],
    message = "",
  ): Draft | undefined {
    this.prune();
    const draft = this.data.get(id);
    if (
      !draft ||
      !sameContext(draft, context) ||
      draft.stage !== stage ||
      draft.message !== message
    )
      return undefined;
    this.data.delete(id);
    return draft;
  }
  remove(id: string): void {
    this.data.delete(id);
  }
  get size(): number {
    this.prune();
    return this.data.size;
  }
}

export class Cooldowns {
  private readonly data = new Map<string, number>();
  constructor(
    private readonly now: () => number = Date.now,
    private readonly capacity = 500,
  ) {}
  prune(): void {
    for (const [key, until] of this.data)
      if (until <= this.now()) this.data.delete(key);
  }
  claim(key: string, ms: number): boolean {
    this.prune();
    if (this.data.has(key) || this.data.size >= this.capacity) return false;
    this.data.set(key, this.now() + ms);
    return true;
  }
  get size(): number {
    this.prune();
    return this.data.size;
  }
}
