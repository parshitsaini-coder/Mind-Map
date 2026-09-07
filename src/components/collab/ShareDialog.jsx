import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link2, Copy, Check, Eye, Pencil, Info } from 'lucide-react';
import { useMindMapStore } from '../../store/mindMapStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { buildShareUrl, estimateShareUrlLength } from '../../utils/shareLink.js';

export default function ShareDialog() {
  const open = useUIStore((s) => s.shareDialogOpen);
  const close = useUIStore((s) => s.closeShareDialog);
  const [mode, setMode] = useState('view');
  const [copied, setCopied] = useState(false);

  const nodes = useMindMapStore((s) => s.nodes);
  const rootIds = useMindMapStore((s) => s.rootIds);
  const relationships = useMindMapStore((s) => s.relationships);
  const boundaries = useMindMapStore((s) => s.boundaries);

  const mapData = { nodes, rootIds, relationships, boundaries };
  const url = open ? buildShareUrl(mapData, mode) : '';
  const len = open ? estimateShareUrlLength(mapData, mode) : 0;
  const tooLong = len > 60000; // most browsers/servers choke well before this

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API unavailable — user can still select & copy the field manually
    }
  };

  // NOTE (Step 11 fix): AnimatePresence only plays an exit animation for
  // children that were previously rendered and then removed *while still
  // mounted inside it*. The old code short-circuited with `if (!open) return
  // null` above this JSX, which unmounted the whole component (and the
  // AnimatePresence wrapper along with it) the instant `open` flipped to
  // false — so the dialog just vanished instead of fading/scaling out. The
  // fix is to keep AnimatePresence mounted always and put the `open` check
  // on the child instead.
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={close}
        >
          <motion.div
            className="w-[26rem] max-w-[92vw] bg-offwhite rounded-lg shadow-xl border border-sage overflow-hidden"
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-sage bg-sage/20">
              <div className="flex items-center gap-1.5 text-[12px] font-semibold text-ink">
                <Link2 size={14} /> Share this map
              </div>
              <button onClick={close} className="text-graphite hover:text-ink">
                <X size={14} />
              </button>
            </div>

            <div className="p-3 space-y-3">
              <div className="flex gap-1.5">
                <button
                  onClick={() => setMode('view')}
                  className={`flex-1 flex items-center justify-center gap-1 h-7 rounded-md text-[11px] transition ${
                    mode === 'view' ? 'bg-accent text-ink' : 'bg-sage/40 text-graphite hover:bg-sage/70'
                  }`}
                >
                  <Eye size={12} /> View-only
                </button>
                <button
                  onClick={() => setMode('edit')}
                  className={`flex-1 flex items-center justify-center gap-1 h-7 rounded-md text-[11px] transition ${
                    mode === 'edit' ? 'bg-accent text-ink' : 'bg-sage/40 text-graphite hover:bg-sage/70'
                  }`}
                >
                  <Pencil size={12} /> Editable
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  readOnly
                  value={url}
                  onFocus={(e) => e.target.select()}
                  className="flex-1 text-[10.5px] font-mono border border-sage rounded px-1.5 py-1.5 outline-none bg-white/60 truncate"
                />
                <button
                  onClick={copy}
                  className="h-7 px-2 flex items-center gap-1 rounded-md bg-accent text-ink text-[11px] font-medium hover:brightness-95 active:scale-95 transition shrink-0"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>

              {tooLong && (
                <div className="text-[10.5px] text-graphite/80 bg-sage/30 rounded px-2 py-1.5">
                  This map is large — the link is quite long. Some chat apps may truncate it; a downloadable file
                  export is more reliable for big maps.
                </div>
              )}

              <div className="flex gap-1.5 text-[10.5px] text-graphite/80 bg-sage/20 rounded px-2 py-1.5">
                <Info size={12} className="shrink-0 mt-0.5" />
                <span>
                  GitHub Pages is static hosting — there's no server to sync edits back to you in real time.
                  The whole map is encoded straight into this link. "Editable" links let whoever opens them edit
                  their <em>own local copy</em>; changes don't sync back automatically. For true live multi-user
                  sync, a backend like Firebase or Supabase would need to be added later.
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
