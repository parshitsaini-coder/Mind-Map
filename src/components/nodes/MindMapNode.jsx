import { memo } from 'react';
import { motion } from 'framer-motion';
import { Handle, Position } from 'reactflow';
import { ChevronDown, ChevronRight, Star, Link2, Video, Paperclip, StickyNote } from 'lucide-react';
import { useMindMapStore } from '../../store/mindMapStore.js';
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
  const nodes = useMindMapStore((s) => s.nodes);
  const hasChildren = Object.values(nodes).some((n) => n.parentId === id);

  const { label, style, taskMeta, direction, notes, link, videoEmbed, attachments } = data;
  const shape = shapeClass[style?.shape] || shapeClass.rectangle;
  const [targetPos, sourcePos] = direction === 'horizontal' ? [Position.Left, Position.Right] : [Position.Top, Position.Bottom];
  const Icon = style?.icon ? ICON_LIBRARY[style.icon] : null;

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
      className={`group relative flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium border transition-shadow ${shape} ${
        selected ? 'ring-2 ring-accent' : 'border-sage'
      }`}
      style={{ backgroundColor: style?.color || '#e8eddf', color: '#242423' }}
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

      <span className="whitespace-nowrap max-w-[160px] truncate">{label}</span>

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

      {hasChildren && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleCollapse(id);
          }}
          className="ml-0.5 -mr-1 text-graphite hover:text-ink"
        >
          {data.collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
        </button>
      )}
    </motion.div>
  );
}

export default memo(MindMapNode);
