import { useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Replace, ChevronUp, ChevronDown } from 'lucide-react';
import { useMindMapStore } from '../../store/mindMapStore.js';
import { useUIStore } from '../../store/uiStore.js';

export default function SearchPanel() {
  const searchOpen = useUIStore((s) => s.searchOpen);
  const searchQuery = useUIStore((s) => s.searchQuery);
  const replaceQuery = useUIStore((s) => s.replaceQuery);
  const searchMatchIndex = useUIStore((s) => s.searchMatchIndex);
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);
  const setReplaceQuery = useUIStore((s) => s.setReplaceQuery);
  const setSearchMatchIndex = useUIStore((s) => s.setSearchMatchIndex);
  const closeSearch = useUIStore((s) => s.closeSearch);

  const nodes = useMindMapStore((s) => s.nodes);
  const updateNode = useMindMapStore((s) => s.updateNode);
  const selectNode = useMindMapStore((s) => s.selectNode);

  const inputRef = useRef(null);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  const matches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return Object.values(nodes).filter((n) => n.label.toLowerCase().includes(q));
  }, [nodes, searchQuery]);

  useEffect(() => {
    if (matches.length > 0) {
      const clamped = Math.min(searchMatchIndex, matches.length - 1);
      selectNode(matches[clamped].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches.length, searchMatchIndex]);

  const goTo = (delta) => {
    if (matches.length === 0) return;
    const next = (searchMatchIndex + delta + matches.length) % matches.length;
    setSearchMatchIndex(next);
  };

  const replaceOne = () => {
    if (matches.length === 0) return;
    const current = matches[Math.min(searchMatchIndex, matches.length - 1)];
    const replaced = current.label.split(searchQuery).join(replaceQuery);
    updateNode(current.id, { label: replaced });
  };

  const replaceAll = () => {
    matches.forEach((m) => {
      const replaced = m.label.split(searchQuery).join(replaceQuery);
      updateNode(m.id, { label: replaced });
    });
  };

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div
          className="absolute top-2 right-2 left-2 sm:left-auto z-20 w-full sm:w-72 max-w-[92vw] rounded-lg border border-sage bg-offwhite shadow-lg text-[12px]"
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.16 }}
        >
          <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-sage">
            <Search size={13} className="text-graphite shrink-0" />
            <input
              ref={inputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') goTo(e.shiftKey ? -1 : 1);
              }}
              placeholder="Search node labels…"
              className="flex-1 bg-transparent outline-none text-[12px] placeholder:text-graphite/50"
            />
            <span className="text-[10px] text-graphite/70 shrink-0 tabular-nums">
              {matches.length > 0 ? `${searchMatchIndex + 1}/${matches.length}` : '0/0'}
            </span>
            <button onClick={() => goTo(-1)} className="text-graphite hover:text-ink" title="Previous match">
              <ChevronUp size={13} />
            </button>
            <button onClick={() => goTo(1)} className="text-graphite hover:text-ink" title="Next match">
              <ChevronDown size={13} />
            </button>
            <button onClick={closeSearch} className="text-graphite hover:text-ink" title="Close (Esc)">
              <X size={13} />
            </button>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-1.5">
            <Replace size={13} className="text-graphite shrink-0" />
            <input
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              placeholder="Replace with…"
              className="flex-1 bg-transparent outline-none text-[12px] placeholder:text-graphite/50"
            />
            <button
              onClick={replaceOne}
              disabled={matches.length === 0}
              className="text-[10px] px-1.5 py-0.5 rounded bg-sage/50 hover:bg-sage disabled:opacity-40 shrink-0"
            >
              Replace
            </button>
            <button
              onClick={replaceAll}
              disabled={matches.length === 0}
              className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-ink hover:brightness-95 disabled:opacity-40 shrink-0"
            >
              All
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
