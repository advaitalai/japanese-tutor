import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { BetaMessageParam } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { YuiReply, type YuiModel, type YuiRequest } from "./reply.js";

/** Yui on Claude: low effort for speed, structured output, cached system prompt, refusal fallback. */
export class ClaudeYui implements YuiModel {
  constructor(
    private client: Anthropic,
    private model: string,
  ) {}

  async reply(req: YuiRequest): Promise<YuiReply> {
    const messages: BetaMessageParam[] = req.history.map((h) => ({
      role: h.role === "learner" ? ("user" as const) : ("assistant" as const),
      content: h.text,
    }));
    messages.push({ role: "user", content: req.heard });
    if (req.notes.length) messages.push({ role: "system", content: `App notes for this turn:\n- ${req.notes.join("\n- ")}` });

    const res = await this.client.beta.messages.parse({
      model: this.model,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [
        { type: "text", text: req.system, cache_control: { type: "ephemeral" } },
        { type: "text", text: req.learner, cache_control: { type: "ephemeral" } },
      ],
      messages,
      output_config: { effort: "low", format: zodOutputFormat(YuiReply) },
    });
    if (res.stop_reason === "refusal" || !res.parsed_output) {
      throw new YuiUnavailable(res.stop_reason === "refusal" ? "refusal" : "unparsed");
    }
    return res.parsed_output;
  }
}

export class YuiUnavailable extends Error {}
