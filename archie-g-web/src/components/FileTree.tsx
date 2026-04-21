"use client";

import { useState } from "react";
import { Folder, File, ChevronRight, ChevronDown, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FileNode {
  name: string;
  path: string;
  isDir: boolean;
  children?: FileNode[];
}

export function FileTree({
  tree,
  onSelect,
  selectedPath,
}: {
  tree: FileNode[];
  onSelect: (path: string) => void;
  selectedPath: string;
}) {
  const [search, setSearch] = useState("");

  const filteredTree = search 
    ? tree.filter(n => n.name.toLowerCase().includes(search.toLowerCase()) || (n.isDir && n.children?.some(c => c.name.toLowerCase().includes(search.toLowerCase()))))
    : tree;

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 mb-4 relative">
        <input 
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="파일 검색..."
          className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-8 py-2 text-[10px] text-white/60 outline-none focus:border-violet-500/30 transition-all"
        />
        <Search size={10} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" />
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
        {filteredTree.map((node) => (
          <TreeNode 
            key={node.path} 
            node={node} 
            onSelect={onSelect} 
            selectedPath={selectedPath} 
            depth={0} 
          />
        ))}
      </div>
    </div>
  );
}

function TreeNode({
  node,
  onSelect,
  selectedPath,
  depth,
}: {
  node: FileNode;
  onSelect: (path: string) => void;
  selectedPath: string;
  depth: number;
}) {
  const [isOpen, setIsOpen] = useState(depth < 1); // Expand top level by default
  const isSelected = selectedPath === node.path || selectedPath === `../${node.path}`;

  const toggle = (e: React.MouseEvent) => {
    if (node.isDir) {
      e.stopPropagation();
      setIsOpen(!isOpen);
    } else {
      onSelect(`../${node.path}`);
    }
  };

  return (
    <div className="select-none">
      <div
        onClick={toggle}
        className={`flex items-center py-1.5 px-2 rounded-lg cursor-pointer transition-all ${
          isSelected 
            ? "bg-violet-500/20 text-violet-300" 
            : "hover:bg-white/[0.04] text-white/40 hover:text-white/70"
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <span className="mr-2">
          {node.isDir ? (
            isOpen ? <ChevronDown size={12} className="text-white/20" /> : <ChevronRight size={12} className="text-white/20" />
          ) : (
            <div className="w-3" />
          )}
        </span>
        <span className="mr-2">
          {node.isDir ? (
            <Folder size={14} className={isOpen ? "text-violet-400/60" : "text-white/20"} />
          ) : (
            <File size={14} className={isSelected ? "text-violet-400" : "text-white/10"} />
          )}
        </span>
        <span className="text-[11px] font-medium truncate">{node.name}</span>
      </div>

      <AnimatePresence>
        {node.isDir && isOpen && node.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {node.children.map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                onSelect={onSelect}
                selectedPath={selectedPath}
                depth={depth + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
