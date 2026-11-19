import type { DB } from "../db/index.js";
import type { Language } from "../language/index.js";
import type { Mode, Seg } from "../../shared/types.js";
import { dayKey, daysBetween } from "../../shared/day.js";
import { isGoodbye } from "../rules/goodbye.js";
import { isHowDoISay } from "../rules/sidebar.js";
import { filterFixes } from "../rules/fixFilter.js";
import { activeSeconds } from "../learning/activeTime.js";
import { SYSTEM_PROMPT, learnerBlock, type LearnerState } from "./prompt.js";
import type { Exchange, YuiModel, YuiReply } from "./reply.js";
import { log } from "../log.js";

export interface Part {
  lang: "ja" | "en";
  text: string;
  segs?: Seg[];
  romaji?: string;
}

export interface FixOut {
  wrong: string;
  right: Seg[];
  why: string;
}

export interface TurnResult {
  day: string;
  mode: Mode;
  heard: string;
  parts: Part[];
  slow: boolean;
  fixes: FixOut[];
  sessionDone: boolean;
}

export const LOW_CONFIDENCE = 0.6;

export class TurnEngine {
  constructor(
    private db: DB,
    private lang: Language,
    private yui: YuiModel,
    private now: () => Date = () => new Date(),
  ) {}

  /** His turn: text from speech-to-text and its confidence (1 when typed). */
  async turn(heard: string, confidence = 1): Promise<TurnResult> {
    const t0 = Date.now();
    const at = this.now();
    const day = dayKey(at);
    const prevMode = this.lastYuiMode(day);

    // Rules that never depend on the model.
    const goodbye = prevMode !== "sidebar" && isGoodbye(heard);
    const forceSidebar = !goodbye && isHowDoISay(heard);
    const notes: string[] = [];
    if (goodbye) notes.push('He said goodbye. Reply with a warm short goodbye, mode "end".');
    if (forceSidebar) notes.push('He is asking how to say something in Japanese. Answer in sidebar mode.');
    notes.push(...this.targetNotes(day));

    const reply = await this.yui.reply({
      system: SYSTEM_PROMPT,
      learner: learnerBlock(this.learnerState(day)),
      history: this.history(day),
      heard,
      notes,
    });
    const tModel = Date.now();

    const mode: Mode = goodbye ? "end" : forceSidebar ? "sidebar" : reply.mode === "end" ? "chat" : reply.mode;
    const lowConfidence = confidence < LOW_CONFIDENCE;
    const proposed = reply.fixes.map((f) => ({ ...f, right: [{ t: f.right }] as Seg[] }));
    const { kept, dropped } = filterFixes({ mode, heard, lowConfidence, fixes: proposed });
    for (const d of dropped) log("fix", `dropped reason=${d.reason} wrong=${d.fix.wrong} right=${d.fix.right[0]?.t}`);

    const parts = await Promise.all(
      reply.parts.map(async (p): Promise<Part> => {
        if (p.lang === "en") return p;
        const c = await this.lang.caption(p.text);
        return { ...p, segs: c.segs, romaji: c.romaji };
      }),
    );
    const fixes = await Promise.all(
      kept.map(async (f) => ({ wrong: f.wrong, right: (await this.lang.caption(f.right[0]!.t)).segs, why: f.why, tag: this.resolveTag(f.tag ?? "", day) })),
    );

    this.save({ day, at, heard, confidence, reply, mode, parts, fixes });
    log("heard", `day=${day} conf=${confidence.toFixed(2)} text=${heard}`);
    log("yui", `mode=${mode} parts=${parts.length} fixes=${fixes.length} model_ms=${tModel - t0} total_ms=${Date.now() - t0}`);
    return { day, mode, heard, parts, slow: reply.slow, fixes: fixes.map(({ tag: _t, ...f }) => f), sessionDone: mode === "end" };
  }

  /** First words of the day, or ever. Not stored as his turn. */
  async open(): Promise<TurnResult | undefined> {
    const at = this.now();
    const day = dayKey(at);
    if (this.countTurns(day) > 0) return undefined;
    const first = this.countAllTurns() === 0;
    const reply = await this.yui.reply({
      system: SYSTEM_PROMPT,
      learner: learnerBlock(this.learnerState(day)),
      history: [],
      heard: first ? "(He opened the app for the first time.)" : "(He opened the app.)",
      notes: [
        first
          ? "Say hello in one short line, introduce yourself, and ask one easy question."
          : "Greet him back warmly, knowing how long it has been and what you last talked about. One easy question.",
      ],
    });
    const parts = await Promise.all(
      reply.parts.map(async (p): Promise<Part> => (p.lang === "en" ? p : { ...p, ...(await this.lang.caption(p.text)) })),
    );
    const clean = parts.map(({ lang, text, segs, romaji }) => ({ lang, text, segs, romaji }));
    this.insertTurn({ day, at, speaker: "yui", mode: "chat", text: joinText(reply), parts: clean });
    this.touchSession(day, at);
    return { day, mode: "chat", heard: "", parts: clean, slow: false, fixes: [], sessionDone: false };
  }

  // ---- state ----

  private lastYuiMode(day: string): Mode | undefined {
    const r = this.db.prepare(`SELECT mode FROM turns WHERE day=? AND speaker='yui' ORDER BY id DESC LIMIT 1`).get(day) as
      | { mode: Mode }
      | undefined;
    return r?.mode;
  }

  private history(day: string): Exchange[] {
    const rows = this.db.prepare(`SELECT speaker, text FROM turns WHERE day=? ORDER BY id`).all(day) as { speaker: string; text: string }[];
    const out: Exchange[] = [];
    for (const r of rows) {
      const role = r.speaker === "learner" ? "learner" : "yui";
      // The API needs a user turn first: Yui's opening line becomes context for the first exchange.
      if (out.length === 0 && role === "yui") out.push({ role: "learner", text: "(He opened the app.)" });
      out.push({ role, text: r.text });
    }
    return out;
  }

  private targetNotes(day: string): string[] {
    const plan = this.db.prepare(`SELECT targets_json FROM plans WHERE day=?`).get(day) as { targets_json: string } | undefined;
    if (!plan) return [];
    const targets = JSON.parse(plan.targets_json) as { itemId: string }[];
    const used = new Set(
      (this.db.prepare(`SELECT DISTINCT item FROM uses WHERE day=? AND correct=1`).all(day) as { item: string }[]).map((r) => r.item),
    );
    const left = targets.filter((t) => !used.has(t.itemId)).map((t) => t.itemId);
    const done = targets.filter((t) => used.has(t.itemId)).map((t) => t.itemId);
    return [`Targets used so far: ${done.join(", ") || "none"}. Still to work in: ${left.join(", ") || "none"}.`];
  }

  learnerState(day: string): LearnerState {
    const last = this.db.prepare(`SELECT day, topic FROM sessions WHERE day < ? ORDER BY day DESC LIMIT 1`).get(day) as
      | { day: string; topic: string | null }
      | undefined;
    const plan = this.db.prepare(`SELECT targets_json, plan_text FROM plans WHERE day=?`).get(day) as
      | { targets_json: string; plan_text: string }
      | undefined;
    const byId = new Map(this.lang.syllabus.items.map((i) => [i.id, i]));
    const targets = plan
      ? (JSON.parse(plan.targets_json) as { itemId: string; slot: string }[]).map((t) => ({ id: t.itemId, slot: t.slot, form: byId.get(t.itemId)?.form ?? t.itemId }))
      : [];
    const learning = (this.db.prepare(`SELECT DISTINCT item FROM evidence WHERE correct > 0 ORDER BY day DESC LIMIT 60`).all() as { item: string }[]).map(
      (r) => byId.get(r.item)?.form ?? r.item,
    );
    const recentFixes = (this.db.prepare(`SELECT wrong, right_json FROM fixes ORDER BY id DESC LIMIT 10`).all() as { wrong: string; right_json: string }[]).map(
      (f) => `${f.wrong} → ${(JSON.parse(f.right_json) as Seg[]).map((s) => s.t).join("")}`,
    );
    const asked = (this.db.prepare(`SELECT item FROM asked ORDER BY id DESC LIMIT 15`).all() as { item: string }[]).map((r) => r.item);
    const mem = this.db.prepare(`SELECT kind, text FROM memory ORDER BY id`).all() as { kind: string; text: string }[];
    return {
      level: "N5",
      daysSinceLastChat: last ? daysBetween(last.day, day) : undefined,
      lastTopic: last?.topic ?? undefined,
      plan: plan?.plan_text,
      targets,
      learning,
      recentFixes,
      asked,
      facts: mem.filter((m) => m.kind === "fact").map((m) => m.text),
      topics: mem.filter((m) => m.kind === "topic").map((m) => m.text),
    };
  }

  /**
   * A fix's tag as an item id: a syllabus id, a syllabus word by its form, or else one of his
   * own items (a word outside the lists, like 解約).
   */
  resolveTag(tag: string, day: string): string {
    const t = tag.trim();
    if (!t) return "";
    const items = this.lang.syllabus.items;
    if (items.some((i) => i.id === t)) return t;
    if (items.some((i) => i.id === `g:${t}`)) return `g:${t}`;
    const word = this.lang.index.byForm.get(t)?.[0] ?? this.lang.index.byReading.get(t)?.[0];
    if (word) return word.id;
    const grammar = items.find((i) => i.kind === "grammar" && i.form.replace(/^〜/, "") === t.replace(/^〜/, ""));
    if (grammar) return grammar.id;
    const id = `o:${t}`;
    this.db.prepare(`INSERT OR IGNORE INTO own_items (id, form, first_day) VALUES (?,?,?)`).run(id, t, day);
    return id;
  }

  // ---- saving ----

  private save(x: {
    day: string; at: Date; heard: string; confidence: number; reply: YuiReply; mode: Mode;
    parts: Part[]; fixes: { wrong: string; right: Seg[]; why: string; tag: string }[];
  }) {
    const { db } = this;
    db.transaction(() => {
      const learnerId = this.insertTurn({
        day: x.day, at: x.at, speaker: "learner", mode: x.mode === "end" ? "chat" : x.mode, text: x.heard,
        confidence: x.confidence, jpAttempt: x.reply.jp_attempt,
      });
      for (const f of x.fixes) {
        db.prepare(`INSERT INTO fixes (turn_id, day, wrong, right_json, why, tag) VALUES (?,?,?,?,?,?)`).run(
          learnerId, x.day, f.wrong, JSON.stringify(f.right), f.why, f.tag,
        );
      }
      if (x.mode === "sidebar") {
        for (const a of x.reply.asked) db.prepare(`INSERT INTO asked (turn_id, day, item) VALUES (?,?,?)`).run(learnerId, x.day, a);
      }
      this.insertTurn({ day: x.day, at: new Date(x.at.getTime() + 1), speaker: "yui", mode: x.mode, text: joinText(x.reply), parts: x.parts, slow: x.reply.slow });
      this.touchSession(x.day, x.at);
    })();
    if (x.mode === "chat" && x.reply.jp_attempt) void this.recordUses(x.day, x.heard, x.fixes.map((f) => f.tag));
  }

  /** Items he used in this turn. An item a kept fix is tagged with counts as wrong, not correct. */
  private async recordUses(day: string, heard: string, fixTags: string[]) {
    const lastTurn = this.db.prepare(`SELECT id FROM turns WHERE day=? AND speaker='learner' ORDER BY id DESC LIMIT 1`).get(day) as { id: number };
    const used = await this.lang.itemsUsed(heard);
    const wrong = new Set(fixTags);
    const ins = this.db.prepare(`INSERT INTO uses (turn_id, day, item, correct) VALUES (?,?,?,?)`);
    this.db.transaction(() => {
      for (const item of used) ins.run(lastTurn.id, day, item, wrong.has(item) ? 0 : 1);
    })();
  }

  private insertTurn(t: {
    day: string; at: Date; speaker: "learner" | "yui"; mode: Mode; text: string;
    parts?: Part[]; confidence?: number; jpAttempt?: boolean; slow?: boolean;
  }): number {
    const r = this.db
      .prepare(`INSERT INTO turns (day, at, speaker, mode, text, parts_json, confidence, jp_attempt, slow) VALUES (?,?,?,?,?,?,?,?,?)`)
      .run(t.day, t.at.toISOString(), t.speaker, t.mode, t.text, t.parts ? JSON.stringify(t.parts) : null, t.confidence ?? null,
        t.jpAttempt === undefined ? null : t.jpAttempt ? 1 : 0, t.slow ? 1 : 0);
    return Number(r.lastInsertRowid);
  }

  private touchSession(day: string, at: Date) {
    const times = (this.db.prepare(`SELECT at FROM turns WHERE day=?`).all(day) as { at: string }[]).map((r) => new Date(r.at));
    this.db
      .prepare(
        `INSERT INTO sessions (day, started_at, last_at, active_seconds) VALUES (?,?,?,?)
         ON CONFLICT(day) DO UPDATE SET last_at=excluded.last_at, active_seconds=excluded.active_seconds`,
      )
      .run(day, at.toISOString(), at.toISOString(), activeSeconds(times));
  }

  private countTurns(day: string): number {
    return (this.db.prepare(`SELECT COUNT(*) n FROM turns WHERE day=?`).get(day) as { n: number }).n;
  }
  private countAllTurns(): number {
    return (this.db.prepare(`SELECT COUNT(*) n FROM turns`).get() as { n: number }).n;
  }
}

const joinText = (r: { parts: { text: string }[] }) => r.parts.map((p) => p.text).join(" ");
