import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface FileNode {
  name: string;
  path: string;
  isDir: boolean;
  children?: FileNode[];
}

function buildTree(dir: string, rootDir: string): FileNode[] {
  const nodes: FileNode[] = [];
  const files = fs.readdirSync(dir);
  const exclude = ["node_modules", ".git", ".next", "dist", "build", ".npm-cache"];

  for (const file of files) {
    if (exclude.includes(file)) continue;
    
    const fullPath = path.join(dir, file);
    const stats = fs.statSync(fullPath);
    const relPath = path.relative(rootDir, fullPath);

    const node: FileNode = {
      name: file,
      path: relPath,
      isDir: stats.isDirectory(),
    };

    if (node.isDir) {
      node.children = buildTree(fullPath, rootDir);
      // Optional: Sort so directories come first
      node.children.sort((a, b) => (b.isDir === a.isDir ? a.name.localeCompare(b.name) : b.isDir ? 1 : -1));
    }

    nodes.push(node);
  }

  return nodes.sort((a, b) => (b.isDir === a.isDir ? a.name.localeCompare(b.name) : b.isDir ? 1 : -1));
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customRoot = searchParams.get("root");
    
    const rootDir = process.cwd();
    let scanDir = customRoot ? path.resolve(customRoot) : path.resolve(rootDir, ".."); 
    
    if (!fs.existsSync(scanDir) || !fs.statSync(scanDir).isDirectory()) {
      scanDir = path.resolve(rootDir, ".."); 
    }

    const tree = buildTree(scanDir, scanDir);
    return NextResponse.json({ tree, root: scanDir });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
