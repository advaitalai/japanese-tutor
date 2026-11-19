import { beforeAll, describe, expect, it } from "vitest";
import Anthropic from "@anthropic-ai/sdk";
import { buildApp, plainError } from "../src/server/app.js";
import { loadTokenizer } from "../src/server/language/tokenizer.js";
import { reply, setup } from "./helpers.js";

beforeAll(async () => void (await loadTokenizer()), 30_000);

describe("API", () => {
  it("S31: refuses requests without Cloudflare Access's identity for his account", async () => {
    const { db, engine } = setup([reply({})]);
    const app = buildApp({ db, engine, access: { require: true, allowedEmail: "me@example.com" } });
    expect((await app.inject({ method: "GET", url: "/api/today" })).statusCode).toBe(403);
    const other = await app.inject({ method: "GET", url: "/api/today", headers: { "cf-access-authenticated-user-email": "x@example.com" } });
    expect(other.statusCode).toBe(403);
    const ok = await app.inject({ method: "GET", url: "/api/today", headers: { "cf-access-authenticated-user-email": "Me@Example.com" } });
    expect(ok.statusCode).toBe(200);
  });

  it("a turn returns parts, and today shows the thread with the summary line", async () => {
    const { db, engine } = setup([reply({ parts: [{ lang: "ja", text: "いいですね！" }] })]);
    const app = buildApp({ db, engine, access: { require: false, allowedEmail: "" }, now: () => new Date("2026-11-19T20:00:00+09:00") });
    const t = await app.inject({ method: "POST", url: "/api/turn", payload: { text: "映画を見ました" } });
    expect(t.json().parts[0].segs).toBeDefined();
    const today = (await app.inject({ method: "GET", url: "/api/today" })).json();
    expect(today.turns).toHaveLength(2);
    expect(today.summary).toBe("0 min · no fixes");
  });

  it("S32: errors in plain words, never vendor JSON", () => {
    const authErr = new Anthropic.AuthenticationError(401, { error: { type: "authentication_error" } }, "invalid x-api-key", new Headers());
    expect(plainError(authErr).message).toBe("Yui can't reply right now. The Claude key needs replacing.");
    expect(plainError(new Error("boom")).message).not.toContain("boom");
  });
});
