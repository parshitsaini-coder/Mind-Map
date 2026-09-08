import { memo, useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Handle, Position } from 'reactflow';
import { ChevronDown, ChevronRight, Star, Link2, Video, Paperclip, StickyNote, Plus } from 'lucide-react';
import { useMindMapStore } from '../../store/mindMapStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { ICON_LIBRARY } from '../../data/iconLibrary.js';

const shapeClass = {
  rectangle: 'rounded-md',
  oval: 'rounded-full px-4',
  cloud: 'rounded-[2rem]',
  hexagon: 'clip-hexagon',
  none: 'rounded-none bg-transparent border-transparent shadow-none',
};

function ProgressRing({ progress }) {
  const r = 7;
  const c = 2 * Math.PI * r;
  const offset = c - (progress / 100) * c;
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" className="shrink-0">
      <circle cx="9" cy="9" r={r} fill="none" stroke="#cfdbd5" strokeWidth="2.5" />
      <circle
        cx="9" cy="9" r={r} fill="none" stroke="#f5cb5c" strokeWidth="2.5"
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
        transform="rotate(-90 9 9)"
      />
    </svg>
  );
}

function MindMapNode({ id, data, selected }) {
  const toggleCollapse = useMindMapStore((s) => s.toggleCollapse);
  const updateNode = useMindMapStore((s) => s.updateNode);
  const readOnly = useMindMapStore((s) => s.readOnly);
  const nodes = useMindMapStore((s) => s.nodes);
  const hasChildren = Object.values(nodes).some((n) => n.parentId === id);

  const { label, style, taskMeta, direction, notes, link, videoEmbed, attachments } = data;
  const shape = shapeClass[style?.shape] || shapeClass.rectangle;
  const [targetPos, sourcePos] = direction === 'horizontal' ? [Position.Left, Position.Right] : [Position.Top, Position.Bottom];
  const Icon = style?.icon ? ICON_LIBRARY[style.icon] : null;

  // Double-click-to-rename: a mind map node's label was previously only
  // ever set at creation time ("New Node") with no way to change it — the
  // Style/Content side panels cover everything *except* the label itself.
  // This restores the standard mind-map interaction (double-click, type,
  // Enter/blur to commit, Escape to cancel) directly on the node.
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);
  const inputRef = useRef(null);
  const editingNodeId = useUIStore((s) => s.editingNodeId);
  const clearRequestEdit = useUIStore((s) => s.clearRequestEdit);

  useEffect(() => {
    if (editingNodeId === id && !readOnly) {
      setEditing(true);
      clearRequestEdit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingNodeId, id]);

  useEffect(() => {
    if (!editing) setDraft(label);
  }, [label, editing]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== label) updateNode(id, { label: trimmed });
    else setDraft(label);
  };

  // Step 13 fix: there was no way to add a child directly from the canvas —
  // only the keyboard (Tab) or the toolbar's "+ Node" button (which needs a
  // selection first). This gives every node a small hover-revealed "+" on
  // whichever edge its children extend toward, matching how MindMeister/
  // XMind-style tools work, and drops the new child straight into rename
  // mode (same as Tab/Enter/toolbar).
  const addChild = (e) => {
    e.stopPropagation();
    if (readOnly) return;
    const newId = useMindMapStore.getState().addNode(id, { label: 'New Node' });
    useMindMapStore.getState().selectNode(newId);
    useUIStore.getState().requestEdit(newId);
  };
  const addOnRight = sourcePos === Position.Right;

  return (
    <motion.div
      // Step 11: nodes pop/scale in on mount (new node added, or a collapsed
      // branch's children re-appearing) instead of snapping in instantly.
      // Repositioning between layouts is handled separately via the CSS
      // `transform` transition on `.react-flow__node` (index.css) — cheaper
      // than animating hundreds of nodes through Framer Motion every layout
      // switch, and lets the browser compositor do the work.
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      onDoubleClick={(e) => {
        if (readOnly) return;
        e.stopPropagation();
        setEditing(true);
      }}
      onContextMenu={(e) => {
        if (readOnly) return;
        e.preventDefault();
        e.stopPropagation();
        useMindMapStore.getState().selectNode(id);
        useUIStore.getState().openContextMenu(id, e.clientX, e.clientY);
      }}
      className={`group relative flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium border transition-shadow ${shape} ${
        selected ? 'ring-2 ring-accent' : 'border-sage'
      }`}
      style={{ backgroundColor: style?.color || '#e8eddf', color: style?.textColor || '#242423' }}
    >
      <Handle type="target" position={targetPos} className="!bg-graphite !w-1.5 !h-1.5 !border-0" />
      <Handle type="source" position={sourcePos} className="!bg-graphite !w-1.5 !h-1.5 !border-0" />

      {taskMeta?.starred && <Star size={12} className="shrink-0 fill-[#f5cb5c] text-[#f5cb5c]" />}

      {style?.image && (
        <img src={style.image} alt="" className="w-5 h-5 rounded object-cover shrink-0" />
      )}

      {Icon && <Icon size={13} className="shrink-0" />}
      {style?.emoji && <span className="shrink-0 leading-none">{style.emoji}</span>}

      {taskMeta?.todo && (
        <input
          type="checkbox"
          checked={taskMeta.done}
          readOnly
          className="w-3 h-3 accent-[#f5cb5c]"
        />
      )}

      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            e.stopPropagation(); // don't let global shortcuts (Enter=sibling, etc.) fire while typing
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              setDraft(label);
              setEditing(false);
            }
          }}
          onBlur={commit}
          className="nodrag whitespace-nowrap max-w-[160px] w-[120px] bg-white/70 outline-none ring-1 ring-accent rounded px-0.5 -mx-0.5"
        />
      ) : (
        <span className="whitespace-nowrap max-w-[160px] truncate">{label}</span>
      )}

      {taskMeta?.priority && (
        <span className="text-[9px] px-1 rounded bg-ink/10 text-ink">P{taskMeta.priority}</span>
      )}

      {taskMeta?.progress > 0 && <ProgressRing progress={taskMeta.progress} />}

      {(notes || link?.url || videoEmbed || attachments?.length > 0) && (
        <span className="flex items-center gap-0.5 text-graphite/70 shrink-0">
          {notes && <StickyNote size={10} />}
          {link?.url && <Link2 size={10} />}
          {videoEmbed && <Video size={10} />}
          {attachments?.length > 0 && (
            <span className="flex items-center gap-px">
              <Paperclip size={10} />
              <span className="text-[9px]">{attachments.length}</span>
            </span>
          )}
        </span>
      )}

      {/* Step 13 fix: the collapse/expand toggle used to be a small inline
          chevron easy to miss next to the label. It now lives directly on
          the connector dot where the branch's children extend from — the
          same spot people were already clicking, expecting it to do
          something. When there are no children yet, this spot instead shows
          the hover-revealed "+" to add one (adding further children to an
          existing branch still works via right-click → Add child, or Tab). */}
      {hasChildren ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleCollapse(id);
          }}
          title={data.collapsed ? 'Expand branch' : 'Collapse branch'}
          className={`nodrag absolute w-4 h-4 rounded-full bg-sage border border-graphite/50 text-ink flex items-center justify-center hover:brightness-95 active:scale-90 transition shadow-sm z-10 ${
            addOnRight ? 'top-1/2 -translate-y-1/2 -right-2' : 'left-1/2 -translate-x-1/2 -bottom-2'
          }`}
        >
          {data.collapsed ? <ChevronRight size={10} strokeWidth={2.5} /> : <ChevronDown size={10} strokeWidth={2.5} />}
        </button>
      ) : (
        !readOnly && (
          <button
            onClick={addChild}
            title="Add child node"
            className={`nodrag absolute w-4 h-4 rounded-full bg-accent text-ink flex items-center justify-center opacity-0 group-hover:opacity-100 hover:brightness-95 active:scale-90 transition shadow-sm z-10 ${
              addOnRight ? 'top-1/2 -translate-y-1/2 -right-2' : 'left-1/2 -translate-x-1/2 -bottom-2'
            }`}
          >
            <Plus size={10} strokeWidth={3} />
          </button>
        )
      )}
    </motion.div>
  );
}

export default memo(MindMapNode);
