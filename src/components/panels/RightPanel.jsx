import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useMindMapStore } from '../../store/mindMapStore.js';
import { useUIStore, CANVAS_THEMES } from '../../store/uiStore.js';
import NodeStylePanel from './NodeStylePanel.jsx';
import ContentPanel from './ContentPanel.jsx';
import CommentsPanel from '../collab/CommentsPanel.jsx';
import Section from './Section.jsx';

const TABS = [
  { id: 'style', label: 'Style' },
  { id: 'content', label: 'Content' },
  { id: 'comments', label: 'Comments' },
];

export default function RightPanel() {
  const selectedNodeId = useMindMapStore((s) => s.selectedNodeId);
  const node = useMindMapStore((s) => (selectedNodeId ? s.nodes[selectedNodeId] : null));
  const selectNode = useMindMapStore((s) => s.selectNode);
  const canvasTheme = useUIStore((s) => s.canvasTheme);
  const setCanvasTheme = useUIStore((s) => s.setCanvasTheme);
  const activeRightTab = useUIStore((s) => s.activeRightTab);
  const setActiveRightTab = useUIStore((s) => s.setActiveRightTab);
  const rightPanelOpen = useUIStore((s) => s.rightPanelOpen);
  const closeRightPanel = useUIStore((s) => s.closeRightPanel);
  const openRightPanel = useUIStore((s) => s.openRightPanel);

  // Step 12: on mobile the panel is off-canvas by default (it would otherwise
  // eat the whole screen next to the sidebar). Selecting a node is a clear
  // signal the person wants to edit it, so auto-reveal the drawer then —
  // no separate "open panel" tap required. Desktop ignores this entirely
  // since the panel is always a static column there regardless of the flag.
  useEffect(() => {
    if (selectedNodeId) openRightPanel();
  }, [selectedNodeId, openRightPanel]);

  return (
    <>
      <AnimatePresence>
        {rightPanelOpen && (
          <motion.div
            className="fixed inset-x-0 top-11 bottom-0 z-20 bg-ink/30 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={closeRightPanel}
          />
        )}
      </AnimatePresence>

      <div
        className={`fixed top-11 bottom-0 right-0 z-30 w-72 md:static md:top-auto md:z-auto md:w-56 shrink-0 border-l border-sage bg-offwhite flex flex-col overflow-y-auto thin-scroll transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] md:translate-x-0 ${
          rightPanelOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between md:hidden px-2.5 py-1.5 border-b border-sage shrink-0">
          <span className="text-[11px] font-semibold text-ink uppercase tracking-wide">Node panel</span>
          <button onClick={closeRightPanel} className="text-graphite hover:text-ink">
            <X size={14} />
          </button>
        </div>

        <Section title="Canvas Theme">
          <div className="flex flex-wrap gap-1">
            {Object.entries(CANVAS_THEMES).map(([id, theme]) => (
              <button
                key={id}
                onClick={() => setCanvasTheme(id)}
                className={`text-[10px] px-2 py-1 rounded transition ${
                  canvasTheme === id ? 'bg-accent text-ink' : 'bg-sage/40 text-graphite hover:bg-sage/70'
                }`}
              >
                {theme.label}
              </button>
            ))}
          </div>
        </Section>

        {!node ? (
          <div className="px-2.5 py-4 text-[11px] text-graphite/70">
            Select a node to edit its style, notes, links, and attachments.
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-2.5 py-1.5 bg-sage/30">
              <span className="text-[11px] font-medium truncate">{node.label}</span>
              <button onClick={() => selectNode(null)} className="text-graphite hover:text-ink">
                <X size={13} />
              </button>
            </div>

            <div className="flex border-b border-sage">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveRightTab(tab.id)}
                  className={`flex-1 text-[11px] py-1.5 transition ${
                    activeRightTab === tab.id
                      ? 'text-ink font-medium border-b-2 border-accent -mb-px'
                      : 'text-graphite hover:text-ink'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeRightTab === 'style' && <NodeStylePanel nodeId={selectedNodeId} />}
            {activeRightTab === 'content' && <ContentPanel nodeId={selectedNodeId} />}
            {activeRightTab === 'comments' && <CommentsPanel nodeId={selectedNodeId} />}
          </>
        )}
      </div>
    </>
  );
}
