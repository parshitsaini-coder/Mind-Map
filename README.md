# Mind Map App

A compact, animated React mind-mapping tool (Vite + React + Zustand + Framer Motion + React Flow + Tailwind), built to the strict `#ecebe4` / `#cfdbd5` / `#e8eddf` / `#f5cb5c` / `#242423` / `#333533` design system.

## Progress

**Current status: Steps 1–14 complete (deployment is configured and ready to push — see "Deploying" below). Step 15 (Final Review & Handover) next.**

Steps 1–10 of the build plan are done:
1. Project scaffolding (Vite + Tailwind tokens)
2. Core data model (Zustand store, node/tree CRUD)
3. Canvas + radial/tree layout, pan/zoom, connectors
4. Additional layouts (org, fishbone, timeline, matrix, logic, h/v tree) with animated switching
5. Visual design tools (shapes, colors, icons, images, emoji, stickers, canvas themes)
6. Text & content (rich text notes, hyperlinks, attachments, audio, video embed)
7. Task management (todo, priority, progress ring, due dates, assignee, Gantt export view)
8. Navigation & editing UX (drag & drop, full keyboard shortcuts, focus mode, presentation mode, outline view, search & replace)
9. Collaboration layer (local-first) — undo/redo history, per-node comments with `@mentions`, shareable view/edit links encoded in the URL, local workspaces & folders (multi-map, saved to `localStorage`), and a session activity log. Real-time multi-user sync is intentionally out of scope for GitHub Pages (static hosting) — this is called out directly in the Share dialog, and the data shapes are backend-ready for a future Firebase/Supabase layer.
10. **Demo/sample mind map** — a one-click "Load demo map" button (Sidebar → Maps tab) opens a pre-built "Company Strategy" map: 29 nodes across 6 branches (Product, Engineering, Marketing, Sales, Operations, Finance), 2 levels deep in places, 16 cross-branch connector lines, 2 floating notes, 2 boundary/frame groupings, and a mix of icons, emoji, shapes, priority flags, progress rings, due dates, assignees and starred badges — enough to try every layout immediately. Boundary/frame grouping (a Step 1 feature) is now actually rendered on the canvas as part of this work — it previously only existed in the data model.
11. **Animation & performance polish** — nodes pop/scale in on mount via Framer Motion (new nodes, branches re-appearing on expand); layout repositioning uses a cheap CSS `transform` transition instead of animating hundreds of nodes through Framer Motion on every layout switch; `MindMapNode` is memoized; ReactFlow's `onlyRenderVisibleElements` keeps only on-screen nodes/edges mounted; the layout engine was rewritten from an O(n²)–O(n³) repeated-scan approach to an O(n) parent→children index with cached leaf counts (500 nodes: ~300ms → ~1.5ms per layout pass; 5,000 nodes stays under 25ms).
12. **Responsive & compact sizing pass** — the whole UI already used dense spacing/typography from Step 1 onward (12px node text, tight toolbar/sidebar padding); this pass added the mobile layer on top: the sidebar becomes a slide-in drawer with a backdrop and hamburger toggle below the `md` breakpoint, the right panel does the same from the other edge, toolbar labels collapse to icon-only on narrow widths, and all modals/overlays (share dialog, shortcuts help, presentation mode) cap themselves to a `max-w-[90vw]`-style bound so they never overflow a phone screen.

### Step 13 — Testing & Bug Fixes

**Status: substantially complete.** Since there's no browser available in this environment to click through the UI, testing was done by exercising the store and layout engine directly (`npm test` → `scripts/test-store.mjs`), which is now a permanent regression check covering:
- Core CRUD (add/delete/cascade-delete), undo/redo (including running past the start of history), reparenting (including that reparenting a node under its own descendant can't create a cycle), floating notes staying unparented, and collapse/expand.
- The empty-map edge case: deleting every node and recovering via `addNode(null, …)`.
- All 8 layouts against an empty map, a 200-level-deep single chain, a random 520-node tree (the Step 11 perf case), and the real Step 10 demo map.

**One real bug found and fixed:** the fishbone, timeline, and matrix layouts only ever computed explicit positions for a root and its first one or two levels of descendants (that's what makes them read as a fishbone/timeline/grid rather than a generic tree) — anything nested deeper than that silently got no position and fell back to wherever it was last stored, so deeply-nested nodes under those three layouts would render stacked on top of each other instead of somewhere sensible. Fixed in `src/utils/layout.js` with a generic `fillMissingPositions` pass that runs after every layout and gives any still-unplaced node a small cascading offset from its parent — a safety net that costs nothing for the layouts that were already complete (tree/radial/org/logic) and fixes the three that weren't.

Also fixed: an unused-variable lint warning in `AudioRecorder`.

Still worth doing before shipping: an actual manual click-through in a browser (drag & drop feel, animation timing, mobile drawer behavior, rich text editor, image/audio upload flows) — those are UX-feel checks that a headless logic test can't catch. Everything logic/data-layer has passing regression coverage now.

## Deploying (Step 14)

This repo targets **`github.com/parshitsaini-coder/Mind-Map`**, deployed via GitHub Actions to `https://parshitsaini-coder.github.io/Mind-Map/`. `vite.config.js`'s `base: '/Mind-Map/'` and `.github/workflows/deploy.yml` are already set up for it — you just need to push and flip one setting.

1. **One-time repo setting:** on GitHub, go to `Settings → Pages` and under "Build and deployment → Source" pick **GitHub Actions** (not "Deploy from a branch").
2. **Push this code** to your existing repo. Since the repo already has a README/first commit, pull first so histories don't diverge:
   ```bash
   cd mindmap-app
   git init                                   # skip if this folder is already a git repo
   git remote add origin https://github.com/parshitsaini-coder/Mind-Map.git
   git branch -M main
   git pull origin main --allow-unrelated-histories   # merge with the repo's existing README etc.
   git add .
   git commit -m "Mind map app — steps 1-14"
   git push -u origin main
   ```
3. That push triggers `.github/workflows/deploy.yml`, which runs `npm ci` → `npm test` → `npm run lint` → `npm run build` → deploys the `dist/` output to Pages. Watch progress under the repo's **Actions** tab.
4. Once the workflow finishes (green check), the live app is at **https://parshitsaini-coder.github.io/Mind-Map/**.

If you ever rename the repo, update `base` in `vite.config.js` to match (`/new-repo-name/`) before the next push — a wrong base path is the #1 cause of a blank page / missing assets on GitHub Pages.

## Dev

```bash
npm install
npm run dev
npm run build
npm test    # regression checks for the store + layout engine (no browser needed)
```

`base` in `vite.config.js` is already set to `/Mind-Map/` for this repo — see "Deploying" above.
