/**
 * Gemini embeddings (server-side / build-script only). Used to build the knowledge index and to embed each
 * visitor question, so both live in the same vector space.
 *
 * Model: gemini-embedding-001 (stable, supports separate "document" and "query" task types).
 * We ask for 768 dimensions; for sizes other than 3072 the API does not normalise, so we do.
 */
import { GoogleGenAI } from "@google/genai";

export const EMBED_MODEL = "gemini-embedding-001";
export const EMBED_DIMS = 768;

export type EmbedTask = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

let client: GoogleGenAI | null = null;
function getClient(apiKey?: string): GoogleGenAI {
  const key = apiKey ?? process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  return (client ??= new GoogleGenAI({ apiKey: key }));
}

export function normalize(v: number[]): number[] {
  let sum = 0;
  for (const x of v) sum += x * x;
  const n = Math.sqrt(sum) || 1;
  return v.map((x) => x / n);
}

/** Cosine similarity of two unit-length vectors is just their dot product. */
export function cosine(a: number[], b: number[]): number {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) s += a[i] * b[i];
  return s;
}

/** One normalised vector per input text, in order. */
export async function embedTexts(
  texts: string[],
  task: EmbedTask,
  opts: { signal?: AbortSignal; apiKey?: string } = {}
): Promise<number[][]> {
  const res = await getClient(opts.apiKey).models.embedContent({
    model: EMBED_MODEL,
    contents: texts,
    config: { taskType: task, outputDimensionality: EMBED_DIMS, abortSignal: opts.signal },
  });
  const vectors = (res.embeddings ?? []).map((e) => e.values ?? []);
  if (vectors.length !== texts.length || vectors.some((v) => v.length !== EMBED_DIMS)) {
    throw new Error(`embedding response did not match the request (${vectors.length} vectors for ${texts.length} texts)`);
  }
  return vectors.map(normalize);
}
