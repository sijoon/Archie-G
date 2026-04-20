import { NextResponse } from "next/server";

// Ollama: localhost:11434
// LM Studio: localhost:1234 (OpenAI-compatible)

export interface ProviderStatus {
  name: "ollama" | "lmstudio";
  label: string;
  available: boolean;
  models: string[];
  baseUrl: string;
}

async function checkOllama(): Promise<ProviderStatus> {
  const baseUrl = "http://localhost:11434";
  try {
    const res = await fetch(`${baseUrl}/api/tags`, {
      method: "GET",
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) throw new Error("Not OK");
    const data = await res.json();
    const models: string[] = (data.models || []).map((m: any) => m.name);
    return { name: "ollama", label: "Ollama", available: true, models, baseUrl };
  } catch {
    return { name: "ollama", label: "Ollama", available: false, models: [], baseUrl };
  }
}

async function checkLMStudio(): Promise<ProviderStatus> {
  const baseUrl = "http://localhost:1234";
  try {
    const res = await fetch(`${baseUrl}/v1/models`, {
      method: "GET",
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) throw new Error("Not OK");
    const data = await res.json();
    const models: string[] = (data.data || []).map((m: any) => m.id);
    return { name: "lmstudio", label: "LM Studio", available: true, models, baseUrl };
  } catch {
    return { name: "lmstudio", label: "LM Studio", available: false, models: [], baseUrl };
  }
}

export async function GET() {
  // Check both providers in parallel
  const [ollama, lmstudio] = await Promise.all([checkOllama(), checkLMStudio()]);

  const providers = [ollama, lmstudio];
  // Determine recommended default: first available one
  const recommended = providers.find((p) => p.available) || null;

  return NextResponse.json({
    providers,
    recommended: recommended
      ? { provider: recommended.name, model: recommended.models[0] ?? "" }
      : null,
    timestamp: new Date().toISOString(),
  });
}
