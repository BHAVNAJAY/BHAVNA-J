import { withBase } from "./base";

/**
 * Where the chat widget sends questions.
 * - NEXT_PUBLIC_CHAT_API_URL set  → that server (needed when the site is a static export, e.g. GitHub Pages).
 * - static export without it      → null: the widget still shows, but replies that no server is connected yet.
 * - normal Next server (dev/Vercel) → this site's own /api/chat.
 * Only the URL is public; the Gemini key stays on the server.
 */
export function chatEndpoint(): string | null {
  const external = process.env.NEXT_PUBLIC_CHAT_API_URL;
  if (external) return `${external.replace(/\/$/, "")}/api/chat`;
  if (process.env.NEXT_PUBLIC_STATIC_EXPORT === "1") return null;
  return withBase("/api/chat");
}
