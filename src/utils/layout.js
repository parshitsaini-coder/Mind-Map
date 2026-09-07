// Pure layout functions: given the node dictionary + root ids, return
// a map of id -> {x, y}. Collapsed branches are skipped (their descendants
// are not laid out / rendered).
//
// PERFORMANCE (Step 11): every layout walks the tree and repeatedly asks
// "who are this node's children?". The naive way — `Object.values(nodes)
// .filter(n => n.parentId === id)` — rescans *every* node in the map on
// every single call. Called recursively down a tree that's itself O(n)
// deep/wide, that degrades to O(n^2)-O(n^3): a 500-node map took ~300ms
// per layout pass, and 2,000 nodes took over 8 seconds — enough to freeze
// the tab on every edit, drag, or layout switch. Building a parent->children
// index once per computeLayout() call (O(n)) and reusing it drops 500 nodes
// to ~1.5ms and keeps 5,000 nodes under 25ms.

function buildChildIndex(nodes) {
  const byParent = new Map();
  for (const n of Object.values(nodes)) {
    if (n.floating) continue;
    const list = byParent.get(n.parentId);
    if (list) list.push(n);
    else byParent.set(n.parentId, [n]);
  }
  for (const list of byParent.values()) list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return byParent;
}

function getChildrenFromIndex(byParent, parentId) {
  return byParent.get(parentId) || [];
}

// Visible-leaf counts are also reused many times per node as we walk down
// (once per sibling, at every ancestor level) — cache them per layout pass.
function makeLeafCounter(byParent) {
  const cache = new Map();
  return function countVisibleLeaves(node) {
    const cached = cache.get(node.id);
    if (cached !== undefined) return cached;
    let result;
    if (node.collapsed) {
      result = 1;
    } else {
      const children = getChildrenFromIndex(byParent, node.id);
      result = children.length === 0 ? 1 : children.reduce((sum, c) => sum + countVisibleLeaves(c), 0);
    }
    cache.set(node.id, result);
    return result;
  };
}

/**
 * RADIAL LAYOUT
 * Each root gets an angular sector (2π / rootCount) if there are multiple
 * central topics, spaced far enough apart. Within a root's sector, each
 * subtree gets an angular slice proportional to its visible leaf count.
 * Radius grows per depth level.
 */
export function computeRadialLayout(nodes, rootIds, opts = {}) {
  const { levelRadius = 190, rootSpacing = 900 } = opts;
  const positions = {};
  const byParent = buildChildIndex(nodes);
  const countVisibleLeaves = makeLeafCounter(byParent);

  rootIds.forEach((rootId, rootIndex) => {
    const root = nodes[rootId];
    if (!root) return;
    const centerX = (rootIndex - (rootIds.length - 1) / 2) * rootSpacing;
    const centerY = 0;
    positions[rootId] = { x: centerX, y: centerY };

    const place = (node, angleStart, angleEnd, depth) => {
      if (node.collapsed) return;
      const children = getChildrenFromIndex(byParent, node.id);
      if (children.length === 0) return;

      const totalLeaves = children.reduce((s, c) => s + countVisibleLeaves(c), 0);
      let angleCursor = angleStart;
      const radius = levelRadius * depth;

      children.forEach((child) => {
        const leaves = countVisibleLeaves(child);
        const slice = ((angleEnd - angleStart) * leaves) / totalLeaves;
        const angle = angleCursor + slice / 2;
        positions[child.id] = {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        };
        place(child, angleCursor, angleCursor + slice, depth + 1);
        angleCursor += slice;
      });
    };

    place(root, 0, Math.PI * 2, 1);
  });

  return positions;
}

/**
 * TREE LAYOUT (tidy-ish)
 * direction: 'vertical' (top-down) or 'horizontal' (left-right)
 * Leaves are spread evenly along the cross-axis; parents are centered
 * over their children's midpoint.
 */
export function computeTreeLayout(nodes, rootIds, opts = {}) {
  const { levelGap = 170, leafGap = 90, direction = 'vertical', rootSpacing = 260 } = opts;
  const positions = {};
  const byParent = buildChildIndex(nodes);
  let cursor = 0; // running cross-axis offset shared across all roots

  const place = (node, depth) => {
    const children = node.collapsed ? [] : getChildrenFromIndex(byParent, node.id);
    let cross;
    if (children.length === 0) {
      cross = cursor;
      cursor += leafGap;
    } else {
      const childCrosses = children.map((c) => place(c, depth + 1));
      cross = (childCrosses[0] + childCrosses[childCrosses.length - 1]) / 2;
    }
    const along = depth * levelGap;
    positions[node.id] =
      direction === 'vertical' ? { x: cross, y: along } : { x: along, y: cross };
    return cross;
  };

  rootIds.forEach((rootId) => {
    const root = nodes[rootId];
    if (!root) return;
    place(root, 0);
    cursor += rootSpacing; // gap before next root's subtree
  });

  return positions;
}

/**
 * ORG CHART
 * Same tidy top-down structure as the vertical tree, but with tighter,
 * uniform level spacing and no leaf-only compression — reads like a
 * reporting hierarchy rather than an idea map.
 */
export function computeOrgLayout(nodes, rootIds) {
  return computeTreeLayout(nodes, rootIds, { direction: 'vertical', levelGap: 140, leafGap: 110, rootSpacing: 200 });
}

/**
 * LOGIC CHART
 * Top-down tree, identical positioning to org chart; visually
 * differentiated in Canvas.jsx via orthogonal (step) connectors.
 */
export function computeLogicChartLayout(nodes, rootIds) {
  return computeTreeLayout(nodes, rootIds, { direction: 'vertical', levelGap: 150, leafGap: 100, rootSpacing: 220 });
}

/**
 * FISHBONE (cause & effect)
 * A horizontal spine runs to the root ("effect") on the right. Each
 * root's direct children ("causes") alternate above/below the spine,
 * evenly spaced along it. Each cause's own children extend outward
 * along a diagonal rib away from the spine.
 */
export function computeFishboneLayout(nodes, rootIds, opts = {}) {
  const { spineSegment = 220, ribGap = 90, ribLength = 130 } = opts;
  const positions = {};
  const byParent = buildChildIndex(nodes);
  let spineOffset = 0;

  rootIds.forEach((rootId) => {
    const root = nodes[rootId];
    if (!root) return;
    const causes = getChildrenFromIndex(byParent, rootId);
    const spineLength = Math.max(causes.length, 1) * spineSegment;
    const spineY = 0;

    // Root ("effect") sits at the right end of this spine.
    positions[rootId] = { x: spineOffset + spineLength + spineSegment, y: spineY };

    causes.forEach((cause, i) => {
      const above = i % 2 === 0;
      const spineX = spineOffset + (i + 1) * spineSegment;
      const dir = above ? -1 : 1;
      positions[cause.id] = { x: spineX, y: spineY + dir * ribGap };

      if (!cause.collapsed) {
        const subCauses = getChildrenFromIndex(byParent, cause.id);
        subCauses.forEach((sub, j) => {
          positions[sub.id] = {
            x: spineX - ribLength * 0.4 * (j + 1),
            y: spineY + dir * (ribGap + ribLength * 0.5 * (j + 1)),
          };
        });
      }
    });

    spineOffset += spineLength + spineSegment * 2 + 300; // gap before next root's fishbone
  });

  return positions;
}

/**
 * TIMELINE
 * Roots/top-level nodes are ordered left-to-right along a single
 * horizontal axis (by dueDate when present, otherwise insertion order).
 * Each node's children fan out vertically below it as sub-events.
 */
export function computeTimelineLayout(nodes, rootIds, opts = {}) {
  const { xGap = 220, childGap = 70 } = opts;
  const positions = {};
  const byParent = buildChildIndex(nodes);

  const ordered = [...rootIds].sort((a, b) => {
    const da = nodes[a]?.taskMeta?.dueDate;
    const db = nodes[b]?.taskMeta?.dueDate;
    if (da && db) return new Date(da) - new Date(db);
    if (da) return -1;
    if (db) return 1;
    return 0;
  });

  ordered.forEach((rootId, i) => {
    const root = nodes[rootId];
    if (!root) return;
    const x = i * xGap;
    positions[rootId] = { x, y: 0 };
    if (root.collapsed) return;
    const children = getChildrenFromIndex(byParent, rootId);
    children.forEach((child, j) => {
      positions[child.id] = { x: x + (j - (children.length - 1) / 2) * 40, y: (j + 1) * childGap + 60 };
    });
  });

  return positions;
}

/**
 * MATRIX / 2D
 * Simple grid: root-level nodes become column headers along the top,
 * their children stack vertically as rows beneath each column.
 * (A true 2-axis categorization needs richer per-node metadata than
 * the current schema carries — this gives an honest grid approximation.)
 */
export function computeMatrixLayout(nodes, rootIds, opts = {}) {
  const { colGap = 200, rowGap = 70 } = opts;
  const positions = {};
  const byParent = buildChildIndex(nodes);

  rootIds.forEach((rootId, col) => {
    const root = nodes[rootId];
    if (!root) return;
    positions[rootId] = { x: col * colGap, y: 0 };
    if (root.collapsed) return;
    const children = getChildrenFromIndex(byParent, rootId);
    children.forEach((child, row) => {
      positions[child.id] = { x: col * colGap, y: (row + 1) * rowGap + 50 };
    });
  });

  return positions;
}

// SAFETY NET (Step 13 bug fix): fishbone/timeline/matrix are intentionally
// shallow layouts — they only give explicit coordinates to a root and its
// first one or two levels of descendants (that's what makes them read as a
// fishbone/timeline/grid instead of a generic tree). But nodes can be nested
// arbitrarily deep in the data model regardless of which layout is active,
// and a node with no computed position was silently falling back to
// `n.position` in Canvas.jsx — usually wherever it happened to be created,
// which meant deep descendants rendered stacked on top of each other/at the
// origin instead of getting a real spot on the canvas. This walks the tree
// breadth-first and gives every node without a position a small cascading
// offset from its (now-positioned) parent, so nothing is ever left unplaced.
function fillMissingPositions(nodes, rootIds, positions) {
  const byParent = buildChildIndex(nodes);
  const queue = [...rootIds];
  const visited = new Set(queue);
  while (queue.length) {
    const id = queue.shift();
    const node = nodes[id];
    if (!node || node.collapsed) continue;
    const children = getChildrenFromIndex(byParent, id);
    children.forEach((child, i) => {
      if (!positions[child.id]) {
        const parentPos = positions[id] || { x: 0, y: 0 };
        positions[child.id] = { x: parentPos.x + 40 + i * 26, y: parentPos.y + 70 };
      }
      if (!visited.has(child.id)) {
        visited.add(child.id);
        queue.push(child.id);
      }
    });
  }
  return positions;
}

export function computeLayout(layoutType, nodes, rootIds) {
  let positions;
  switch (layoutType) {
    case 'tree':
      positions = computeTreeLayout(nodes, rootIds, { direction: 'vertical' });
      break;
    case 'tree-horizontal':
      positions = computeTreeLayout(nodes, rootIds, { direction: 'horizontal' });
      break;
    case 'org':
      positions = computeOrgLayout(nodes, rootIds);
      break;
    case 'logic':
      positions = computeLogicChartLayout(nodes, rootIds);
      break;
    case 'fishbone':
      positions = computeFishboneLayout(nodes, rootIds);
      break;
    case 'timeline':
      positions = computeTimelineLayout(nodes, rootIds);
      break;
    case 'matrix':
      positions = computeMatrixLayout(nodes, rootIds);
      break;
    case 'radial':
    default:
      positions = computeRadialLayout(nodes, rootIds);
  }
  return fillMissingPositions(nodes, rootIds, positions);
}

// Layouts that read best with orthogonal (right-angle step) connectors
// rather than smooth bezier curves.
export const STEP_EDGE_LAYOUTS = new Set(['org', 'logic', 'matrix']);
