import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';
import { useUIStore } from '../../store/uiStore.js';
import { SHORTCUTS } from '../../hooks/useKeyboardShortcuts.js';

export default function ShortcutsHelp() {
  const open = useUIStore((s) => s.shortcutsHelpOpen);
  const toggle = useUIStore((s) => s.toggleShortcutsHelp);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={toggle}
        >
          <motion.div
            className="w-80 max-w-[90vw] max-h-[70vh] overflow-y-auto thin-scroll rounded-lg border border-sage bg-offwhite shadow-xl p-3"
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-[12px] font-semibold text-ink">
                <Keyboard size={14} />
                Keyboard shortcuts
              </div>
              <button onClick={toggle} className="text-graphite hover:text-ink">
                <X size={14} />
              </button>
            </div>
            <div className="space-y-1">
              {SHORTCUTS.map((s) => (
                <div key={s.keys} className="flex items-center justify-between text-[11px] gap-3">
                  <span className="text-graphite">{s.desc}</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-sage/50 text-ink font-mono text-[10px] shrink-0">
                    {s.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
