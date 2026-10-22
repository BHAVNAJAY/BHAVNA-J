/**
 * Thin wrapper around the official Google Gen AI SDK (@google/genai). Server-side only.
 * The API key is read from GEMINI_API_KEY and never leaves the server.
 */
import { ApiError, GoogleGenAI, ThinkingLevel } from "@google/genai";
import type { ChatTurn } from "./chatValidation";

/**
 * Model id checked against https://ai.google.dev/gemini-api/docs/models — "gemini-3.5-flash-lite" is the
 * stable, fastest, most cost-effective current model. Override with GEMINI_MODEL (e.g. "gemini-3.8-flash"
 * for stronger answers) without touching code.
 */
export const DEFAULT_MODEL = "gemini-3.5-flash-lite";
const MAX_OUTPUT_TOKENS = 2048; // headroom: thinking models count reasoning tokens against this
const TIMEOUT_MS = 40_000;

export class ChatError extends Error {
  constructor(
    public status: 429 | 500 | 502 | 503 | 504,
    public publicMessage: string
  ) {
    super(publicMessage);
  }
}

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new ChatError(503, "The assistant isn't configured yet. Please try again later.");
  return (client ??= new GoogleGenAI({ apiKey }));
}

export async function generateAnswer(opts: { system: string; history: ChatTurn[]; message: string }): Promise<string> {
  const ai = getClient();
  const contents = [
    ...opts.history.map((t) => ({ role: t.role === "assistant" ? "model" : "user", parts: [{ text: t.text }] })),
    { role: "user", parts: [{ text: opts.message }] },
  ];

  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
      contents,
      config: {
        systemInstruction: opts.system,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        // Short factual Q&A over a small knowledge base does not need long reasoning; LOW keeps replies fast.
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        abortSignal: AbortSignal.timeout(TIMEOUT_MS),
      },
    });
    const text = response.text?.trim();
    if (!text) throw new ChatError(502, "I couldn't put an answer together for that. Could you rephrase the question?");
    return text;
  } catch (err) {
    if (err instanceof ChatError) throw err;
    if (err instanceof ApiError) {
      if (err.status === 429) throw new ChatError(429, "The assistant is busy right now. Please try again in a minute.");
      if (err.status === 400 || err.status === 401 || err.status === 403 || err.status === 404) {
        // bad key, wrong model id, blocked key… a configuration problem, not the visitor's fault
        throw new ChatError(503, "The assistant is temporarily unavailable.");
      }
      throw new ChatError(502, "The assistant ran into a problem. Please try again.");
    }
    if (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) {
      throw new ChatError(504, "That took too long. Please try again.");
    }
    throw new ChatError(502, "The assistant ran into a problem. Please try again.");
  }
}
