import { z } from "zod/v4";

// What Yui returns each turn. Readings and romaji are NOT asked for: the tokenizer makes them.
export const YuiReply = z.object({
  mode: z.enum(["chat", "sidebar", "end"]),
  parts: z.array(z.object({ lang: z.enum(["ja", "en"]), text: z.string() })),
  slow: z.boolean(),
  fixes: z.array(
    z.object({
      wrong: z.string(),
      right: z.string(),
      why: z.string(),
      tag: z.string(),
    }),
  ),
  asked: z.array(z.string()),
  jp_attempt: z.boolean(),
});
export type YuiReply = z.infer<typeof YuiReply>;

export interface Exchange {
  role: "learner" | "yui";
  text: string; // his words, or Yui's parts joined
}

export interface YuiRequest {
  system: string; // stable, cached
  learner: string; // stable for the day, cached
  history: Exchange[];
  heard: string;
  notes: string[]; // this turn's notes from code (forced mode, targets left)
}

/** The model behind Yui. The real one calls Claude; tests use a script. */
export interface YuiModel {
  reply(req: YuiRequest): Promise<YuiReply>;
}
