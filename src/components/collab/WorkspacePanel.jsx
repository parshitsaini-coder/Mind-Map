import { useState } from 'react';
import { FolderPlus, FilePlus, Folder, FileText, Trash2, Pencil, ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore.js';

function MapRow({ map, active, onSwitch, onRename, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(map.name);

  const commit = () => {
    setEditing(false);
    if (name.trim() && name !== map.name) onRename(name.trim());
    else setName(map.name);
  };

  return (
    <div
      className={`group flex items-center gap-1.5 px-2 py-1 rounded text-[11px] cursor-pointer transition ${
        active ? 'bg-accent text-ink' : 'hover:bg-sage/40 text-graphite'
      }`}
      onClick={() => !editing && onSwitch()}
    >
      <FileText size={11} className="shrink-0" />
      {editing ? (
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-white/70 rounded px-1 text-[11px] outline-none"
        />
      ) : (
        <span className="flex-1 truncate">{map.name}</span>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
        className="opacity-0 group-hover:opacity-100 shrink-0 hover:brightness-90"
        title="Rename"
      >
        <Pencil size={10} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="opacity-0 group-hover:opacity-100 shrink-0 hover:brightness-90"
        title="Delete map"
      >
        <Trash2 size={10} />
      </button>
    </div>
  );
}

export default function WorkspacePanel() {
  const maps = useWorkspaceStore((s) => s.maps);
  const folders = useWorkspaceStore((s) => s.folders);
  const activeMapId = useWorkspaceStore((s) => s.activeMapId);
  const switchMap = useWorkspaceStore((s) => s.switchMap);
  const createMap = useWorkspaceStore((s) => s.createMap);
  const renameMap = useWorkspaceStore((s) => s.renameMap);
  const deleteMap = useWorkspaceStore((s) => s.deleteMap);
  const createFolder = useWorkspaceStore((s) => s.createFolder);
  const deleteFolder = useWorkspaceStore((s) => s.deleteFolder);
  const loadDemoMap = useWorkspaceStore((s) => s.loadDemoMap);

  const [collapsedFolders, setCollapsedFolders] = useState({});

  const mapList = Object.values(maps);
  const unfoldered = mapList.filter((m) => !m.folderId);
  const folderList = Object.values(folders);

  return (
    <div className="border-b border-sage flex flex-col max-h-64">
      <div className="flex items-center justify-between px-2 py-1.5">
        <span className="text-[10px] font-semibold text-graphite uppercase tracking-wide">
          Maps ({mapList.length})
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => createFolder()}
            title="New folder"
            className="w-5 h-5 flex items-center justify-center rounded text-graphite hover:bg-sage/50"
          >
            <FolderPlus size={12} />
          </button>
          <button
            onClick={() => createMap()}
            title="New map"
            className="w-5 h-5 flex items-center justify-center rounded text-graphite hover:bg-sage/50"
          >
            <FilePlus size={12} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto thin-scroll px-1 pb-1 space-y-0.5">
        {folderList.map((folder) => {
          const inFolder = mapList.filter((m) => m.folderId === folder.id);
          const collapsed = collapsedFolders[folder.id];
          return (
            <div key={folder.id}>
              <div
                className="group flex items-center gap-1 px-1 py-1 rounded text-[11px] text-graphite hover:bg-sage/30 cursor-pointer"
                onClick={() => setCollapsedFolders((c) => ({ ...c, [folder.id]: !c[folder.id] }))}
              >
                {collapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
                <Folder size={11} />
                <span className="flex-1 truncate font-medium">{folder.name}</span>
                <span className="text-[9px] text-graphite/60">{inFolder.length}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFolder(folder.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 shrink-0"
                  title="Delete folder"
                >
                  <Trash2 size={10} />
                </button>
              </div>
              {!collapsed && (
                <div className="ml-3.5 space-y-0.5">
                  {inFolder.map((m) => (
                    <MapRow
                      key={m.id}
                      map={m}
                      active={m.id === activeMapId}
                      onSwitch={() => switchMap(m.id)}
                      onRename={(name) => renameMap(m.id, name)}
                      onDelete={() => deleteMap(m.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {unfoldered.map((m) => (
          <MapRow
            key={m.id}
            map={m}
            active={m.id === activeMapId}
            onSwitch={() => switchMap(m.id)}
            onRename={(name) => renameMap(m.id, name)}
            onDelete={() => deleteMap(m.id)}
          />
        ))}
      </div>

      <div className="px-2 py-1 text-[9.5px] text-graphite/60 border-t border-sage/60">
        Saved locally in this browser — no account or backend needed.
      </div>
      <button
        onClick={loadDemoMap}
        className="mx-2 mb-2 flex items-center justify-center gap-1 h-6 rounded-md bg-accent/70 hover:bg-accent text-ink text-[10.5px] font-medium transition"
        title="Open a pre-built sample map showing off every layout"
      >
        <Sparkles size={11} /> Load demo map
      </button>
    </div>
  );
}
