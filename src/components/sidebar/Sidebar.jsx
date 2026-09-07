import { motion, AnimatePresence } from 'framer-motion';
import { Files, ListTree, History, X } from 'lucide-react';
import { useMindMapStore } from '../../store/mindMapStore.js';
import { useUIStore } from '../../store/uiStore.js';
import WorkspacePanel from '../collab/WorkspacePanel.jsx';
import ActivityLog from '../collab/ActivityLog.jsx';

const TABS = [
  { id: 'maps', label: 'Maps', icon: Files },
  { id: 'nodes', label: 'Nodes', icon: ListTree },
  { id: 'activity', label: 'Activity', icon: History },
];

function NodesList() {
  const nodes = useMindMapStore((s) => s.nodes);
  const selectedNodeId = useMindMapStore((s) => s.selectedNodeId);
  const selectNode = useMindMapStore((s) => s.selectNode);

  const list = Object.values(nodes);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-2 py-1.5 text-[10px] font-semibold text-graphite uppercase tracking-wide">
        All Nodes ({list.length})
      </div>
      <div className="flex-1 overflow-y-auto thin-scroll px-1">
        {list.map((n) => (
          <button
            key={n.id}
            onClick={() => selectNode(n.id)}
            className={`w-full text-left truncate px-2 py-1 rounded text-[12px] mb-0.5 transition ${
              selectedNodeId === n.id ? 'bg-accent text-ink' : 'hover:bg-sage/40 text-graphite'
            }`}
          >
            {n.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const sidebarTab = useUIStore((s) => s.sidebarTab);
  const setSidebarTab = useUIStore((s) => s.setSidebarTab);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const closeSidebar = useUIStore((s) => s.closeSidebar);

  return (
    <>
      {/* Step 12: on mobile (<md) this becomes a slide-over drawer with a
          tap-to-dismiss backdrop; at md+ it's back to a normal static column
          and this backdrop never renders. */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-x-0 top-11 bottom-0 z-20 bg-ink/30 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={closeSidebar}
          />
        )}
      </AnimatePresence>

      <div
        className={`fixed top-11 bottom-0 left-0 z-30 w-64 md:static md:top-auto md:z-auto md:w-48 shrink-0 border-r border-sage bg-offwhite flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex border-b border-sage shrink-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSidebarTab(id)}
              title={label}
              className={`flex-1 flex items-center justify-center gap-1 h-7 text-[10px] transition ${
                sidebarTab === id ? 'text-ink font-medium border-b-2 border-accent -mb-px' : 'text-graphite hover:text-ink'
              }`}
            >
              <Icon size={11} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
          <button
            onClick={closeSidebar}
            title="Close"
            className="md:hidden w-7 h-7 flex items-center justify-center text-graphite hover:text-ink shrink-0"
          >
            <X size={13} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={sidebarTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="flex-1 flex flex-col min-h-0"
          >
            {sidebarTab === 'maps' && (
              <div className="flex-1 flex flex-col min-h-0 overflow-y-auto thin-scroll">
                <WorkspacePanel />
                <div className="flex-1 min-h-0">
                  <NodesList />
                </div>
              </div>
            )}
            {sidebarTab === 'nodes' && <NodesList />}
            {sidebarTab === 'activity' && <ActivityLog />}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
