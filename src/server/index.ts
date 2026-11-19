import Fastify from "fastify";
import { config } from "./config.js";

const app = Fastify({ logger: false });

app.get("/api/health", async () => ({ ok: true, version: config.version }));

app.listen({ port: config.port, host: "127.0.0.1" }).then(() => {
  console.log(`[start] yui version=${config.version} port=${config.port} turnModel=${config.turnModel}`);
});
