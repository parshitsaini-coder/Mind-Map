import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useMindMapStore, getDFSOrder } from '../../store/mindMapStore.js';
import { useUIStore } from '../../store/uiStore.js';

export default function PresentationMode() {
  const presentationOpen = useUIStore((s) => s.presentationOpen);

  // Kept mounted (rather than the old `if (!presentationOpen) return null`
  // at the top of this component) so AnimatePresence below can actually
  // play the fade-out when closing instead of the whole overlay vanishing
  // instantly — same fix applied to ShareDialog/ShortcutsHelp in Step 11.
  return <AnimatePresence>{presentationOpen && <PresentationOverlay />}</AnimatePresence>;
}

function PresentationOverlay() {
  const presentationIndex = useUIStore((s) => s.presentationIndex);
  const setPresentationIndex = useUIStore((s) => s.setPresentationIndex);
  const stopPresentation = useUIStore((s) => s.stopPresentation);

  const nodes = useMindMapStore((s) => s.nodes);
  const rootIds = useMindMapStore((s) => s.rootIds);

  // DFS order gives a natural "branch by branch" slide sequence, skipping
  // collapsed subtrees the same way the canvas does.
  const order = useMemo(() => getDFSOrder(nodes, rootIds), [nodes, rootIds]);

  // Tracks whether the last navigation went forward or backward, so the
  // slide transition direction matches the arrow the person pressed. Kept
  // as state (not a ref) since Framer Motion's `custom` prop is read during
  // render — reading a ref there is an anti-pattern react-hooks lints against.
  const [dir, setDir] = useState(1);

  if (order.length === 0) {
    return (
      <motion.div
        className="fixed inset-0 z-50 bg-ink/90 flex items-center justify-center text-offwhite"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="text-center">
          <p className="mb-3">Nothing to present yet.</p>
          <button onClick={stopPresentation} className="px-3 py-1.5 rounded bg-accent text-ink text-[12px]">
            Close
          </button>
        </div>
      </motion.div>
    );
  }

  const clampedIndex = Math.min(presentationIndex, order.length - 1);
  const node = nodes[order[clampedIndex]];
  const depth = (() => {
    let d = 0;
    let cur = node;
    while (cur?.parentId) {
      d += 1;
      cur = nodes[cur.parentId];
    }
    return d;
  })();

  const go = (delta) => {
    setDir(delta);
    setPresentationIndex((clampedIndex + delta + order.length) % order.length);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-ink flex flex-col items-center justify-center text-offwhite px-10 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(1);
        if (e.key === 'ArrowLeft') go(-1);
        if (e.key === 'Escape') stopPresentation();
      }}
      tabIndex={-1}
      ref={(el) => el?.focus()}
    >
      <button
        onClick={stopPresentation}
        className="absolute top-4 right-4 text-offwhite/70 hover:text-offwhite"
        title="Close (Esc)"
      >
        <X size={20} />
      </button>

      <span className="absolute top-4 left-4 text-[11px] text-offwhite/50 tabular-nums">
        {clampedIndex + 1} / {order.length}
      </span>

      {/* Slide-by-slide walkthrough: each branch slides in from the direction
          navigated and the previous one slides out the opposite way, rather
          than jump-cutting between nodes. */}
      <div className="relative max-w-2xl w-full h-64 flex items-center justify-center">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={node.id}
            custom={dir}
            initial={(d) => ({ opacity: 0, x: d >= 0 ? 60 : -60 })}
            animate={{ opacity: 1, x: 0 }}
            exit={(d) => ({ opacity: 0, x: d >= 0 ? -60 : 60 })}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center"
          >
            <div
              className="inline-block px-3 py-1 mb-4 rounded-full text-[10px] uppercase tracking-wide"
              style={{ backgroundColor: '#f5cb5c', color: '#242423' }}
            >
              {'—'.repeat(depth) || 'Central Topic'}
            </div>
            <h1 className="text-3xl font-semibold flex items-center justify-center gap-2 mb-3">
              {node.taskMeta?.starred && <Star size={22} className="fill-[#f5cb5c] text-[#f5cb5c]" />}
              {node.label}
            </h1>
            {node.notes ? (
              <div
                className="text-[14px] text-offwhite/80 leading-relaxed max-h-40 overflow-y-auto thin-scroll"
                dangerouslySetInnerHTML={{ __html: node.notes }}
              />
            ) : (
              <p className="text-[13px] text-offwhite/40 italic">No notes on this node.</p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute bottom-8 flex items-center gap-4">
        <button
          onClick={() => go(-1)}
          className="w-9 h-9 rounded-full bg-offwhite/10 hover:bg-offwhite/20 flex items-center justify-center"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => go(1)}
          className="w-9 h-9 rounded-full bg-offwhite/10 hover:bg-offwhite/20 flex items-center justify-center"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </motion.div>
  );
}
