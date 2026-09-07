import { useMemo, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useMindMapStore } from '../../store/mindMapStore.js';
import { useUIStore, CANVAS_THEMES } from '../../store/uiStore.js';
import { computeLayout, STEP_EDGE_LAYOUTS } from '../../utils/layout.js';
import MindMapNode from '../nodes/MindMapNode.jsx';
import BranchEdge from './BranchEdge.jsx';
import BoundaryGroup from './BoundaryGroup.jsx';
import FocusBar from './FocusBar.jsx';
import SearchPanel from '../search/SearchPanel.jsx';

const nodeTypes = { mindMapNode: MindMapNode, boundaryNode: BoundaryGroup };
const edgeTypes = { branchEdge: BranchEdge };

const BOUNDARY_PAD = 36;
const APPROX_NODE_W = 170;
const APPROX_NODE_H = 40;

// Determine which node ids are visible (i.e. not descendants of a collapsed node).
// When focusRootId is set (Step 8 focus mode), only that node's own subtree is visible.
function getVisibleIds(nodes, rootIds, focusRootId) {
  const visible = new Set();
  const walk = (id) => {
    const node = nodes[id];
    if (!node) return;
    visible.add(id);
    if (node.collapsed) return;
    Object.values(nodes)
      .filter((n) => n.parentId === id)
      .forEach((child) => walk(child.id));
  };

  if (focusRootId && nodes[focusRootId]) {
    walk(focusRootId);
    return visible;
  }

  rootIds.forEach(walk);
  // floating notes are always visible
  Object.values(nodes)
    .filter((n) => n.floating)
    .forEach((n) => visible.add(n.id));
  return visible;
}

function CanvasInner() {
  const storeNodes = useMindMapStore((s) => s.nodes);
  const rootIds = useMindMapStore((s) => s.rootIds);
  const relationships = useMindMapStore((s) => s.relationships);
  const boundaries = useMindMapStore((s) => s.boundaries);
  const layoutType = useMindMapStore((s) => s.layout);
  const selectNode = useMindMapStore((s) => s.selectNode);
  const selectedNodeId = useMindMapStore((s) => s.selectedNodeId);
  const canvasTheme = useUIStore((s) => s.canvasTheme);
  const theme = CANVAS_THEMES[canvasTheme];
  const focusNodeId = useUIStore((s) => s.focusNodeId);
  const reparentNode = useMindMapStore((s) => s.reparentNode);

  const visibleIds = useMemo(
    () => getVisibleIds(storeNodes, rootIds, focusNodeId),
    [storeNodes, rootIds, focusNodeId]
  );
  const positions = useMemo(() => computeLayout(layoutType, storeNodes, rootIds), [layoutType, storeNodes, rootIds]);

  const flowNodes = useMemo(
    () =>
      Object.values(storeNodes)
        .filter((n) => visibleIds.has(n.id))
        .map((n) => ({
          id: n.id,
          type: 'mindMapNode',
          position: n.floating ? n.position : positions[n.id] || n.position,
          data: {
            label: n.label,
            style: n.style,
            taskMeta: n.taskMeta,
            collapsed: n.collapsed,
            notes: n.notes,
            link: n.link,
            videoEmbed: n.videoEmbed,
            attachments: n.attachments,
            direction: layoutType === 'tree-horizontal' || layoutType === 'fishbone' ? 'horizontal' : 'vertical',
          },
          selected: n.id === selectedNodeId,
          draggable: true,
        })),
    [storeNodes, positions, visibleIds, selectedNodeId, layoutType]
  );

  // Boundary/frame grouping — a dashed box/circle drawn behind whichever
  // member nodes are currently visible & positioned, recomputed on every
  // layout switch since node coordinates change.
  const boundaryNodes = useMemo(() => {
    return Object.values(boundaries)
      .map((b) => {
        const memberIds = b.nodeIds.filter((id) => visibleIds.has(id));
        const pts = memberIds.map((id) => (storeNodes[id]?.floating ? storeNodes[id].position : positions[id]));
        const valid = pts.filter(Boolean);
        if (valid.length === 0) return null;
        const minX = Math.min(...valid.map((p) => p.x)) - BOUNDARY_PAD;
        const minY = Math.min(...valid.map((p) => p.y)) - BOUNDARY_PAD;
        const maxX = Math.max(...valid.map((p) => p.x)) + APPROX_NODE_W + BOUNDARY_PAD;
        const maxY = Math.max(...valid.map((p) => p.y)) + APPROX_NODE_H + BOUNDARY_PAD;
        return {
          id: `boundary-${b.id}`,
          type: 'boundaryNode',
          position: { x: minX, y: minY },
          style: { width: maxX - minX, height: maxY - minY, zIndex: -10 },
          data: { label: b.label, color: b.color, shape: b.shape },
          draggable: false,
          selectable: false,
          zIndex: -10,
        };
      })
      .filter(Boolean);
  }, [boundaries, positions, visibleIds, storeNodes]);

  const allFlowNodes = useMemo(() => [...boundaryNodes, ...flowNodes], [boundaryNodes, flowNodes]);

  const orthogonal = STEP_EDGE_LAYOUTS.has(layoutType);

  const flowEdges = useMemo(() => {
    const parentEdges = Object.values(storeNodes)
      .filter((n) => n.parentId && visibleIds.has(n.id) && visibleIds.has(n.parentId))
      .map((n) => ({
        id: `e-${n.parentId}-${n.id}`,
        source: n.parentId,
        target: n.id,
        type: 'branchEdge',
        data: { color: n.style?.branchColor, width: n.style?.branchWidth, orthogonal },
      }));

    const crossEdges = Object.values(relationships)
      .filter((r) => visibleIds.has(r.sourceId) && visibleIds.has(r.targetId))
      .map((r) => ({
        id: r.id,
        source: r.sourceId,
        target: r.targetId,
        type: 'branchEdge',
        label: r.label,
        data: { color: r.color, width: 1.5, dashed: r.style === 'dashed' },
      }));

    return [...parentEdges, ...crossEdges];
  }, [storeNodes, relationships, visibleIds, orthogonal]);

  const onNodeClick = useCallback((_e, node) => selectNode(node.id), [selectNode]);
  const onPaneClick = useCallback(() => selectNode(null), [selectNode]);

  // Step 8 — drag a node onto another node to reparent it (floating notes excluded,
  // since they're meant to stay unconnected).
  const { getIntersectingNodes } = useReactFlow();
  const onNodeDragStop = useCallback(
    (_e, draggedNode) => {
      const source = storeNodes[draggedNode.id];
      if (!source || source.floating) return;
      const overlaps = getIntersectingNodes(draggedNode).filter((n) => n.id !== draggedNode.id && !n.id.startsWith('boundary-'));
      const target = overlaps.find((n) => !storeNodes[n.id]?.floating);
      if (target && target.id !== source.parentId) {
        reparentNode(draggedNode.id, target.id);
      }
    },
    [storeNodes, getIntersectingNodes, reparentNode]
  );

  return (
    <ReactFlow
      nodes={allFlowNodes}
      edges={flowEdges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      onNodeDragStop={onNodeDragStop}
      fitView
      minZoom={0.2}
      maxZoom={2}
      // Step 11 perf: only mount/render nodes & edges currently inside the
      // viewport. On large maps (500+ nodes) this keeps DOM node count and
      // paint cost bounded to what's on screen instead of the whole map.
      onlyRenderVisibleElements
      proOptions={{ hideAttribution: true }}
      style={{ backgroundColor: theme.bg }}
    >
      {theme.variant && <Background color={theme.color} variant={theme.variant} gap={20} size={1} />}
      <Controls showInteractive={false} className="!bottom-2 !left-2 !shadow-none" />
      <FocusBar />
      <SearchPanel />
    </ReactFlow>
  );
}

export default function Canvas() {
  return (
    <div className="flex-1 relative bg-canvas">
      <ReactFlowProvider>
        <CanvasInner />
      </ReactFlowProvider>
    </div>
  );
}
