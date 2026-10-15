import assert from "node:assert/strict";
import test from "node:test";
import {
  ChannelType,
  MessageFlags,
  MessageFlagsBitField,
  PermissionFlagsBits,
  PermissionsBitField,
} from "discord.js";
import { createHandler } from "../dist/handler.js";
import { Cooldowns, Drafts } from "../dist/store.js";
import { command, modal } from "../dist/ui.js";

const config = {
  token: "not-configured",
  application: "application",
  guild: "guild",
};
const permissions = new PermissionsBitField([
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
]);
function fixture() {
  let now = 0;
  const drafts = new Drafts(() => now);
  const forms = new Cooldowns(() => now);
  const shares = new Cooldowns(() => now);
  const events = [];
  const sent = [];
  const members = {
    user: { id: "user", isCommunicationDisabled: () => false },
    application: { id: "application" },
  };
  const channel = {
    id: "channel",
    type: ChannelType.GuildText,
    rateLimitPerUser: 0,
    permissionsFor: () => permissions,
    send: async (body) => {
      events.push("send");
      sent.push(body);
      return { id: "public" };
    },
  };
  const guild = {
    roles: {
      fetch: async () => {
        events.push("roles");
      },
    },
    channels: {
      fetch: async (id, options) => {
        assert.equal(id, "channel");
        assert.equal(options.force, true);
        events.push("channel");
        return channel;
      },
    },
    members: {
      fetch: async ({ user, force, cache }) => {
        assert.equal(force, true);
        assert.equal(cache, false);
        events.push(`member:${user}`);
        return members[user];
      },
    },
  };
  const client = { user: { id: "application" } };
  const { handler, prune } = createHandler(
    config,
    client,
    drafts,
    forms,
    shares,
  );
  const interaction = (kind, extra = {}) => {
    const i = {
      commandName: "setsprig",
      customId: "",
      locale: "en-US",
      user: { id: "user" },
      applicationId: "application",
      guildId: "guild",
      channelId: "channel",
      guild,
      channel,
      memberPermissions: permissions,
      appPermissions: permissions,
      deferred: false,
      replied: false,
      edits: [],
      replies: [],
      shown: [],
      isChatInputCommand: () => kind === "command",
      isModalSubmit: () => kind === "modal",
      isButton: () => kind === "button",
      inCachedGuild: () => true,
      message: {
        id: "preview",
        author: { id: "application" },
        webhookId: "application",
        flags: new MessageFlagsBitField(MessageFlags.Ephemeral),
      },
      fields: {
        getTextInputValue: (key) =>
          ({
            title: "Rehearsal",
            lines: "3:20 | Opening\n4:10 | Finale",
            gap: "30",
            budget: "10",
          })[key],
      },
      async showModal(body) {
        this.shown.push(body.toJSON());
        this.replied = true;
      },
      async reply(body) {
        this.replies.push(body);
        this.replied = true;
      },
      async deferReply(body) {
        this.deferFlags = body.flags;
        this.deferred = true;
        events.push("deferReply");
      },
      async deferUpdate() {
        this.deferred = true;
        events.push("deferUpdate");
      },
      async editReply(body) {
        this.edits.push(body);
        return { id: "preview" };
      },
      ...extra,
    };
    return i;
  };
  const preview = async (user = "user") => {
    const start = interaction("command", { user: { id: user } });
    await handler(start);
    const form = interaction("modal", {
      customId: start.shown[0].custom_id,
      user: { id: user },
    });
    await handler(form);
    const row = form.edits[0].components[0].toJSON();
    return {
      start,
      form,
      share: row.components[0].custom_id,
      discard: row.components[1].custom_id,
    };
  };
  return {
    handler,
    interaction,
    preview,
    events,
    sent,
    channel,
    guild,
    members,
    drafts,
    advance: (ms) => {
      now += ms;
      prune();
    },
  };
}

test("UI uses current Label-wrapped text inputs; guild command; bounded IDs", () => {
  const ui = modal("a".repeat(36), "tr").toJSON();
  assert.equal(ui.components.length, 4);
  assert.ok(ui.custom_id.length < 100);
  for (const field of ui.components) {
    assert.equal(field.type, 18);
    assert.equal(field.component.type, 4);
    assert.ok(field.label.length <= 45);
    assert.ok(field.description.length <= 100);
  }
  assert.deepEqual(command.toJSON().contexts, [0]);
  assert.deepEqual(command.toJSON().integration_types, [0]);
});
test("full preview/share flow defers first and fetches fresh permissions before one send", async () => {
  const f = fixture();
  const p = await f.preview();
  assert.equal(p.form.deferFlags, MessageFlags.Ephemeral);
  assert.equal(f.sent.length, 0);
  assert.match(p.form.edits[0].content, /Private preview/);
  const click = f.interaction("button", { customId: p.share });
  await f.handler(click);
  assert.equal(f.sent.length, 1);
  assert.match(f.sent[0].content, /Total: \*\*8:00/);
  assert.ok(!f.sent[0].content.includes("Private preview"));
  assert.deepEqual(f.sent[0].allowedMentions, {
    parse: [],
    repliedUser: false,
  });
  assert.equal(f.sent[0].flags, MessageFlags.SuppressEmbeds);
  assert.ok(f.events.indexOf("deferUpdate") < f.events.indexOf("roles"));
  assert.ok(f.events.indexOf("roles") < f.events.indexOf("send"));
  assert.ok(f.events.includes("member:user"));
  assert.ok(f.events.includes("member:application"));
  assert.equal(f.drafts.size, 0);
  assert.deepEqual(click.edits.at(-1).components, []);
});
test("discard consumes without fetching roles or posting", async () => {
  const f = fixture();
  const p = await f.preview();
  await f.handler(f.interaction("button", { customId: p.discard }));
  assert.equal(f.drafts.size, 0);
  assert.equal(f.sent.length, 0);
  assert.ok(!f.events.includes("roles"));
});
test("concurrent share clicks cannot double-send", async () => {
  const f = fixture();
  const p = await f.preview();
  await Promise.all([
    f.handler(f.interaction("button", { customId: p.share })),
    f.handler(f.interaction("button", { customId: p.share })),
  ]);
  assert.equal(f.sent.length, 1);
});
for (const [name, mutate] of [
  [
    "different owner",
    (i) => {
      i.user = { id: "other" };
    },
  ],
  [
    "different channel",
    (i) => {
      i.channelId = "other";
    },
  ],
  [
    "different server",
    (i) => {
      i.guildId = "other";
    },
  ],
  [
    "different application",
    (i) => {
      i.applicationId = "other";
    },
  ],
  [
    "different message",
    (i) => {
      i.message.id = "other";
    },
  ],
  [
    "wrong author",
    (i) => {
      i.message.author.id = "other";
    },
  ],
  [
    "wrong webhook",
    (i) => {
      i.message.webhookId = "other";
    },
  ],
  [
    "public message",
    (i) => {
      i.message.flags = new MessageFlagsBitField(0);
    },
  ],
  [
    "malformed ID",
    (i) => {
      i.customId = "ss:share:invalid";
    },
  ],
])
  test(`forged preview rejected: ${name}`, async () => {
    const f = fixture();
    const p = await f.preview();
    const i = f.interaction("button", { customId: p.share });
    mutate(i);
    await f.handler(i);
    assert.equal(f.sent.length, 0);
    assert.equal(i.replies[0].flags, MessageFlags.Ephemeral);
    await f.handler(f.interaction("button", { customId: p.share }));
    assert.equal(f.sent.length, 1);
  });
test("five-minute preview expires", async () => {
  const f = fixture();
  const p = await f.preview();
  f.advance(300000);
  await f.handler(f.interaction("button", { customId: p.share }));
  assert.equal(f.sent.length, 0);
  assert.equal(f.drafts.size, 0);
});
test("form cannot be submitted twice or in the wrong context", async () => {
  const f = fixture();
  const start = f.interaction("command");
  await f.handler(start);
  const customId = start.shown[0].custom_id;
  const wrong = f.interaction("modal", { customId, channelId: "other" });
  await f.handler(wrong);
  assert.equal(wrong.edits.length, 0);
  await f.handler(f.interaction("modal", { customId }));
  const repeat = f.interaction("modal", { customId });
  await f.handler(repeat);
  assert.equal(repeat.replies.length, 1);
});
test("input error removes form and never creates share controls", async () => {
  const f = fixture();
  const start = f.interaction("command");
  await f.handler(start);
  const bad = f.interaction("modal", {
    customId: start.shown[0].custom_id,
    fields: { getTextInputValue: () => "bad" },
  });
  await f.handler(bad);
  assert.equal(f.drafts.size, 0);
  assert.deepEqual(bad.edits.at(-1).components, []);
  assert.equal(f.sent.length, 0);
});
test("revoked user permission prevents sharing", async () => {
  const f = fixture();
  const p = await f.preview();
  f.channel.permissionsFor = (member) =>
    member.id === "user" ? new PermissionsBitField(0n) : permissions;
  await f.handler(f.interaction("button", { customId: p.share }));
  assert.equal(f.sent.length, 0);
  assert.equal(f.drafts.size, 0);
});
test("revoked bot permission prevents sharing", async () => {
  const f = fixture();
  const p = await f.preview();
  f.channel.permissionsFor = (member) =>
    member.id === "application" ? new PermissionsBitField(0n) : permissions;
  await f.handler(f.interaction("button", { customId: p.share }));
  assert.equal(f.sent.length, 0);
});
test("timed-out member cannot publish via bot", async () => {
  const f = fixture();
  const p = await f.preview();
  f.members.user.isCommunicationDisabled = () => true;
  await f.handler(f.interaction("button", { customId: p.share }));
  assert.equal(f.sent.length, 0);
});
test("deleted channel and changed channel type prevent sharing", async () => {
  for (const replacement of [null, { type: ChannelType.PublicThread }]) {
    const f = fixture();
    const p = await f.preview();
    f.guild.channels.fetch = async () => replacement;
    await f.handler(f.interaction("button", { customId: p.share }));
    assert.equal(f.sent.length, 0);
  }
});
test("failed fresh role/member lookup prevents any send and hides raw errors", async () => {
  const f = fixture();
  const p = await f.preview();
  f.guild.roles.fetch = async () => {
    throw new Error("PRIVATE-INTERACTION-BODY");
  };
  const click = f.interaction("button", { customId: p.share });
  await f.handler(click);
  assert.equal(f.sent.length, 0);
  assert.ok(!JSON.stringify(click.edits).includes("PRIVATE-INTERACTION-BODY"));
});
test("uncertain send failure is not retried and draft cannot be reused", async () => {
  const f = fixture();
  const p = await f.preview();
  let calls = 0;
  f.channel.send = async () => {
    calls++;
    throw new Error("PRIVATE-REST-BODY");
  };
  const i = f.interaction("button", { customId: p.share });
  await f.handler(i);
  await f.handler(f.interaction("button", { customId: p.share }));
  assert.equal(calls, 1);
  assert.ok(!JSON.stringify(i.edits).includes("PRIVATE-REST-BODY"));
  assert.match(i.edits.at(-1).content, /inspect the channel/);
});
test("channel share cooldown applies across users", async () => {
  const f = fixture();
  const p = await f.preview();
  await f.handler(f.interaction("button", { customId: p.share }));
  f.advance(5000);
  const second = await f.preview("other");
  await f.handler(
    f.interaction("button", {
      customId: second.share,
      user: { id: "other" },
    }),
  );
  assert.equal(f.sent.length, 1);
  f.advance(55000);
  const third = await f.preview();
  await f.handler(f.interaction("button", { customId: third.share }));
  assert.equal(f.sent.length, 2);
});

for (const delay of [0, 60, 61, 21600])
  test(`fresh channel slowmode ${delay} is enforced`, async () => {
    const f = fixture();
    const p = await f.preview();
    f.channel.rateLimitPerUser = delay;
    const click = f.interaction("button", { customId: p.share });
    await f.handler(click);
    assert.equal(f.sent.length, delay > 60 ? 0 : 1);
    if (delay > 60) assert.match(click.edits.at(-1).content, /slowmode/);
  });
test("rapid form calls are limited", async () => {
  const f = fixture();
  await f.handler(f.interaction("command"));
  const second = f.interaction("command");
  await f.handler(second);
  assert.equal(second.shown.length, 0);
  assert.equal(second.replies.length, 1);
});
for (const change of [
  { memberPermissions: new PermissionsBitField(0n) },
  { appPermissions: new PermissionsBitField(0n) },
  { channel: { type: ChannelType.PublicThread } },
  { channelId: null },
  { inCachedGuild: () => false },
])
  test(`initial guard ${Object.keys(change)[0]} rejects safely`, async () => {
    const f = fixture();
    const i = f.interaction("command", change);
    await f.handler(i);
    assert.equal(i.shown.length, 0);
    assert.equal(i.replies[0].flags, MessageFlags.Ephemeral);
  });
test("unrelated commands and unsupported interactions are ignored", async () => {
  const f = fixture();
  const i = f.interaction("command", { commandName: "other" });
  await f.handler(i);
  assert.equal(i.replies.length, 0);
  await f.handler(f.interaction("unsupported"));
});
