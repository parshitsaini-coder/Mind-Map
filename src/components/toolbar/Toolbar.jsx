import {
  Plus, LayoutGrid, GitBranch, Clock3, Table2, Network, Rows3, Workflow, GitCommitHorizontal,
  List, Map, Search, Play, Keyboard, Undo2, Redo2, Share2, Menu, PanelRight,
} from 'lucide-react';
import { useMindMapStore } from '../../store/mindMapStore.js';
import { useUIStore } from '../../store/uiStore.js';

const LAYOUTS = [
  { id: 'radial', label: 'Radial', icon: Network },
  { id: 'tree', label: 'Tree', icon: GitBranch },
  { id: 'tree-horizontal', label: 'H-Tree', icon: GitCommitHorizontal },
  { id: 'org', label: 'Org Chart', icon: Rows3 },
  { id: 'logic', label: 'Logic Chart', icon: Workflow },
  { id: 'fishbone', label: 'Fishbone', icon: LayoutGrid },
  { id: 'timeline', label: 'Timeline', icon: Clock3 },
  { id: 'matrix', label: 'Matrix', icon: Table2 },
];

export default function Toolbar() {
  const layout = useMindMapStore((s) => s.layout);
  const setLayout = useMindMapStore((s) => s.setLayout);
  const addNode = useMindMapStore((s) => s.addNode);
  const selectedNodeId = useMindMapStore((s) => s.selectedNodeId);
  const readOnly = useMindMapStore((s) => s.readOnly);
  const undo = useMindMapStore((s) => s.undo);
  const redo = useMindMapStore((s) => s.redo);
  const canUndo = useMindMapStore((s) => s.history.length > 0);
  const canRedo = useMindMapStore((s) => s.future.length > 0);

  const viewMode = useUIStore((s) => s.viewMode);
  const toggleViewMode = useUIStore((s) => s.toggleViewMode);
  const openSearch = useUIStore((s) => s.openSearch);
  const startPresentation = useUIStore((s) => s.startPresentation);
  const toggleShortcutsHelp = useUIStore((s) => s.toggleShortcutsHelp);
  const openShareDialog = useUIStore((s) => s.openShareDialog);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const toggleRightPanel = useUIStore((s) => s.toggleRightPanel);

  return (
    <div className="h-11 flex items-center gap-1 px-2 border-b border-sage bg-offwhite shrink-0">
      {/* Step 12: sidebar/right-panel are off-canvas drawers below md, so
          they need an explicit toggle here — at md+ they're always-visible
          static columns and these buttons hide themselves. */}
      <button
        onClick={toggleSidebar}
        title="Toggle maps & nodes panel"
        className="md:hidden w-7 h-7 flex items-center justify-center rounded-md text-graphite hover:bg-sage/50 transition shrink-0"
      >
        <Menu size={15} />
      </button>

      <button
        onClick={() => addNode(selectedNodeId, { label: 'New Node' })}
        disabled={readOnly}
        className="flex items-center gap-1 h-7 px-2 rounded-md bg-accent text-ink text-xs font-medium hover:brightness-95 active:scale-95 transition disabled:opacity-40"
        title="Add node (Tab)"
      >
        <Plus size={14} strokeWidth={2.5} />
        Node
      </button>

      {!readOnly && (
        <>
          <button
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl/Cmd+Z)"
            className="w-7 h-7 flex items-center justify-center rounded-md text-graphite hover:bg-sage/50 disabled:opacity-30 transition"
          >
            <Undo2 size={14} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl/Cmd+Shift+Z)"
            className="w-7 h-7 flex items-center justify-center rounded-md text-graphite hover:bg-sage/50 disabled:opacity-30 transition"
          >
            <Redo2 size={14} />
          </button>
        </>
      )}

      <div className="w-px h-5 bg-sage mx-1" />

      <div className="flex items-center gap-0.5 overflow-x-auto thin-scroll">
        {LAYOUTS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setLayout(id)}
            title={label}
            disabled={viewMode === 'outline'}
            className={`flex items-center gap-1 h-7 px-2 rounded-md text-[11px] shrink-0 transition disabled:opacity-40 ${
              layout === id && viewMode === 'canvas' ? 'bg-sage text-ink' : 'text-graphite hover:bg-sage/50'
            }`}
          >
            <Icon size={13} />
            <span className="hidden lg:inline">{label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1" />

      <button
        onClick={toggleViewMode}
        title="Toggle Map / Outline view"
        className="flex items-center gap-1 h-7 px-2 rounded-md text-[11px] text-graphite hover:bg-sage/50 transition"
      >
        {viewMode === 'canvas' ? <List size={13} /> : <Map size={13} />}
        <span className="hidden md:inline">{viewMode === 'canvas' ? 'Outline' : 'Map'}</span>
      </button>

      <button
        onClick={openSearch}
        title="Search & replace (Ctrl/Cmd+F)"
        className="w-7 h-7 flex items-center justify-center rounded-md text-graphite hover:bg-sage/50 transition"
      >
        <Search size={13} />
      </button>

      <button
        onClick={startPresentation}
        title="Presentation mode (P)"
        className="w-7 h-7 flex items-center justify-center rounded-md text-graphite hover:bg-sage/50 transition"
      >
        <Play size={13} />
      </button>

      <button
        onClick={toggleShortcutsHelp}
        title="Keyboard shortcuts (?)"
        className="w-7 h-7 flex items-center justify-center rounded-md text-graphite hover:bg-sage/50 transition"
      >
        <Keyboard size={13} />
      </button>

      <div className="w-px h-5 bg-sage mx-1" />

      <button
        onClick={openShareDialog}
        title="Share this map"
        className="flex items-center gap-1 h-7 px-2 rounded-md text-[11px] text-graphite hover:bg-sage/50 transition"
      >
        <Share2 size={13} />
        <span className="hidden md:inline">Share</span>
      </button>

      {/* Mobile-only: reveal the style/content/comments drawer for the
          selected node without needing to tap a node first. */}
      <button
        onClick={toggleRightPanel}
        title="Toggle style & content panel"
        className="md:hidden w-7 h-7 flex items-center justify-center rounded-md text-graphite hover:bg-sage/50 transition shrink-0"
      >
        <PanelRight size={15} />
      </button>
    </div>
  );
}
