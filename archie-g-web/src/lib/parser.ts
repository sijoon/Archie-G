export interface SwiftSymbol {
  name: string;
  type: "class" | "struct" | "func" | "extension";
  depth: "Root" | "Leaf";
  body?: string;
  calls: string[];
}

export function parseSwiftCode(content: string): SwiftSymbol[] {
  const symbols: SwiftSymbol[] = [];
  
  // Root Level: Classes, Structs, Extensions
  const typeMatches = Array.from(content.matchAll(/(class|struct|extension)\s+(\w+)/g));
  for (const match of typeMatches) {
    symbols.push({
      name: match[2],
      type: match[1] as any,
      depth: "Root",
      calls: []
    });
  }

  // Leaf Level: Functions
  const funcMatches = Array.from(content.matchAll(/func\s+(\w+)\s*\((.*?)\)/g));
  for (const match of funcMatches) {
    symbols.push({
      name: match[1],
      type: "func",
      depth: "Leaf",
      calls: []
    });
  }

  return symbols;
}
