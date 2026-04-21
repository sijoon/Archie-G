import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { parseSwiftCode } from "@/lib/parser";
import { streamLocalLLM, detectProvider, LLMConfig } from "@/lib/llm";

// ── Recursive File Scanner ────────────────────────────────────
function getFilesRecursively(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const stats = fs.statSync(dir);
  if (!stats.isDirectory()) return [dir];

  const files = fs.readdirSync(dir);
  const excludeDirs = ["node_modules", ".git", ".next", "dist", "build", "target", ".npm-cache"];
  const includeExts = [".swift", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".h", ".m", ".c", ".cpp"];

  for (const file of files) {
    if (excludeDirs.includes(file)) continue;
    const name = path.join(dir, file);
    try {
      if (fs.statSync(name).isDirectory()) {
        getFilesRecursively(name, fileList);
      } else {
        const ext = path.extname(file).toLowerCase();
        if (includeExts.includes(ext)) {
          fileList.push(name);
        }
      }
    } catch (err) {
      console.warn(`[Archie-G] Skip inaccessible path: ${name}`);
    }
  }
  return fileList;
}

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

    // 2. Resolve Path & Aggregate Content
    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: "Path not found" }, { status: 404 });
    }

    const files = getFilesRecursively(fullPath);
    if (files.length === 0) {
      return NextResponse.json({ error: "No relevant source files found" }, { status: 404 });
    }

    let combinedContent = "";
    let totalChars = 0;
    const MAX_CHARS = 150000; // ~40k tokens safety limit

    for (const f of files.slice(0, 50)) { // Max 50 files
      const relPath = path.relative(process.cwd(), f);
      const fileContent = fs.readFileSync(f, "utf-8");
      
      if (totalChars + fileContent.length > MAX_CHARS) {
        combinedContent += `\n\nFile: ${relPath} (Truncated due to size)\n---\n${fileContent.slice(0, 5000)}\n---`;
        break;
      }

      combinedContent += `\n\nFile: ${relPath}\n---\n${fileContent}\n---`;
      totalChars += fileContent.length;
    }

    // 3. AI Analysis Prompt (Strict Protocol Alignment per GEMINI.md)
    const prompt = `
### Task: Archie-G Local Project Architecture Analysis
Perform a hierarchical analysis (Leaf to Root) of the provided source files.
You are analyzing a PROJECT or DIRECTORY. Focus on relationships, bridges, and cross-file dependencies.

### Protocol 1: Language & Localization (Section 7)
- **Internal Reasoning**: Must be in English.
- **Final Deliverables ([코드 로직], [API 가이드], [보안 권고사항])**: MUST be written in Korean (한국어).
- **Diagrams (Mermaid)**: Use English for node labels and technical terms.

### Protocol 2: Multi-Chart Output Standards (STRICT SYNTAX)
You MUST output diagrams in the following format. 
CRITICAL: Mermaid v10.9.5 requires strict quoting for labels with special characters.

1. **MASTER_FLOW**: One high-level diagram.
   - Syntax Rule 1: ALWAYS use double quotes for node labels. (e.g., A["App Logic"])
   - Syntax Rule 2: ALWAYS use double quotes for edge labels. (e.g., -->|"postMessage(data)"|)
   - Syntax Rule 3: ALWAYS use double quotes for subgraph names. (e.g., subgraph "Native Side")
   - Format: 
   ### MASTER_FLOW
   \`\`\`mermaid
   [Mermaid code here]
   \`\`\`

2. **DETAIL_FLOWS**: Multiple detailed diagrams.
   - Same strict syntax rules apply.
   - **Format**:
   ### DETAIL_FLOW: [Component Name]
   \`\`\`mermaid
   [Mermaid code here]
   \`\`\`

### Protocol 3: Output Structure
- [코드 로직]
- [API 가이드]
- [보안 권고사항]
- Diagrams (using the headers above)
- [Self-QA Metrics]

### Source Files:
${combinedContent}
    `;

    // 5. Execute Streaming Analysis
    const stream = await streamLocalLLM(
      [{ role: "user", content: prompt }],
      llmConfig
    );

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Provider": llmConfig.provider,
        "X-Model": llmConfig.model,
      },
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
