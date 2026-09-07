import { create } from 'zustand';
import { nanoid } from '../utils/id.js';
import { useMindMapStore } from './mindMapStore.js';
import { buildDemoMap } from '../data/demoMap.js';

// ============================================================
// Team workspaces/folders — Step 9 (local-first collaboration).
// GitHub Pages is a static host, so there is no shared backend:
// each browser has its own local workspace of maps/folders. The
// data shape here is intentionally backend-ready (flat maps +
// folderId refs) so a future Firebase/Supabase sync layer could
// slot in without changing the UI.
// ============================================================

const STORAGE_KEY = 'mindmap:workspace:v1';

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function persist(state) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ maps: state.maps, folders: state.folders, activeMapId: state.activeMapId })
    );
  } catch {
    // localStorage unavailable (private mode / quota) — fail silently, session still works in-memory.
  }
}

function blankMapData() {
  return { nodes: {}, rootIds: [], relationships: {}, boundaries: {} };
}

function makeDefaultMap() {
  const id = nanoid();
  return {
    id,
    map: {
      id,
      name: 'My First Mind Map',
      folderId: null,
      updatedAt: Date.now(),
      data: blankMapData(),
    },
  };
}

const persisted = loadPersisted();
let initialMaps = persisted?.maps || {};
let initialFolders = persisted?.folders || {};
let initialActiveMapId = persisted?.activeMapId || null;

if (Object.keys(initialMaps).length === 0) {
  const { id, map } = makeDefaultMap();
  initialMaps = { [id]: map };
  initialActiveMapId = id;
}
if (!initialActiveMapId || !initialMaps[initialActiveMapId]) {
  initialActiveMapId = Object.keys(initialMaps)[0];
}

export const useWorkspaceStore = create((set, get) => ({
  maps: initialMaps,           // id -> { id, name, folderId, updatedAt, data }
  folders: initialFolders,      // id -> { id, name }
  activeMapId: initialActiveMapId,

  // ---- save/restore current mind-map content into the active map slot ----
  saveActiveMapSnapshot: () => {
    const { activeMapId, maps } = get();
    if (!activeMapId || !maps[activeMapId]) return;
    const mm = useMindMapStore.getState();
    const data = { nodes: mm.nodes, rootIds: mm.rootIds, relationships: mm.relationships, boundaries: mm.boundaries };
    set((state) => {
      const next = {
        maps: { ...state.maps, [activeMapId]: { ...state.maps[activeMapId], data, updatedAt: Date.now() } },
      };
      persist({ ...state, ...next });
      return next;
    });
  },

  switchMap: (mapId) => {
    const state = get();
    if (mapId === state.activeMapId) return;
    // persist whatever's currently open before switching away from it
    get().saveActiveMapSnapshot();
    const target = get().maps[mapId];
    if (!target) return;
    useMindMapStore.getState().loadMap(target.data || blankMapData());
    useMindMapStore.getState().setReadOnly(false);
    set((s) => {
      persist({ ...s, activeMapId: mapId });
      return { activeMapId: mapId };
    });
  },

  createMap: (name = 'Untitled Map', folderId = null) => {
    get().saveActiveMapSnapshot();
    const id = nanoid();
    const map = { id, name, folderId, updatedAt: Date.now(), data: blankMapData() };
    set((state) => {
      const next = { maps: { ...state.maps, [id]: map }, activeMapId: id };
      persist({ ...state, ...next });
      return next;
    });
    useMindMapStore.getState().loadMap(blankMapData());
    useMindMapStore.getState().setReadOnly(false);
    return id;
  },

  renameMap: (mapId, name) =>
    set((state) => {
      if (!state.maps[mapId]) return state;
      const next = { maps: { ...state.maps, [mapId]: { ...state.maps[mapId], name } } };
      persist({ ...state, ...next });
      return next;
    }),

  deleteMap: (mapId) =>
    set((state) => {
      const remaining = { ...state.maps };
      delete remaining[mapId];
      let activeMapId = state.activeMapId;
      if (Object.keys(remaining).length === 0) {
        const { id, map } = makeDefaultMap();
        remaining[id] = map;
        activeMapId = id;
      } else if (activeMapId === mapId) {
        activeMapId = Object.keys(remaining)[0];
      }
      if (activeMapId !== state.activeMapId) {
        useMindMapStore.getState().loadMap(remaining[activeMapId].data || blankMapData());
        useMindMapStore.getState().setReadOnly(false);
      }
      const next = { maps: remaining, activeMapId };
      persist({ ...state, ...next });
      return next;
    }),

  // Step 10 — load the built-in sample map into a fresh, named workspace map.
  loadDemoMap: () => {
    get().saveActiveMapSnapshot();
    const id = nanoid();
    const map = { id, name: 'Demo Mind Map', folderId: null, updatedAt: Date.now(), data: buildDemoMap() };
    set((state) => {
      const next = { maps: { ...state.maps, [id]: map }, activeMapId: id };
      persist({ ...state, ...next });
      return next;
    });
    useMindMapStore.getState().loadMap(map.data);
    useMindMapStore.getState().setReadOnly(false);
    useMindMapStore.getState().setLayout('radial');
    return id;
  },

  createFolder: (name = 'New Folder') =>
    set((state) => {
      const id = nanoid();
      const next = { folders: { ...state.folders, [id]: { id, name } } };
      persist({ ...state, ...next });
      return next;
    }),

  renameFolder: (folderId, name) =>
    set((state) => {
      if (!state.folders[folderId]) return state;
      const next = { folders: { ...state.folders, [folderId]: { ...state.folders[folderId], name } } };
      persist({ ...state, ...next });
      return next;
    }),

  deleteFolder: (folderId) =>
    set((state) => {
      const folders = { ...state.folders };
      delete folders[folderId];
      // maps inside the deleted folder become un-foldered, not deleted
      const maps = Object.fromEntries(
        Object.entries(state.maps).map(([id, m]) => [id, m.folderId === folderId ? { ...m, folderId: null } : m])
      );
      const next = { folders, maps };
      persist({ ...state, ...next });
      return next;
    }),

  moveMapToFolder: (mapId, folderId) =>
    set((state) => {
      if (!state.maps[mapId]) return state;
      const next = { maps: { ...state.maps, [mapId]: { ...state.maps[mapId], folderId } } };
      persist({ ...state, ...next });
      return next;
    }),
}));
