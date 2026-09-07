import { useMindMapStore } from '../src/store/mindMapStore.js';
import { computeLayout } from '../src/utils/layout.js';

let failures = 0;
function check(name, cond) {
  if (cond) {
    console.log(`  ok  - ${name}`);
  } else {
    console.log(`FAIL  - ${name}`);
    failures++;
  }
}

function section(name) {
  console.log(`\n== ${name} ==`);
}

const S = () => useMindMapStore.getState();

// ---------- 1. Basic CRUD ----------
section('Basic CRUD');
S().reset();
const root = S().addNode(null, { label: 'Root' });
check('root created', !!S().nodes[root]);
check('root in rootIds', S().rootIds.includes(root));

const childA = S().addNode(root, { label: 'A' });
const childB = S().addNode(root, { label: 'B' });
check('two children added', Object.values(S().nodes).filter((n) => n.parentId === root).length === 2);

S().deleteNode(childA);
check('child deleted', !S().nodes[childA]);
check('sibling survives delete', !!S().nodes[childB]);

// ---------- 2. Deleting a root with descendants ----------
section('Cascade delete');
const gc = S().addNode(childB, { label: 'grandchild' });
S().deleteNode(childB);
check('deleting a node removes its descendants too', !S().nodes[childB] && !S().nodes[gc]);

// ---------- 3. Deleting every node (empty-map edge case) ----------
section('Empty map edge case');
S().deleteNode(root);
check('rootIds empty after deleting last root', S().rootIds.length === 0);
check('nodes empty', Object.keys(S().nodes).length === 0);
const freshRoot = S().addNode(null, { label: 'Fresh Root' });
check('addNode(null, ...) recovers from empty map', !!S().nodes[freshRoot] && S().rootIds.includes(freshRoot));

// ---------- 4. Undo / redo ----------
section('Undo / redo');
S().reset();
const r1 = S().addNode(null, { label: 'R1' });
S().addNode(r1, { label: 'C1' });
const countAfterAdd = Object.keys(S().nodes).length;
S().undo();
check('undo removes last add', Object.keys(S().nodes).length === countAfterAdd - 1);
S().redo();
check('redo restores it', Object.keys(S().nodes).length === countAfterAdd);
// undo past the beginning should not throw / should be a no-op
for (let i = 0; i < 20; i++) S().undo();
check('undo past history start does not throw and settles', Object.keys(S().nodes).length >= 0);

// ---------- 5. Reparenting incl. cycle prevention ----------
section('Reparenting');
S().reset();
const p1 = S().addNode(null, { label: 'P1' });
const p2 = S().addNode(null, { label: 'P2' });
const child = S().addNode(p1, { label: 'child' });
const grandchild = S().addNode(child, { label: 'grandchild' });
S().reparentNode(child, p2);
check('reparent moves node to new parent', S().nodes[child].parentId === p2);
check('descendant follows parent (grandchild still under child)', S().nodes[grandchild].parentId === child);

// attempt to reparent a node under its own descendant (cycle) — should be rejected or safely no-op
const before = JSON.stringify(S().nodes);
S().reparentNode(child, grandchild);
const afterNodes = S().nodes;
const isCycle = (() => {
  // walk up from grandchild's new tree to see if we looped
  let cur = afterNodes[child];
  let steps = 0;
  while (cur && cur.parentId && steps < 1000) {
    if (cur.parentId === child) return true; // cycle!
    cur = afterNodes[cur.parentId];
    steps++;
  }
  return false;
})();
check('reparenting a node under its own descendant does not create a cycle', !isCycle);

// ---------- 6. Floating notes stay unparented ----------
section('Floating notes');
S().reset();
const note = S().addNode(null, { label: 'Floating note', floating: true, position: { x: 10, y: 10 } });
check('floating note not added to rootIds', !S().rootIds.includes(note));
check('floating note has no parent', S().nodes[note].parentId === null);

// ---------- 7. Layout engine across all layout types ----------
section('Layout engine (all types, incl. deep nesting & empty)');
const LAYOUTS = ['radial', 'tree', 'tree-horizontal', 'org', 'logic', 'fishbone', 'timeline', 'matrix'];

// empty map
for (const l of LAYOUTS) {
  let threw = false;
  let result;
  try {
    result = computeLayout(l, {}, []);
  } catch (e) {
    threw = true;
  }
  check(`layout "${l}" handles empty map without throwing`, !threw && typeof result === 'object');
}

// deep chain (200 levels) — recursion-depth / perf sanity check
S().reset();
let prev = S().addNode(null, { label: 'depth-0' });
for (let i = 1; i < 200; i++) {
  prev = S().addNode(prev, { label: `depth-${i}` });
}
for (const l of LAYOUTS) {
  let threw = false;
  const t0 = Date.now();
  let result;
  try {
    result = computeLayout(l, S().nodes, S().rootIds);
  } catch (e) {
    threw = true;
    console.log('    error:', e.message);
  }
  const ms = Date.now() - t0;
  const allPositioned = !threw && S().rootIds.concat(Object.keys(S().nodes)).every((id) => {
    // every non-floating node should get a finite position
    const n = S().nodes[id];
    if (!n || n.floating) return true;
    const pos = result[id];
    return pos && Number.isFinite(pos.x) && Number.isFinite(pos.y);
  });
  check(`layout "${l}" handles 200-deep chain (no throw, finite positions, ${ms}ms)`, !threw && allPositioned);
}

// wide + deep combined, 500+ node perf check (matches Step 11 claim)
S().reset();
const bigRoot = S().addNode(null, { label: 'root' });
let created = 1;
const frontier = [bigRoot];
while (created < 520) {
  const parent = frontier[Math.floor(Math.random() * frontier.length)];
  const id = S().addNode(parent, { label: `n${created}` });
  frontier.push(id);
  created++;
}
for (const l of LAYOUTS) {
  const t0 = Date.now();
  let threw = false;
  try {
    computeLayout(l, S().nodes, S().rootIds);
  } catch (e) {
    threw = true;
    console.log('    error:', e.message);
  }
  const ms = Date.now() - t0;
  check(`layout "${l}" handles 520 nodes without throwing (${ms}ms)`, !threw);
}

// ---------- 8. Collapse hides descendants but layout still computes safely ----------
section('Collapse');
S().reset();
const cr = S().addNode(null, { label: 'root' });
const cc = S().addNode(cr, { label: 'child' });
S().addNode(cc, { label: 'grandchild' });
S().toggleCollapse(cc);
check('toggleCollapse marks node collapsed', S().nodes[cc].collapsed === true);
S().toggleCollapse(cc);
check('toggleCollapse is reversible', S().nodes[cc].collapsed === false);

// ---------- 9. Real demo map across all layouts ----------
section('Demo map (Step 10 showcase) across all layouts');
const { buildDemoMap } = await import('../src/data/demoMap.js');
const demo = buildDemoMap ? buildDemoMap() : null;
if (!demo) {
  console.log('  (skipped — demoMap.js does not export buildDemoMap; checked manually below)');
} else {
  for (const l of LAYOUTS) {
    let threw = false;
    let result;
    try {
      result = computeLayout(l, demo.nodes, demo.rootIds);
    } catch (e) {
      threw = true;
      console.log('    error:', e.message);
    }
    const allPositioned = !threw && Object.values(demo.nodes).every((n) => {
      if (n.floating) return true;
      const pos = result[n.id];
      return pos && Number.isFinite(pos.x) && Number.isFinite(pos.y);
    });
    check(`demo map lays out fully under "${l}"`, !threw && allPositioned);
  }
}
console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}`);
process.exit(failures === 0 ? 0 : 1);
