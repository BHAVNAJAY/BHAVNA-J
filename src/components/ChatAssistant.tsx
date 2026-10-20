"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ArrowUp, Sparkles, X } from "lucide-react";
import { chatEndpoint } from "@/lib/chatEndpoint";
import styles from "@/styles/chat.module.css";

type Msg = { id: number; role: "user" | "assistant"; text: string; error?: boolean };

const MAX_CHARS = 600;
const SUGGESTIONS = [
  "Tell me about Bhavna's projects",
  "What are her strongest skills?",
  "Explain her AI/ML experience",
  "What makes her different?",
];
const INTRO =
  "Hi! I'm Bhavna's AI assistant. Ask me about her projects, skills, experience and achievements. I only share what's in her portfolio, and I'll say so when something isn't documented.";

/** Tiny, safe formatter for the replies: paragraphs, "- " bullets and **bold** (no HTML is ever injected). */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? <strong key={i}>{part.slice(2, -2)}</strong> : part
  );
}

function Rich({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <>
      {blocks.map((block, bi) => {
        const lines = block.split("\n").filter((l) => l.trim());
        if (lines.length && lines.every((l) => /^\s*[-*•]\s+/.test(l))) {
          return (
            <ul key={bi}>
              {lines.map((l, li) => (
                <li key={li}>{inline(l.replace(/^\s*[-*•]\s+/, ""))}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={bi}>
            {lines.map((l, li) => (
              <span key={li}>
                {li > 0 && <br />}
                {inline(l)}
              </span>
            ))}
          </p>
        );
      })}
    </>
  );
}

export default function ChatAssistant() {
  const endpoint = chatEndpoint();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const nextId = useRef(1);
  const abortRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // keep the newest message in view
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, busy, open]);

  // focus the box when the panel opens, hand focus back to the button when it closes
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape" && !document.querySelector("dialog[open]")) {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || busyRef.current) return;
      setInput("");
      if (!endpoint) {
        // Static build with no chat server connected: say so plainly (never a made-up answer).
        setMessages((m) => [
          ...m,
          { id: nextId.current++, role: "user", text },
          {
            id: nextId.current++,
            role: "assistant",
            text: "The AI assistant isn't connected on this version of the site yet. Please check back soon, or reach Bhavna through the links in the Contact section.",
            error: true,
          },
        ]);
        return;
      }
      busyRef.current = true;
      setBusy(true);

      const history = messages.filter((m) => !m.error).slice(-8).map((m) => ({ role: m.role, text: m.text }));
      setMessages((m) => [...m, { id: nextId.current++, role: "user", text }]);

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, history }),
          signal: ctrl.signal,
        });
        const data = (await res.json().catch(() => ({}))) as { answer?: string; error?: string };
        if (!res.ok || !data.answer) {
          throw new Error(data.error || "Something went wrong. Please try again.");
        }
        setMessages((m) => [...m, { id: nextId.current++, role: "assistant", text: data.answer as string }]);
      } catch (err) {
        if (ctrl.signal.aborted) return;
        const msg =
          err instanceof TypeError ? "I couldn't reach the assistant. Check your connection and try again." : (err as Error).message;
        setMessages((m) => [...m, { id: nextId.current++, role: "assistant", text: msg, error: true }]);
      } finally {
        busyRef.current = false;
        setBusy(false);
        inputRef.current?.focus();
      }
    },
    [endpoint, messages]
  );

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send(input);
    }
  };

  const started = messages.length > 0;

  return (
    <div className={styles.root} data-chat-root>
      {open && (
        <section
          className={styles.panel}
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          data-lenis-prevent
        >
          <header className={styles.head}>
            <span className={styles.avatar} aria-hidden>
              <Sparkles size={16} strokeWidth={1.8} />
            </span>
            <div className={styles.headText}>
              <h2 id={titleId}>Meet Bhavna&rsquo;s AI</h2>
              <p>Ask about her work &middot; powered by Gemini</p>
            </div>
            <button type="button" className={styles.close} onClick={close} aria-label="Close chat">
              <X size={18} />
            </button>
          </header>

          <div className={styles.log} ref={logRef} role="log" aria-live="polite" aria-label="Conversation" tabIndex={0}>
            <div className={`${styles.msg} ${styles.bot}`}>
              <p>{INTRO}</p>
            </div>
            {messages.map((m) => (
              <div key={m.id} className={`${styles.msg} ${m.role === "user" ? styles.me : styles.bot} ${m.error ? styles.err : ""}`}>
                {m.role === "user" ? <p>{m.text}</p> : <Rich text={m.text} />}
              </div>
            ))}
            {busy && (
              <div className={`${styles.msg} ${styles.bot}`} aria-label="Bhavna's AI is typing">
                <span className={styles.dots} aria-hidden>
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            )}
            {!started && (
              <div className={styles.chips}>
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => void send(s)} disabled={busy}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            className={styles.form}
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <label htmlFor={`${titleId}-in`} className="visually-hidden">
              Ask a question about Bhavna
            </label>
            <textarea
              id={`${titleId}-in`}
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
              onKeyDown={onKey}
              placeholder="Ask about her projects, skills…"
              rows={1}
              maxLength={MAX_CHARS}
              aria-busy={busy}
            />
            <button type="submit" className={styles.send} disabled={busy || !input.trim()} aria-label="Send question">
              <ArrowUp size={18} strokeWidth={2.2} />
            </button>
          </form>
          <p className={styles.note}>AI can make mistakes. Answers come only from Bhavna&rsquo;s portfolio.</p>
        </section>
      )}

      <button
        ref={buttonRef}
        type="button"
        className={styles.fab}
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-label={open ? "Close Bhavna's AI chat" : "Open Bhavna's AI chat"}
        data-open={open || undefined}
      >
        {open ? <X size={20} /> : <Sparkles size={20} strokeWidth={1.8} />}
        <span className={styles.fabLabel}>Ask Bhavna&rsquo;s AI</span>
      </button>
    </div>
  );
}
