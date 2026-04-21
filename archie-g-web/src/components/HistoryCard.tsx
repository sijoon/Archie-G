"use client";

import { Clock, FileCode, ArrowRight, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

interface HistoryItem {
  id: string;
  timestamp: string;
  path: string;
  analysis: string;
  provider: string;
  model: string;
  project_root?: string;
}

export function HistoryCard({
  item,
  onSelect,
  onDelete,
}: {
  item: HistoryItem;
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative p-5 rounded-3xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-violet-500/30 transition-all cursor-pointer"
      onClick={() => onSelect(item)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform">
            <FileCode size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white/80 truncate max-w-[200px]">
              {item.path.split("/").pop()}
            </h3>
            <div className="flex items-center space-x-2 text-[10px] text-white/30">
              <Clock size={10} />
              <span>{new Date(item.timestamp).toLocaleString()}</span>
            </div>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="p-2 rounded-xl bg-red-500/0 hover:bg-red-500/10 text-white/10 hover:text-red-400 transition-all"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="space-y-2 mb-4">
        <p className="text-[11px] text-white/40 line-clamp-2 leading-relaxed">
          {item.analysis.slice(0, 150)}...
        </p>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div className="flex items-center space-x-2">
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-white/40 uppercase font-black">
            {item.provider}
          </span>
          <span className="text-[9px] text-white/20 font-mono truncate max-w-[80px]">
            {item.model}
          </span>
        </div>
        <div className="flex items-center space-x-1 text-violet-400 text-[10px] font-black uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
          <span>View Analysis</span>
          <ArrowRight size={12} />
        </div>
      </div>
    </motion.div>
  );
}
