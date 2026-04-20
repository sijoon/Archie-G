import { NextRequest, NextResponse } from "next/server";
import { promptLocalLLM, detectProvider, LLMConfig } from "@/lib/llm";
import { maskSensitiveInfo } from "@/lib/harness";

export async function POST(req: NextRequest) {
  try {
    const { prompt, context, provider, model } = await req.json();

    // 1. Auto-detect provider if not specified
    let llmConfig: LLMConfig;
    if (provider && model) {
      llmConfig = { provider, model };
    } else {
      const detected = await detectProvider();
      if (!detected) {
        return NextResponse.json(
          { error: "No LLM provider available. Please start Ollama or LM Studio." },
          { status: 503 }
        );
      }
      llmConfig = detected;
    }

    // 2. Specialized Coding Mode Prompt (Section 8 Harness)
    const codingSystemPrompt = `
당신은 Archie-G 코딩 에이전트입니다. 다음 규칙을 엄격히 준수하여 코드를 생성하세요.

### 코드 생성 5대 규칙 (Section 8)
1. 피드백 우선 원칙: 아래 제공되는 [사용자 피드백]을 최우선으로 반영합니다.
2. 가이드 준수 원칙: 제공된 라이브러리 API 규약을 반드시 지킵니다.
3. 구조 보존 원칙: 프로젝트의 기존 아키텍처 패턴을 유지합니다.
4. 주석 의무화: 생성 근거를 한국어 주석으로 상세히 남깁니다.
5. 언어 로컬라이제이션: 코드는 영어, 주석 및 설명은 한국어로 작성합니다.

### 자가 검증 체크리스트
- ✅/❌ 피드백 반영 여부
- ✅/❌ API 가이드 준수 여부
- ✅/❌ 기존 구조 보존 여부
- ✅/❌ 한국어 주석 포함 여부

### 입력 데이터:
[사용자 요청]: ${prompt}
[관련 컨텍스트]: ${context}
    `;

    // 3. Generate Code
    const rawResult = await promptLocalLLM(codingSystemPrompt, llmConfig);

    // 4. Security Masking
    const securedResult = maskSensitiveInfo(rawResult);

    return NextResponse.json({
      code: securedResult,
      provider: llmConfig.provider,
      model: llmConfig.model,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    const msg = error?.message ?? "Unknown error";
    const isConnection = msg.includes("ECONNREFUSED") || msg.includes("fetch failed");
    return NextResponse.json(
      {
        error: isConnection
          ? "LLM 연결 실패: Ollama 또는 LM Studio를 실행해 주세요."
          : msg,
      },
      { status: isConnection ? 503 : 500 }
    );
  }
}
