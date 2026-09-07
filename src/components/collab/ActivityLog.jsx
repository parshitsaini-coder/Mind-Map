import { History, Undo2, Redo2 } from 'lucide-react';
import { useMindMapStore } from '../../store/mindMapStore.js';

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 5) return 'now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export default function ActivityLog() {
  const activityLog = useMindMapStore((s) => s.activityLog);
  const undo = useMindMapStore((s) => s.undo);
  const redo = useMindMapStore((s) => s.redo);
  const canUndo = useMindMapStore((s) => s.history.length > 0);
  const canRedo = useMindMapStore((s) => s.future.length > 0);
  const readOnly = useMindMapStore((s) => s.readOnly);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {!readOnly && (
        <div className="flex items-center gap-1 px-2 py-1.5 border-b border-sage">
          <button
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl/Cmd+Z)"
            className="flex-1 flex items-center justify-center gap-1 h-6 rounded text-[10.5px] text-graphite hover:bg-sage/50 disabled:opacity-30 transition"
          >
            <Undo2 size={12} /> Undo
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl/Cmd+Shift+Z)"
            className="flex-1 flex items-center justify-center gap-1 h-6 rounded text-[10.5px] text-graphite hover:bg-sage/50 disabled:opacity-30 transition"
          >
            <Redo2 size={12} /> Redo
          </button>
        </div>
      )}
      <div className="px-2 py-1.5 text-[10px] font-semibold text-graphite uppercase tracking-wide flex items-center gap-1">
        <History size={11} /> Activity ({activityLog.length})
      </div>
      <div className="flex-1 overflow-y-auto thin-scroll px-2 pb-2 space-y-1">
        {activityLog.length === 0 ? (
          <div className="text-[10.5px] text-graphite/60 px-1">
            Nothing yet — edits to this map will show up here for this session.
          </div>
        ) : (
          activityLog.map((a) => (
            <div key={a.id} className="text-[10.5px] text-graphite leading-snug flex justify-between gap-2">
              <span className="truncate">{a.message}</span>
              <span className="text-graphite/50 shrink-0">{timeAgo(a.at)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
