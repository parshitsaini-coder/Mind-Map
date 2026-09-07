import { motion, AnimatePresence } from 'framer-motion';
import { Crosshair, X } from 'lucide-react';
import { useMindMapStore } from '../../store/mindMapStore.js';
import { useUIStore } from '../../store/uiStore.js';

export default function FocusBar() {
  const focusNodeId = useUIStore((s) => s.focusNodeId);
  const exitFocus = useUIStore((s) => s.exitFocus);
  const node = useMindMapStore((s) => (focusNodeId ? s.nodes[focusNodeId] : null));

  return (
    <AnimatePresence>
      {node && (
        <motion.div
          className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-sage bg-offwhite shadow text-[11px]"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <Crosshair size={12} className="text-graphite" />
          <span className="text-graphite">Focused on</span>
          <span className="font-medium max-w-[160px] truncate">{node.label}</span>
          <button
            onClick={exitFocus}
            className="ml-1 text-graphite hover:text-ink rounded-full hover:bg-sage/50 p-0.5"
            title="Exit focus (Esc)"
          >
            <X size={12} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
