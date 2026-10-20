/** Request validation for /api/chat. Pure functions, no I/O. */
export const MAX_MESSAGE_CHARS = 600;
export const MAX_HISTORY_TURNS = 8;
export const MAX_HISTORY_CHARS = 1500;
export const MAX_BODY_BYTES = 16_000;

export type ChatTurn = { role: "user" | "assistant"; text: string };

export type ParsedChat =
  | { ok: true; message: string; history: ChatTurn[] }
  | { ok: false; status: 400 | 422; error: string };

// strip control characters (keep newline / tab) so odd input can't smuggle formatting into the prompt
const CONTROL = new RegExp("[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F]", "g");
const normalise = (s: string) => s.replace(CONTROL, "").trim();

export function parseChatRequest(body: unknown): ParsedChat {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, status: 400, error: "Request body must be a JSON object." };
  }
  const { message, history } = body as { message?: unknown; history?: unknown };

  if (typeof message !== "string") return { ok: false, status: 422, error: "Please include a message." };
  const text = normalise(message);
  if (!text) return { ok: false, status: 422, error: "Please type a question first." };
  if (text.length > MAX_MESSAGE_CHARS) {
    return { ok: false, status: 422, error: `Please keep questions under ${MAX_MESSAGE_CHARS} characters.` };
  }

  const turns: ChatTurn[] = [];
  if (history !== undefined) {
    if (!Array.isArray(history)) return { ok: false, status: 400, error: "History must be a list." };
    for (const t of history.slice(-MAX_HISTORY_TURNS)) {
      if (typeof t !== "object" || t === null) return { ok: false, status: 400, error: "Malformed history." };
      const { role, text: tt } = t as { role?: unknown; text?: unknown };
      if ((role !== "user" && role !== "assistant") || typeof tt !== "string") {
        return { ok: false, status: 400, error: "Malformed history." };
      }
      const clipped = normalise(tt).slice(0, MAX_HISTORY_CHARS);
      if (clipped) turns.push({ role, text: clipped });
    }
  }
  // Gemini requires the conversation to start with a user turn.
  while (turns.length && turns[0].role !== "user") turns.shift();

  return { ok: true, message: text, history: turns };
}
