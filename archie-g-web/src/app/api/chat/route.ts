import { NextRequest } from "next/server";
import { streamLocalLLM, detectProvider, LLMConfig } from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// maxDuration is only relevant on Vercel — in local dev, there is no built-in cap
// when using streaming responses (the connection stays open until the stream closes)

export async function POST(req: NextRequest) {
  const { messages, provider, model } = await req.json();

  // Auto-detect provider if not specified
  let llmConfig: LLMConfig;
  if (provider && model) {
    llmConfig = { provider, model };
  } else {
    const detected = await detectProvider();
    if (!detected) {
      return new Response(
        JSON.stringify({ error: "No LLM provider available. Start Ollama or LM Studio." }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }
    llmConfig = detected;
  }

  // Prepend system prompt (GEMINI.md bilingual protocol)
  const systemMessage = {
    role: "system" as const,
    content: `당신은 Archie-G입니다 — 하이브리드 모바일 코드베이스(iOS Swift / Android Kotlin / Web)를 전문으로 분석하는 AI 아키텍처 에이전트입니다.

응답 프로토콜:
- 최종 답변은 반드시 한국어로 작성합니다.
- 기술 용어는 영어 원문을 유지합니다 (WKWebView, Bridge, ViewModel 등).
- 불확실한 내용은 [??]로 표시합니다.
- 답변은 명확하고 구조화된 형태로 제공합니다.

전문 영역: iOS Swift, WKWebView Bridge, Android JavascriptInterface, 하이브리드 앱 아키텍처, API 설계, 코드 보안`,
  };

  const fullMessages = [systemMessage, ...messages];

  try {
    // Get a streaming ReadableStream from the LLM — no timeout applied
    const stream = await streamLocalLLM(fullMessages, llmConfig);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache, no-store",
        "X-Provider": llmConfig.provider,
        "X-Model": llmConfig.model,
      },
    });
  } catch (err: any) {
    const isOffline = err.message?.includes("ECONNREFUSED") || err.message?.includes("fetch failed");
    return new Response(
      JSON.stringify({
        error: isOffline
          ? "LLM 연결 실패: Ollama 또는 LM Studio를 실행해 주세요."
          : err.message,
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}
