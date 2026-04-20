import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { parseSwiftCode } from "@/lib/parser";
import { promptLocalLLM, detectProvider, LLMConfig } from "@/lib/llm";
import { runVerificationLoop, validateMermaid } from "@/lib/harness";

export async function POST(req: NextRequest) {
  try {
    const { filePath, provider, model } = await req.json();

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

    // 2. Read File
    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    const content = fs.readFileSync(fullPath, "utf-8");

    // 3. Structural Analysis
    const symbols = parseSwiftCode(content);

    // 4. AI Analysis Prompt (Strict Protocol Alignment per GEMINI.md)
    const prompt = `
### Task: Archie-G Local Architecture Analysis
Perform a hierarchical analysis (Leaf to Root) of the provided Swift code.

### Protocol 1: Language & Localization (Section 7)
- **Internal Reasoning**: Must be in English.
- **Final Deliverables ([코드 로직], [API 가이드], [보안 권고사항])**: MUST be written in Korean (한국어).
- **Diagrams (Mermaid)**: Use English for node labels and technical terms.

### Protocol 2: Output Standards (Section 4)
- **Structure**: [코드 로직] + [API 가이드] + [보안 권고사항].
- **Hybrid Bridge**: If WKScriptMessage or bridge patterns are found, use Mermaid subgraphs.

### Protocol 3: Self-QA Metrics (Section 6)
At the end, provide:
1. 존재 확인: Yes/No
2. 로직 연속성: Yes/No
3. 문서 준수: Yes/No
4. 신뢰도: 0-100%

### Source Code:
\`\`\`swift
${content}
\`\`\`
    `;

    // 5. Execute & Verify
    const rawAnalysis = await promptLocalLLM(prompt, llmConfig);
    const result = await runVerificationLoop(
      rawAnalysis,
      validateMermaid,
      async (last) =>
        promptLocalLLM(
          `Fix Mermaid syntax or language protocol violation. Labels in English, text in Korean: ${last}`,
          llmConfig
        )
    );

    return NextResponse.json({
      symbols,
      analysis: result,
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
