import { useEffect, useRef } from 'react';
import { Edit3, Plus, Trash2 } from 'lucide-react';
import { useMindMapStore } from '../../store/mindMapStore.js';
import { useUIStore } from '../../store/uiStore.js';

// Step 13 fix: right-click a node for Rename / Add child / Delete. Before
// this, the only way to delete a node at all was the Delete/Backspace key —
// there was no mouse-driven, discoverable path to any of these actions.
export default function NodeContextMenu() {
  const contextMenu = useUIStore((s) => s.contextMenu);
  const closeContextMenu = useUIStore((s) => s.closeContextMenu);
  const requestEdit = useUIStore((s) => s.requestEdit);
  const node = useMindMapStore((s) => (contextMenu ? s.nodes[contextMenu.nodeId] : null));
  const addNode = useMindMapStore((s) => s.addNode);
  const deleteNode = useMindMapStore((s) => s.deleteNode);
  const selectNode = useMindMapStore((s) => s.selectNode);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!contextMenu) return;
    const onDocMouseDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) closeContextMenu();
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeContextMenu();
    };
    const onScroll = () => closeContextMenu();
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [contextMenu, closeContextMenu]);

  if (!contextMenu || !node) return null;

  const MENU_W = 160;
  const MENU_H = 140;
  const x = Math.min(contextMenu.x, window.innerWidth - MENU_W - 8);
  const y = Math.min(contextMenu.y, window.innerHeight - MENU_H - 8);

  const items = [
    {
      icon: Edit3,
      label: 'Rename',
      onClick: () => {
        requestEdit(node.id);
        closeContextMenu();
      },
    },
    {
      icon: Plus,
      label: 'Add child',
      onClick: () => {
        const newId = addNode(node.id, { label: 'New Node' });
        selectNode(newId);
        requestEdit(newId);
        closeContextMenu();
      },
    },
    {
      icon: Trash2,
      label: 'Delete',
      danger: true,
      onClick: () => {
        deleteNode(node.id);
        closeContextMenu();
      },
    },
  ];

  return (
    <div
      ref={menuRef}
      style={{ left: x, top: y }}
      className="fixed z-50 w-40 py-1 rounded-md border border-sage bg-offwhite shadow-lg text-[12px]"
    >
      <div className="px-2.5 py-1 text-[10px] uppercase tracking-wide text-graphite truncate border-b border-sage/60 mb-1">
        {node.label}
      </div>
      {items.map(({ icon: Icon, label, onClick, danger }) => (
        <button
          key={label}
          onClick={onClick}
          className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left transition ${
            danger ? 'text-red-600 hover:bg-red-50' : 'text-ink hover:bg-sage/40'
          }`}
        >
          <Icon size={13} />
          {label}
        </button>
      ))}
    </div>
  );
}
