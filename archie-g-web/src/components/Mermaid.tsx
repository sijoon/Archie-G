"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

export function Mermaid({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      mermaid.initialize({
        startOnLoad: false,
        theme: "dark",
        securityLevel: "loose",
        themeVariables: {
          darkMode: true,
          background: "transparent",
          primaryColor: "#8B5CF6",
          secondaryColor: "#3B82F6",
          tertiaryColor: "#1F2937",
          mainBkg: "rgba(255, 255, 255, 0.05)",
          nodeBorder: "rgba(255, 255, 255, 0.1)",
          lineColor: "rgba(255, 255, 255, 0.3)",
          fontFamily: "Inter, sans-serif",
          fontSize: "12px",
        },
      });
    }
  }, []);

  useEffect(() => {
    if (!chart || !containerRef.current) return;

    const renderChart = async () => {
      try {
        setError(null);
        // Targeted pre-processor: Fix node labels containing parentheses, line by line
        const cleanChart = (code: string) => {
          const lines = code
            .replace(/```mermaid/gi, "")
            .replace(/```/g, "")
            .trim()
            .split("\n");

          return lines.map((line) => {
            // Match node definitions: id[label], id(label), id{label}
            // Only fix if the label contains ( or ) and is NOT already quoted
            return line.replace(
              /([a-zA-Z0-9_-]+)([\[({])((?:[^"[\](){}]|\([^)]*\))*[\(\)]+(?:[^"[\](){}]|\([^)]*\))*)([\])}])/g,
              (match, id, open, label, close) => {
                // Skip if already quoted
                if (label.trimStart().startsWith('"')) return match;
                return `${id}${open}"${label.replace(/"/g, "'")}"${close}`;
              }
            );
          }).join("\n");
        };

        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, cleanChart(chart));
        setSvg(svg);
      } catch (err: any) {
        console.error("Mermaid render error:", err);
        setError(`Mermaid Syntax Error (v10.9.5): ${err.message || "Invalid syntax"}`);
      }
    };

    renderChart();
  }, [chart]);

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-[10px] text-red-400 font-mono">
        {error}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="mermaid-container flex justify-center py-4 bg-white/[0.01] rounded-2xl overflow-hidden"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
