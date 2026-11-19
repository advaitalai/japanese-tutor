import Anthropic from "@anthropic-ai/sdk";
import { config } from "./config.js";
import { openDb } from "./db/index.js";
import { Language, loadSyllabus } from "./language/index.js";
import { loadTokenizer } from "./language/tokenizer.js";
import { TurnEngine } from "./turn/engine.js";
import { ClaudeYui } from "./turn/claude.js";
import { buildApp } from "./app.js";
import { log } from "./log.js";

const db = openDb(config.dbPath);
const syllabus = loadSyllabus();
await loadTokenizer();
const engine = new TurnEngine(db, new Language(syllabus), new ClaudeYui(new Anthropic(), config.turnModel));
const app = buildApp({ db, engine, access: { require: config.requireAccess, allowedEmail: config.allowedEmail }, clientDir: "dist/client" });

await app.listen({ port: config.port, host: "127.0.0.1" });
log("start", `yui version=${config.version} port=${config.port} model=${config.turnModel} syllabus=${syllabus.version} items=${syllabus.items.length} access=${config.requireAccess ? "on" : "off"}`);
