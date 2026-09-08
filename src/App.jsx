import { useEffect, useRef } from 'react';
import { useMindMapStore } from './store/mindMapStore.js';
import { useUIStore } from './store/uiStore.js';
import { useWorkspaceStore } from './store/workspaceStore.js';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js';
import { readMapFromLocation, clearShareHash } from './utils/shareLink.js';
import Toolbar from './components/toolbar/Toolbar.jsx';
import Sidebar from './components/sidebar/Sidebar.jsx';
import Canvas from './components/canvas/Canvas.jsx';
import OutlineView from './components/outline/OutlineView.jsx';
import RightPanel from './components/panels/RightPanel.jsx';
import PresentationMode from './components/presentation/PresentationMode.jsx';
import ShortcutsHelp from './components/help/ShortcutsHelp.jsx';
import ShareDialog from './components/collab/ShareDialog.jsx';
import NodeContextMenu from './components/canvas/NodeContextMenu.jsx';
import { Eye, Pencil, X } from 'lucide-react';

function SharedBanner() {
  const mode = useUIStore((s) => s.sharedBannerMode);
  const dismiss = useUIStore((s) => s.dismissSharedBanner);
  if (!mode) return null;
  return (
    <div className="h-7 shrink-0 flex items-center gap-2 px-3 bg-accent/90 text-ink text-[11px]">
      {mode === 'view' ? <Eye size={12} /> : <Pencil size={12} />}
      <span className="flex-1">
        {mode === 'view'
          ? "You're viewing a shared map (view-only) — a link opened this on its own local copy."
          : "You're editing your own local copy of a shared map — changes stay in this browser only."}
      </span>
      <button onClick={dismiss} className="hover:brightness-90">
        <X size={12} />
      </button>
    </div>
  );
}

export default function App() {
  const nodes = useMindMapStore((s) => s.nodes);
  const addNode = useMindMapStore((s) => s.addNode);
  const loadMap = useMindMapStore((s) => s.loadMap);
  const setReadOnly = useMindMapStore((s) => s.setReadOnly);
  const viewMode = useUIStore((s) => s.viewMode);
  const setSharedBannerMode = useUIStore((s) => s.setSharedBannerMode);
  const saveActiveMapSnapshot = useWorkspaceStore((s) => s.saveActiveMapSnapshot);
  const activeMapId = useWorkspaceStore((s) => s.activeMapId);

  useKeyboardShortcuts();

  const initialized = useRef(false);

  // On first mount: a shared link takes priority; otherwise load the active
  // workspace map's saved content; if everything is still empty, seed a demo.
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const shared = readMapFromLocation();
    if (shared) {
      loadMap(shared.data);
      setReadOnly(shared.mode === 'view');
      setSharedBannerMode(shared.mode);
      clearShareHash();
      return;
    }

    const activeMap = useWorkspaceStore.getState().maps[activeMapId];
    if (activeMap?.data && Object.keys(activeMap.data.nodes || {}).length > 0) {
      loadMap(activeMap.data);
      return;
    }

    // Nothing saved yet — seed a friendly starter map.
    const rootId = addNode(null, {
      label: 'Central Topic',
      position: { x: 0, y: 0 },
      style: { shape: 'oval', color: '#f5cb5c' },
    });
    const branchA = addNode(rootId, { label: 'Branch A', style: { branchColor: '#f5cb5c' } });
    addNode(branchA, { label: 'Sub A1' });
    addNode(branchA, { label: 'Sub A2' });
    const branchB = addNode(rootId, { label: 'Branch B', style: { branchColor: '#333533' } });
    addNode(branchB, { label: 'Sub B1' });
    addNode(rootId, { label: 'Branch C' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save the active map into the local workspace whenever content changes
  // (debounced so rapid edits / drags don't thrash localStorage). Skipped for
  // read-only shared views since there's no "active map" slot to write into.
  const readOnly = useMindMapStore((s) => s.readOnly);
  const relationships = useMindMapStore((s) => s.relationships);
  const boundaries = useMindMapStore((s) => s.boundaries);
  const saveTimer = useRef(null);
  useEffect(() => {
    if (readOnly) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveActiveMapSnapshot(), 600);
    return () => clearTimeout(saveTimer.current);
  }, [nodes, relationships, boundaries, readOnly, saveActiveMapSnapshot]);

  return (
    <div className="h-screen w-screen flex flex-col bg-canvas text-ink">
      <SharedBanner />
      <Toolbar />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        {viewMode === 'canvas' ? <Canvas /> : <OutlineView />}
        <RightPanel />
      </div>
      <PresentationMode />
      <ShortcutsHelp />
      <ShareDialog />
      <NodeContextMenu />
    </div>
  );
}
