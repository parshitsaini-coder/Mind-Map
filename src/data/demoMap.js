import { createNode } from '../store/mindMapStore.js';
import { nanoid } from '../utils/id.js';

// ============================================================
// Demo / Sample Mind Map — Step 10.
//
// A ready-made "Company Strategy" map sized to show off every
// layout (radial/tree/org/fishbone/timeline/matrix/logic), with
// enough breadth+depth, icons, emoji, stickers/badges, a floating
// note, 2 boundary groupings, and 16 cross-branch connector lines
// (comfortably over the 15+ requirement) so the design reads
// instantly without the user having to build anything first.
// ============================================================

export function buildDemoMap() {
  const nodes = {};
  const byKey = {}; // short readable key -> generated node id

  // Adds a node, registers it under `key` for later relationship/boundary lookups.
  function addNode(key, parentId, order, overrides) {
    const node = createNode({ parentId, order, ...overrides });
    nodes[node.id] = node;
    byKey[key] = node.id;
    return node.id;
  }

  // ---- Central topic ----
  const rootId = addNode('root', null, 0, {
    label: 'Company Strategy — 2026',
    position: { x: 0, y: 0 },
    style: { shape: 'oval', color: '#f5cb5c', icon: 'Target' },
  });

  // ---- Top-level branches ----
  const productId = addNode('product', rootId, 0, {
    label: 'Product',
    style: { branchColor: '#f5cb5c', shape: 'rectangle', icon: 'Lightbulb', color: '#e8eddf' },
  });
  const engId = addNode('eng', rootId, 1, {
    label: 'Engineering',
    style: { branchColor: '#333533', shape: 'rectangle', icon: 'Settings', color: '#e8eddf' },
  });
  const marketingId = addNode('marketing', rootId, 2, {
    label: 'Marketing',
    style: { branchColor: '#f5cb5c', shape: 'rectangle', icon: 'Rocket', color: '#e8eddf' },
  });
  const salesId = addNode('sales', rootId, 3, {
    label: 'Sales',
    style: { branchColor: '#333533', shape: 'rectangle', icon: 'Briefcase', color: '#e8eddf' },
  });
  const opsId = addNode('ops', rootId, 4, {
    label: 'Operations',
    style: { branchColor: '#cfdbd5', shape: 'rectangle', icon: 'Globe', color: '#e8eddf' },
  });
  const financeId = addNode('finance', rootId, 5, {
    label: 'Finance',
    style: { branchColor: '#cfdbd5', shape: 'rectangle', icon: 'Calendar', color: '#e8eddf' },
  });

  // ---- Product branch ----
  addNode('mobileRedesign', productId, 0, {
    label: 'Mobile App Redesign',
    style: { shape: 'rectangle', color: '#e8eddf' },
    taskMeta: { todo: true, done: false, priority: 1, progress: 70, dueDate: '2026-09-30', assignee: 'Riya' },
    notes: 'Full redesign of onboarding + navigation. Design review scheduled.',
  });
  addNode('aiFeature', productId, 1, {
    label: 'AI Feature Rollout',
    style: { shape: 'oval', color: '#e8eddf', emoji: '🤖' },
    taskMeta: { priority: 2, progress: 40, starred: true },
  });
  addNode('betaFeedback', productId, 2, {
    label: 'Beta Feedback Loop',
    style: { shape: 'rectangle', icon: 'CheckCircle', color: '#e8eddf' },
    taskMeta: { progress: 55 },
  });
  addNode('designSystem', byKey.mobileRedesign, 0, {
    label: 'Design System',
    style: { shape: 'none' },
  });
  addNode('userTesting', byKey.mobileRedesign, 1, {
    label: 'User Testing',
    style: { shape: 'none' },
    taskMeta: { todo: true, done: true },
  });

  // ---- Engineering branch ----
  addNode('infraMigration', engId, 0, {
    label: 'Infra Migration',
    style: { shape: 'rectangle', icon: 'Zap', color: '#e8eddf' },
    taskMeta: { priority: 1, progress: 55, dueDate: '2026-10-15', assignee: 'Dev' },
  });
  addNode('techDebt', engId, 1, {
    label: 'Tech Debt Cleanup',
    style: { shape: 'rectangle', color: '#e8eddf' },
    taskMeta: { progress: 20 },
  });
  addNode('apiV2', engId, 2, {
    label: 'API v2',
    style: { shape: 'hexagon', color: '#e8eddf' },
    taskMeta: { todo: true, done: true },
  });

  // ---- Marketing branch ----
  addNode('launchCampaign', marketingId, 0, {
    label: 'Launch Campaign',
    style: { shape: 'rectangle', icon: 'Flag', color: '#e8eddf' },
    taskMeta: { priority: 1, progress: 30, dueDate: '2026-09-20', assignee: 'Marketing' },
  });
  addNode('contentCalendar', marketingId, 1, {
    label: 'Content Calendar',
    style: { shape: 'cloud', color: '#e8eddf', emoji: '📅' },
  });
  addNode('influencer', marketingId, 2, {
    label: 'Influencer Outreach',
    style: { shape: 'rectangle', color: '#e8eddf' },
    taskMeta: { starred: true, progress: 45 },
  });
  addNode('socialAds', byKey.launchCampaign, 0, { label: 'Social Ads', style: { shape: 'none' } });
  addNode('pressRelease', byKey.launchCampaign, 1, { label: 'Press Release', style: { shape: 'none' } });

  // ---- Sales branch ----
  addNode('q3Revenue', salesId, 0, {
    label: 'Q3 Revenue Target',
    style: { shape: 'rectangle', icon: 'CheckCircle', color: '#e8eddf' },
    taskMeta: { progress: 65 },
  });
  addNode('enterpriseDeals', salesId, 1, {
    label: 'Enterprise Deals',
    style: { shape: 'rectangle', color: '#e8eddf' },
    taskMeta: { priority: 2, progress: 35 },
  });
  addNode('renewals', salesId, 2, {
    label: 'Renewal Pipeline',
    style: { shape: 'rectangle', color: '#e8eddf' },
  });

  // ---- Operations branch ----
  addNode('vendorContracts', opsId, 0, {
    label: 'Vendor Contracts',
    style: { shape: 'rectangle', color: '#e8eddf' },
  });
  addNode('officeExpansion', opsId, 1, {
    label: 'Office Expansion',
    style: { shape: 'rectangle', icon: 'Home', color: '#e8eddf' },
    taskMeta: { progress: 15 },
  });

  // ---- Finance branch ----
  addNode('budgetReview', financeId, 0, {
    label: 'Budget Review',
    style: { shape: 'rectangle', color: '#e8eddf' },
    taskMeta: { progress: 90 },
  });
  addNode('runway', financeId, 1, {
    label: 'Runway Planning',
    style: { shape: 'rectangle', color: '#e8eddf' },
    taskMeta: { priority: 1, starred: true, progress: 50 },
  });

  const rootIds = [rootId];

  // ---- Floating (unconnected) notes ----
  const float1 = createNode({
    label: 'Idea: partner with a logistics co-op',
    floating: true,
    position: { x: -520, y: -260 },
    style: { shape: 'cloud', color: '#e8eddf', emoji: '💡' },
  });
  nodes[float1.id] = float1;
  const float2 = createNode({
    label: 'Reminder: renew domain (Nov)',
    floating: true,
    position: { x: 520, y: -260 },
    style: { shape: 'rectangle', color: '#e8eddf', emoji: '📌' },
  });
  nodes[float2.id] = float2;

  // ---- Cross-branch relationships (16 — comfortably over the 15+ requirement) ----
  const relPairs = [
    ['mobileRedesign', 'launchCampaign'],
    ['aiFeature', 'contentCalendar'],
    ['infraMigration', 'apiV2'],
    ['betaFeedback', 'userTesting'],
    ['techDebt', 'runway'],
    ['q3Revenue', 'budgetReview'],
    ['enterpriseDeals', 'vendorContracts'],
    ['renewals', 'contentCalendar'],
    ['designSystem', 'contentCalendar'],
    ['socialAds', 'influencer'],
    ['pressRelease', 'enterpriseDeals'],
    ['officeExpansion', 'budgetReview'],
    ['runway', 'q3Revenue'],
    ['userTesting', 'aiFeature'],
    ['apiV2', 'mobileRedesign'],
    ['vendorContracts', 'infraMigration'],
  ];
  const relationships = {};
  relPairs.forEach(([a, b], i) => {
    const id = nanoid();
    relationships[id] = {
      id,
      sourceId: byKey[a],
      targetId: byKey[b],
      label: '',
      color: i % 2 === 0 ? '#f5cb5c' : '#333533',
      style: 'dashed',
    };
  });

  // ---- Boundary groupings (frame around related nodes) ----
  const boundaries = {};
  const b1 = nanoid();
  boundaries[b1] = {
    id: b1,
    nodeIds: [byKey.mobileRedesign, byKey.launchCampaign, byKey.q3Revenue, byKey.infraMigration].filter(Boolean),
    label: 'Q3 Priorities',
    color: '#f5cb5c',
    shape: 'box',
  };
  const b2 = nanoid();
  boundaries[b2] = {
    id: b2,
    nodeIds: [byKey.techDebt, byKey.runway].filter(Boolean),
    label: 'Watch closely',
    color: '#cfdbd5',
    shape: 'circle',
  };

  return { nodes, rootIds, relationships, boundaries };
}
