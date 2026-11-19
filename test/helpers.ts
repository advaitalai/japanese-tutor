import { openDb } from "../src/server/db/index.js";
import { Language, loadSyllabus } from "../src/server/language/index.js";
import { TurnEngine } from "../src/server/turn/engine.js";
import type { YuiModel, YuiReply, YuiRequest } from "../src/server/turn/reply.js";

export const reply = (r: Partial<YuiReply>): YuiReply => ({
  mode: "chat", parts: [{ lang: "ja", text: "いいですね！" }], slow: false, fixes: [], asked: [], jp_attempt: true, ...r,
});

/** A scripted Yui: returns the next reply and records each request. */
export class FakeYui implements YuiModel {
  requests: YuiRequest[] = [];
  constructor(private script: YuiReply[]) {}
  async reply(req: YuiRequest) {
    this.requests.push(req);
    const next = this.script.shift();
    if (!next) throw new Error("FakeYui ran out of replies");
    return next;
  }
}

let lang: Language | undefined;
export function setup(script: YuiReply[], at = new Date("2026-11-19T20:00:00+09:00")) {
  const db = openDb(":memory:");
  lang ??= new Language(loadSyllabus());
  const yui = new FakeYui(script);
  let now = at;
  const engine = new TurnEngine(db, lang, yui, () => now);
  return { db, yui, engine, setNow: (d: Date) => (now = d) };
}

export const flush = () => new Promise((r) => setTimeout(r, 20));
