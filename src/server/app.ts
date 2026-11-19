import Fastify, { type FastifyInstance } from "fastify";
import fastifyStatic from "@fastify/static";
import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import type { DB } from "./db/index.js";
import type { TurnEngine } from "./turn/engine.js";
import { YuiUnavailable } from "./turn/claude.js";
import { dayKey } from "../shared/day.js";
import { summaryLine } from "../shared/summary.js";
import { log } from "./log.js";

export interface AppDeps {
  db: DB;
  engine: TurnEngine;
  access: { require: boolean; allowedEmail: string };
  clientDir?: string;
  now?: () => Date;
}

// S32: errors in plain words, never vendor JSON.
export function plainError(err: unknown): { status: number; message: string } {
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError)
    return { status: 503, message: "Yui can't reply right now. The Claude key needs replacing." };
  if (err instanceof Anthropic.RateLimitError) return { status: 503, message: "Yui is busy for a moment. Try again in a minute." };
  if (err instanceof Anthropic.APIConnectionError || err instanceof Anthropic.InternalServerError)
    return { status: 503, message: "Yui can't be reached right now. Try again in a minute." };
  if (err instanceof YuiUnavailable) return { status: 503, message: "Yui couldn't answer that one. Try saying it another way." };
  return { status: 500, message: "Something went wrong on Yui's side. Try again." };
}

export function buildApp(deps: AppDeps): FastifyInstance {
  const app = Fastify({ logger: false, bodyLimit: 10 * 1024 * 1024 });
  const now = deps.now ?? (() => new Date());

  // Cloudflare Access signs him in and adds this header. Only his account gets through.
  app.addHook("onRequest", async (req, reply) => {
    if (!deps.access.require || !req.url.startsWith("/api/")) return;
    const email = String(req.headers["cf-access-authenticated-user-email"] ?? "").toLowerCase();
    if (!email || email !== deps.access.allowedEmail.toLowerCase()) {
      log("access", `refused path=${req.url}`);
      return reply.code(403).send({ error: "Not signed in." });
    }
  });

  app.setErrorHandler((err, _req, reply) => {
    const e = plainError(err);
    log("error", `${e.status} ${err instanceof Error ? err.message : String(err)}`);
    reply.code(e.status).send({ error: e.message });
  });

  app.get("/api/health", async () => ({ ok: true }));

  app.get("/api/today", async () => {
    const day = dayKey(now());
    const turns = deps.db.prepare(`SELECT id, speaker, mode, text, parts_json, slow FROM turns WHERE day=? ORDER BY id`).all(day) as {
      id: number; speaker: string; mode: string; text: string; parts_json: string | null; slow: number;
    }[];
    const fixes = deps.db.prepare(`SELECT turn_id, wrong, right_json, why FROM fixes WHERE day=?`).all(day) as {
      turn_id: number; wrong: string; right_json: string; why: string;
    }[];
    const s = deps.db.prepare(`SELECT active_seconds, used_well FROM sessions WHERE day=?`).get(day) as
      | { active_seconds: number; used_well: number | null }
      | undefined;
    return {
      day,
      turns: turns.map((t) => ({
        id: t.id, speaker: t.speaker, mode: t.mode, text: t.text, slow: !!t.slow,
        parts: t.parts_json ? JSON.parse(t.parts_json) : undefined,
        fixes: fixes.filter((f) => f.turn_id === t.id).map((f) => ({ wrong: f.wrong, right: JSON.parse(f.right_json), why: f.why })),
      })),
      summary: s ? summaryLine({ minutes: s.active_seconds / 60, usedWell: s.used_well ?? undefined, fixes: fixes.length }) : undefined,
    };
  });

  app.post("/api/open", async () => (await deps.engine.open()) ?? { opened: false });

  app.post<{ Body: { text: string; confidence?: number } }>("/api/turn", async (req, reply) => {
    const text = String(req.body?.text ?? "").trim();
    if (!text) return reply.code(400).send({ error: "I didn't catch that. Try again." });
    return deps.engine.turn(text, req.body.confidence ?? 1);
  });

  if (deps.clientDir && fs.existsSync(deps.clientDir)) {
    app.register(fastifyStatic, { root: path.resolve(deps.clientDir) });
    app.setNotFoundHandler((req, reply) => (req.url.startsWith("/api/") ? reply.code(404).send({ error: "Not found" }) : reply.sendFile("index.html")));
  }
  return app;
}
