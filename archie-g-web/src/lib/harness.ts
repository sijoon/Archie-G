export function maskSensitiveInfo(text: string): string {
  // Comprehensive masking for IP addresses (IPv4 & partial IPv6 support)
  let masked = text.replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, "[IP]");
  
  // Mask Emails (PII)
  masked = masked.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[EMAIL]");

  // Mask sensitive keys and tokens with better context matching
  const sensitivePatterns = [
    /(api[_-]?key|secret|token|password|auth|credential)[\s:=]+["']?([a-zA-Z0-9_\-]{12,})["']?/gi,
    /bearer\s+([a-zA-Z0-9_\-\.]{20,})/gi
  ];
  
  sensitivePatterns.forEach(pattern => {
    masked = masked.replace(pattern, (match, p1, p2) => {
      return match.replace(p2 ? p2 : match, "[MASKED]");
    });
  });

  return masked;
}

export function validateMermaid(code: string): boolean {
  const normalized = code.toLowerCase();
  const validTypes = ["graph", "sequencediagram", "classdiagram", "statediagram", "erdiagram"];
  
  if (!validTypes.some(type => normalized.includes(type))) {
    return false;
  }
  
  const openBrackets = (code.match(/\{/g) || []).length;
  const closeBrackets = (code.match(/\}/g) || []).length;
  
  return openBrackets === closeBrackets;
}

export async function runVerificationLoop(
  rawResult: string, 
  validateFn: (content: string) => boolean,
  retryFn: (lastResult: string) => Promise<string>
): Promise<string> {
  let result = rawResult;
  
  // Protocol: Verify and Self-Correct (Max 1 retry as per GEMINI.md)
  if (!validateFn(result)) {
    console.warn("[Archie-G] Protocol Violation: Invalid Mermaid Syntax. Initiating Self-Correction...");
    result = await retryFn(result);
  }
  
  return maskSensitiveInfo(result);
}
