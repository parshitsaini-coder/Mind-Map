import { create } from 'zustand';
import { nanoid } from '../utils/id.js';

/**
 * NODE SHAPE
 * {
 *   id: string,
 *   parentId: string | null,       // null for root/central topics & floating notes
 *   label: string,
 *   position: { x, y },            // canvas coordinates
 *   style: {
 *     shape: 'rectangle' | 'oval' | 'cloud' | 'hexagon' | 'none',
 *     color: string,               // fill
 *     branchColor: string,         // connector color to parent
 *     branchWidth: number,
 *     icon: string | null,         // lucide icon name
 *     image: string | null,        // data URL / uploaded image
 *   },
 *   notes: string,                 // rich text detail panel content
 *   collapsed: boolean,
 *   floating: boolean,             // true = unconnected note, ignores parentId layout
 *   taskMeta: {
 *     todo: boolean,
 *     done: boolean,
 *     priority: number | null,     // 1-9
 *     progress: number,            // 0-100
 *     dueDate: string | null,
 *     assignee: string | null,
 *   },
 *   attachments: [{ id, name, type, url }],
 *   comments: [{ id, author, text, mentions: string[], createdAt }],
 * }
 *
 * RELATIONSHIP (cross-branch, non parent-child)
 * { id, sourceId, targetId, label, color, style: 'solid'|'dashed' }
 *
 * BOUNDARY (frame grouping)
 * { id, nodeIds: string[], label, color, shape: 'box'|'circle' }
 */

const MAX_HISTORY = 60;
const MAX_ACTIVITY = 100;

const createNode = (overrides = {}) => ({
  id: nanoid(),
  parentId: null,
  order: 0,
  label: 'New Node',
  position: { x: 0, y: 0 },
  style: {
    shape: 'rectangle',
    color: '#e8eddf',
    branchColor: '#333533',
    branchWidth: 2,
    icon: null,
    image: null,
    emoji: null,
  },
  notes: '',        // rich text (HTML) detail content
  link: null,       // { url, label }
  videoEmbed: null, // video URL (YouTube/Vimeo/mp4) to preview in the content panel
  comments: [],     // Step 9 — comments & @mentions
  collapsed: false,
  floating: false,
  taskMeta: {
    todo: false,
    done: false,
    priority: null,
    progress: 0,
    dueDate: null,
    assignee: null,
    starred: false,
  },
  attachments: [],
  ...overrides,
});

// Snapshot of just the "map content" — what undo/redo and workspace save/load care about.
function snapshotOf(state) {
  return {
    nodes: state.nodes,
    rootIds: state.rootIds,
    relationships: state.relationships,
    boundaries: state.boundaries,
  };
}

export const useMindMapStore = create((set, get) => ({
  // ---- state ----
  nodes: {},          // id -> node
  rootIds: [],         // ids of central topics (top-level, parentId === null, floating === false)
  relationships: {},   // id -> relationship
  boundaries: {},       // id -> boundary
  layout: 'radial',     // active layout mode
  selectedNodeId: null,
  history: [],          // undo stack — array of past snapshots
  future: [],           // redo stack — array of undone snapshots
  activityLog: [],       // Step 9 — local session activity feed: { id, message, at }
  readOnly: false,        // Step 9 — true when viewing a "view-only" shared-link map

  // ---- internal helpers (Step 9: undo/redo + activity log) ----
  _pushHistory: () =>
    set((state) => ({
      history: [...state.history.slice(-MAX_HISTORY + 1), snapshotOf(state)],
      future: [],
    })),

  _logActivity: (message) =>
    set((state) => ({
      activityLog: [{ id: nanoid(), message, at: Date.now() }, ...state.activityLog].slice(0, MAX_ACTIVITY),
    })),

  undo: () =>
    set((state) => {
      if (state.readOnly || state.history.length === 0) return state;
      const previous = state.history[state.history.length - 1];
      const newHistory = state.history.slice(0, -1);
      const currentSnap = snapshotOf(state);
      return {
        ...previous,
        history: newHistory,
        future: [currentSnap, ...state.future].slice(0, MAX_HISTORY),
        activityLog: [{ id: nanoid(), message: 'Undo', at: Date.now() }, ...state.activityLog].slice(0, MAX_ACTIVITY),
      };
    }),

  redo: () =>
    set((state) => {
      if (state.readOnly || state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      const currentSnap = snapshotOf(state);
      return {
        ...next,
        history: [...state.history, currentSnap].slice(-MAX_HISTORY),
        future: newFuture,
        activityLog: [{ id: nanoid(), message: 'Redo', at: Date.now() }, ...state.activityLog].slice(0, MAX_ACTIVITY),
      };
    }),

  setReadOnly: (readOnly) => set({ readOnly }),

  // ---- CRUD: nodes ----
  addNode: (parentId = null, overrides = {}) => {
    if (get().readOnly) return null;
    let newId;
    get()._pushHistory();
    set((state) => {
      const siblingCount = Object.values(state.nodes).filter((n) => n.parentId === parentId).length;
      const node = createNode({ parentId, order: siblingCount, ...overrides });
      newId = node.id;
      const nodes = { ...state.nodes, [node.id]: node };
      const rootIds = parentId === null && !node.floating
        ? [...state.rootIds, node.id]
        : state.rootIds;
      return { nodes, rootIds };
    });
    get()._logActivity(`Added node "${overrides.label || 'New Node'}"`);
    return newId;
  },

  updateNode: (id, patch) => {
    if (get().readOnly) return;
    const existing = get().nodes[id];
    get()._pushHistory();
    set((state) => {
      const existing = state.nodes[id];
      if (!existing) return state;
      return {
        nodes: {
          ...state.nodes,
          [id]: { ...existing, ...patch, style: { ...existing.style, ...(patch.style || {}) }, taskMeta: { ...existing.taskMeta, ...(patch.taskMeta || {}) } },
        },
      };
    });
    if (existing && patch.label && patch.label !== existing.label) {
      get()._logActivity(`Renamed "${existing.label}" → "${patch.label}"`);
    } else if (existing) {
      get()._logActivity(`Edited "${existing.label}"`);
    }
  },

  deleteNode: (id) => {
    if (get().readOnly) return;
    const existing = get().nodes[id];
    get()._pushHistory();
    set((state) => {
      const idsToDelete = collectSubtreeIds(state.nodes, id);
      const nodes = { ...state.nodes };
      idsToDelete.forEach((nid) => delete nodes[nid]);
      const rootIds = state.rootIds.filter((rid) => !idsToDelete.includes(rid));
      // clean up relationships/boundaries referencing deleted nodes
      const relationships = Object.fromEntries(
        Object.entries(state.relationships).filter(
          ([, r]) => !idsToDelete.includes(r.sourceId) && !idsToDelete.includes(r.targetId)
        )
      );
      const boundaries = Object.fromEntries(
        Object.entries(state.boundaries).map(([bid, b]) => [
          bid,
          { ...b, nodeIds: b.nodeIds.filter((nid) => !idsToDelete.includes(nid)) },
        ]).filter(([, b]) => b.nodeIds.length > 0)
      );
      return { nodes, rootIds, relationships, boundaries };
    });
    if (existing) get()._logActivity(`Deleted "${existing.label}"`);
  },

  moveNode: (id, newParentId) => {
    if (get().readOnly) return;
    get()._pushHistory();
    set((state) => {
      const node = state.nodes[id];
      if (!node) return state;
      const wasRoot = node.parentId === null && !node.floating;
      const willBeRoot = newParentId === null && !node.floating;
      let rootIds = state.rootIds;
      if (wasRoot && !willBeRoot) rootIds = rootIds.filter((r) => r !== id);
      if (!wasRoot && willBeRoot) rootIds = [...rootIds, id];
      return {
        nodes: { ...state.nodes, [id]: { ...node, parentId: newParentId } },
        rootIds,
      };
    });
    get()._logActivity('Moved a node');
  },

  toggleCollapse: (id) => {
    // Purely visual — not undo/activity worthy, keeps history clean.
    set((state) => {
      const node = state.nodes[id];
      if (!node) return state;
      return { nodes: { ...state.nodes, [id]: { ...node, collapsed: !node.collapsed } } };
    });
  },

  setNodePosition: (id, position) => {
    // Continuous drag updates — intentionally NOT pushed to undo history (would flood it).
    if (get().readOnly) return;
    set((state) => {
      const node = state.nodes[id];
      if (!node) return state;
      return { nodes: { ...state.nodes, [id]: { ...node, position } } };
    });
  },

  // ---- CRUD: relationships (cross-branch lines) ----
  addRelationship: (sourceId, targetId, overrides = {}) => {
    if (get().readOnly) return null;
    const id = nanoid();
    const rel = { id, sourceId, targetId, label: '', color: '#f5cb5c', style: 'dashed', ...overrides };
    get()._pushHistory();
    set((state) => ({ relationships: { ...state.relationships, [id]: rel } }));
    get()._logActivity('Added a connector line');
    return id;
  },

  deleteRelationship: (id) => {
    if (get().readOnly) return;
    get()._pushHistory();
    set((state) => {
      const relationships = { ...state.relationships };
      delete relationships[id];
      return { relationships };
    });
    get()._logActivity('Removed a connector line');
  },

  // ---- CRUD: boundaries ----
  addBoundary: (nodeIds, overrides = {}) => {
    if (get().readOnly) return null;
    const id = nanoid();
    const boundary = { id, nodeIds, label: '', color: '#cfdbd5', shape: 'box', ...overrides };
    get()._pushHistory();
    set((state) => ({ boundaries: { ...state.boundaries, [id]: boundary } }));
    get()._logActivity('Added a boundary group');
    return id;
  },

  // ---- CRUD: attachments (files / audio / etc, stored inline as data URLs) ----
  addAttachment: (nodeId, attachment) => {
    if (get().readOnly) return;
    get()._pushHistory();
    set((state) => {
      const node = state.nodes[nodeId];
      if (!node) return state;
      const withId = { id: nanoid(), ...attachment };
      return { nodes: { ...state.nodes, [nodeId]: { ...node, attachments: [...node.attachments, withId] } } };
    });
    get()._logActivity(`Attached "${attachment.name}"`);
  },

  removeAttachment: (nodeId, attachmentId) => {
    if (get().readOnly) return;
    get()._pushHistory();
    set((state) => {
      const node = state.nodes[nodeId];
      if (!node) return state;
      return {
        nodes: {
          ...state.nodes,
          [nodeId]: { ...node, attachments: node.attachments.filter((a) => a.id !== attachmentId) },
        },
      };
    });
    get()._logActivity('Removed an attachment');
  },

  // ---- Comments & @mentions (Step 9 — local-first collaboration) ----
  addComment: (nodeId, text, author = 'You') => {
    if (get().readOnly || !text.trim()) return null;
    const mentions = Array.from(text.matchAll(/@(\w[\w-]*)/g)).map((m) => m[1]);
    const id = nanoid();
    const comment = { id, author, text: text.trim(), mentions, createdAt: Date.now() };
    set((state) => {
      const node = state.nodes[nodeId];
      if (!node) return state;
      return { nodes: { ...state.nodes, [nodeId]: { ...node, comments: [...node.comments, comment] } } };
    });
    const node = get().nodes[nodeId];
    get()._logActivity(
      `${author} commented on "${node?.label || 'a node'}"${mentions.length ? ` (mentioned ${mentions.map((m) => '@' + m).join(', ')})` : ''}`
    );
    return id;
  },

  deleteComment: (nodeId, commentId) => {
    if (get().readOnly) return;
    set((state) => {
      const node = state.nodes[nodeId];
      if (!node) return state;
      return { nodes: { ...state.nodes, [nodeId]: { ...node, comments: node.comments.filter((c) => c.id !== commentId) } } };
    });
  },

  // ---- selection / layout ----
  selectNode: (id) => set({ selectedNodeId: id }),
  setLayout: (layout) => set({ layout }),

  // ---- sibling reordering (Step 8 — drag & keyboard reorder) ----
  reorderSibling: (id, direction) => {
    if (get().readOnly) return;
    get()._pushHistory();
    set((state) => {
      const node = state.nodes[id];
      if (!node) return state;
      const siblings = Object.values(state.nodes)
        .filter((n) => n.parentId === node.parentId && !n.floating)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const idx = siblings.findIndex((s) => s.id === id);
      const swapIdx = idx + direction;
      if (swapIdx < 0 || swapIdx >= siblings.length) return state;
      const a = siblings[idx];
      const b = siblings[swapIdx];
      return {
        nodes: {
          ...state.nodes,
          [a.id]: { ...a, order: b.order },
          [b.id]: { ...b, order: a.order },
        },
      };
    });
  },

  // Reparent a node under a new parent, appended after that parent's existing children.
  reparentNode: (id, newParentId) => {
    if (get().readOnly) return;
    get()._pushHistory();
    set((state) => {
      const node = state.nodes[id];
      if (!node || id === newParentId) return state;
      // guard against dropping a node onto its own descendant
      const isDescendant = (candidateId) => collectSubtreeIds(state.nodes, id).includes(candidateId);
      if (newParentId !== null && isDescendant(newParentId)) return state;

      const wasRoot = node.parentId === null && !node.floating;
      const willBeRoot = newParentId === null && !node.floating;
      let rootIds = state.rootIds;
      if (wasRoot && !willBeRoot) rootIds = rootIds.filter((r) => r !== id);
      if (!wasRoot && willBeRoot) rootIds = [...rootIds, id];

      const newSiblingCount = Object.values(state.nodes).filter(
        (n) => n.parentId === newParentId && n.id !== id
      ).length;

      return {
        nodes: { ...state.nodes, [id]: { ...node, parentId: newParentId, order: newSiblingCount } },
        rootIds,
      };
    });
    get()._logActivity('Reorganized the map (drag & drop)');
  },

  // ---- bulk load (used for demo map / import / workspace switch / shared link) ----
  loadMap: ({ nodes, rootIds, relationships = {}, boundaries = {} }) =>
    set({ nodes, rootIds, relationships, boundaries, selectedNodeId: null, history: [], future: [] }),

  reset: () => set({ nodes: {}, rootIds: [], relationships: {}, boundaries: {}, selectedNodeId: null, history: [], future: [] }),
}));

function collectSubtreeIds(nodes, rootId) {
  const ids = [rootId];
  const children = Object.values(nodes).filter((n) => n.parentId === rootId);
  children.forEach((c) => ids.push(...collectSubtreeIds(nodes, c.id)));
  return ids;
}

// ---- pure tree-navigation helpers (used by keyboard shortcuts / outline view) ----

export function getOrderedChildren(nodes, parentId) {
  return Object.values(nodes)
    .filter((n) => n.parentId === parentId && !n.floating)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function getOrderedRoots(nodes, rootIds) {
  return [...rootIds]
    .map((id) => nodes[id])
    .filter(Boolean)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function getSiblingNode(nodes, rootIds, id, direction) {
  const node = nodes[id];
  if (!node) return null;
  const siblings =
    node.parentId === null ? getOrderedRoots(nodes, rootIds) : getOrderedChildren(nodes, node.parentId);
  const idx = siblings.findIndex((s) => s.id === id);
  const target = siblings[idx + direction];
  return target || null;
}

// Depth-first, visually-ordered walk of the whole map (skips collapsed subtrees' children).
export function getDFSOrder(nodes, rootIds) {
  const order = [];
  const walk = (id) => {
    const node = nodes[id];
    if (!node) return;
    order.push(id);
    if (node.collapsed) return;
    getOrderedChildren(nodes, id).forEach((c) => walk(c.id));
  };
  getOrderedRoots(nodes, rootIds).forEach((r) => walk(r.id));
  return order;
}

export { createNode };
