import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Star } from 'lucide-react';
import { useMindMapStore, getOrderedChildren, getOrderedRoots } from '../../store/mindMapStore.js';

function OutlineRow({ id, depth }) {
  const node = useMindMapStore((s) => s.nodes[id]);
  const nodes = useMindMapStore((s) => s.nodes);
  const selectedNodeId = useMindMapStore((s) => s.selectedNodeId);
  const selectNode = useMindMapStore((s) => s.selectNode);
  const toggleCollapse = useMindMapStore((s) => s.toggleCollapse);
  const updateNode = useMindMapStore((s) => s.updateNode);
  const addNode = useMindMapStore((s) => s.addNode);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(node?.label ?? '');

  if (!node) return null;
  const children = getOrderedChildren(nodes, id);
  const hasChildren = children.length > 0;

  const commit = () => {
    setEditing(false);
    if (draft.trim() && draft !== node.label) updateNode(id, { label: draft.trim() });
    else setDraft(node.label);
  };

  return (
    <div>
      <div
        className={`group flex items-center gap-1 py-0.5 rounded hover:bg-sage/30 ${
          selectedNodeId === id ? 'bg-accent/40' : ''
        }`}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        <button
          onClick={() => hasChildren && toggleCollapse(id)}
          className={`w-4 shrink-0 flex items-center justify-center text-graphite ${
            hasChildren ? 'hover:text-ink' : 'opacity-0'
          }`}
        >
          {hasChildren && (node.collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />)}
        </button>

        {node.taskMeta?.starred && <Star size={10} className="fill-[#f5cb5c] text-[#f5cb5c] shrink-0" />}

        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') {
                setDraft(node.label);
                setEditing(false);
              }
            }}
            className="flex-1 bg-white/70 rounded px-1 text-[12px] outline-none border border-accent"
          />
        ) : (
          <span
            onClick={() => selectNode(id)}
            onDoubleClick={() => setEditing(true)}
            className="flex-1 text-[12px] truncate cursor-pointer"
          >
            {node.label}
          </span>
        )}

        <button
          onClick={() => {
            const newId = addNode(id, { label: 'New Node' });
            selectNode(newId);
          }}
          className="opacity-0 group-hover:opacity-100 text-graphite hover:text-ink shrink-0"
          title="Add child"
        >
          <Plus size={12} />
        </button>
      </div>

      {hasChildren && !node.collapsed && (
        <div>
          {children.map((c) => (
            <OutlineRow key={c.id} id={c.id} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OutlineView() {
  const nodes = useMindMapStore((s) => s.nodes);
  const rootIds = useMindMapStore((s) => s.rootIds);
  const roots = getOrderedRoots(nodes, rootIds);

  return (
    <div className="flex-1 overflow-y-auto thin-scroll bg-canvas px-2 py-2">
      {roots.length === 0 ? (
        <div className="text-[12px] text-graphite/70 px-2 py-4">No nodes yet — add a central topic.</div>
      ) : (
        roots.map((r) => <OutlineRow key={r.id} id={r.id} depth={0} />)
      )}
    </div>
  );
}
