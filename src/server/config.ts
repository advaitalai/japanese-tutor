// The only file that reads process.env for settings (playbook rule).
export const config = {
  port: Number(process.env.PORT ?? 8787),
  dbPath: process.env.DB_PATH ?? "data/yui.db",
  dataDir: process.env.DATA_DIR ?? "data",
  version: process.env.APP_VERSION ?? "dev",
  // Cloudflare Access puts the signed-in email in this header; only this account may use the app.
  allowedEmail: process.env.ALLOWED_EMAIL ?? "",
  requireAccess: process.env.REQUIRE_ACCESS === "1",
  turnModel: process.env.TURN_MODEL ?? "claude-opus-5-5",
  gradingModel: process.env.GRADING_MODEL ?? "claude-opus-5-5",
} as const;
