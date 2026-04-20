export type ProviderName = "ollama" | "lmstudio";

export interface LLMConfig {
  provider: ProviderName;
  model: string;
}

// ── Non-streaming: used by analysis/generate (no timeout) ─────
export async function promptLocalLLM(prompt: string, config: LLMConfig): Promise<string> {
  if (config.provider === "lmstudio") {
    const res = await fetch("http://localhost:1234/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        stream: false,
      }),
      // No AbortSignal — no timeout
    });
    if (!res.ok) throw new Error(`LM Studio HTTP ${res.status}`);
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? "";
  }

  // Ollama — use /api/generate (no timeout)
  const res = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: config.model, prompt, stream: false }),
  });
  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
  const data = await res.json();
  return data?.response ?? "";
}

// ── Streaming: used by chat route ─────────────────────────────
/**
 * Returns a ReadableStream of raw text tokens.
 * Uses OpenAI-compatible /v1/chat/completions for BOTH providers:
 *  - LM Studio: native OpenAI API
 *  - Ollama: also supports /v1/chat/completions (v0.1.14+)
 *
 * This avoids per-request timeouts by piping the upstream
 * stream directly back to the client.
 */
export async function streamLocalLLM(
  messages: { role: string; content: string }[],
  config: LLMConfig
): Promise<ReadableStream<Uint8Array>> {
  const base = config.provider === "lmstudio"
    ? "http://localhost:1234"
    : "http://localhost:11434";

  const endpoint = `${base}/v1/chat/completions`;

  // Both Ollama (v0.1.14+) and LM Studio support the OpenAI streaming API
  const upstream = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.model,
      messages,
      stream: true,
      temperature: 0.3,
    }),
    // No AbortSignal — stream until LLM finishes naturally
  });

  if (!upstream.ok || !upstream.body) {
    throw new Error(`LLM upstream error: HTTP ${upstream.status} ${upstream.statusText}`);
  }

  const encoder = new TextEncoder();

  // Transform the SSE stream → plain text token stream
  const transformStream = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      const text = new TextDecoder().decode(chunk);
      const lines = text.split("\n");

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") continue;

        try {
          const json = JSON.parse(payload);
          const token: string = json?.choices?.[0]?.delta?.content ?? "";
          if (token) {
            controller.enqueue(encoder.encode(token));
          }
        } catch {
          // Skip unparseable SSE chunks
        }
      }
    },
  });

  return upstream.body.pipeThrough(transformStream);
}

// ── Auto-detect (2s timeout only for probing) ─────────────────
export async function detectProvider(): Promise<LLMConfig | null> {
  // Check Ollama
  try {
    const r = await fetch("http://localhost:11434/api/tags", {
      signal: AbortSignal.timeout(2000),
    });
    if (r.ok) {
      const d = await r.json();
      const model: string = d.models?.[0]?.name ?? "llama3";
      return { provider: "ollama", model };
    }
  } catch {}

  // Check LM Studio
  try {
    const r = await fetch("http://localhost:1234/v1/models", {
      signal: AbortSignal.timeout(2000),
    });
    if (r.ok) {
      const d = await r.json();
      const model: string = d.data?.[0]?.id ?? "local-model";
      return { provider: "lmstudio", model };
    }
  } catch {}

  return null;
}
