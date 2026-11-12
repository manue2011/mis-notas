import "server-only";
import { z } from "zod";
import { env } from "@/lib/env";

// Groq's OpenAI-compatible chat endpoint, called with fetch (no SDK).

const ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";
const TIMEOUT_MS = 45_000;

export class GroqError extends Error {
  constructor(
    message: string,
    readonly kind: "busy" | "failed",
  ) {
    super(message);
  }
}

const responseSchema = z.object({
  choices: z
    .array(z.object({ finish_reason: z.string().nullish(), message: z.object({ content: z.string().nullish() }) }))
    .min(1),
});

type Message = { role: "system" | "user"; content: string };

/** The model's answer, or a GroqError. */
export async function groqChat(messages: Message[], maxTokens: number): Promise<string> {
  const key = env().GROQ_API_KEY;
  if (!key) throw new GroqError("Groq is not configured", "failed");

  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.2,
        max_completion_tokens: maxTokens,
        // Some thinking to plan the page (low barely reorganises it); it counts against the limits.
        reasoning_effort: "medium",
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    throw new GroqError(`request failed: ${error instanceof Error ? error.message : error}`, "failed");
  }

  // Free plan limits (tokens per minute, requests per day).
  if (response.status === 429 || response.status === 503) throw new GroqError(`status ${response.status}`, "busy");
  if (!response.ok) throw new GroqError(`status ${response.status}: ${(await response.text()).slice(0, 300)}`, "failed");

  const parsed = responseSchema.safeParse(await response.json().catch(() => null));
  if (!parsed.success) throw new GroqError("unexpected response", "failed");
  const [choice] = parsed.data.choices;
  if (choice.finish_reason === "length") throw new GroqError("answer cut short", "failed");
  return choice.message.content ?? "";
}
