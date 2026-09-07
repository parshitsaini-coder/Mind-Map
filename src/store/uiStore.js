import { create } from 'zustand';

// Background presets, all built from the strict design palette —
// only the pattern/density changes, never the hue.
export const CANVAS_THEMES = {
  dots: { label: 'Dots', variant: 'dots', color: '#cfdbd5', bg: '#ecebe4' },
  lines: { label: 'Lines', variant: 'lines', color: '#cfdbd5', bg: '#ecebe4' },
  cross: { label: 'Cross', variant: 'cross', color: '#cfdbd5', bg: '#ecebe4' },
  plain: { label: 'Plain', variant: null, color: '#cfdbd5', bg: '#e8eddf' },
};

export const useUIStore = create((set, get) => ({
  canvasTheme: 'dots',
  setCanvasTheme: (canvasTheme) => set({ canvasTheme }),

  // 'style' = shapes/colors/icons/badges, 'content' = notes/links/attachments/media
  activeRightTab: 'style',
  setActiveRightTab: (activeRightTab) => set({ activeRightTab }),

  // ---- Step 8: Navigation & Editing UX ----

  // Map (canvas) vs Outline (indented bullet list) view.
  viewMode: 'canvas', // 'canvas' | 'outline'
  setViewMode: (viewMode) => set({ viewMode }),
  toggleViewMode: () => set((s) => ({ viewMode: s.viewMode === 'canvas' ? 'outline' : 'canvas' })),

  // Focus mode — zoom into one branch, hiding everything outside its subtree.
  focusNodeId: null,
  enterFocus: (id) => set({ focusNodeId: id }),
  exitFocus: () => set({ focusNodeId: null }),

  // Presentation mode — full-screen slide-by-slide walkthrough in DFS order.
  presentationOpen: false,
  presentationIndex: 0,
  startPresentation: () => set({ presentationOpen: true, presentationIndex: 0 }),
  stopPresentation: () => set({ presentationOpen: false }),
  setPresentationIndex: (presentationIndex) => set({ presentationIndex }),

  // Search & replace across node labels.
  searchOpen: false,
  searchQuery: '',
  replaceQuery: '',
  searchMatchIndex: 0,
  openSearch: () => set({ searchOpen: true }),
  closeSearch: () => set({ searchOpen: false, searchQuery: '', replaceQuery: '', searchMatchIndex: 0 }),
  toggleSearch: () => {
    const isOpen = get().searchOpen;
    if (isOpen) get().closeSearch();
    else set({ searchOpen: true });
  },
  setSearchQuery: (searchQuery) => set({ searchQuery, searchMatchIndex: 0 }),
  setReplaceQuery: (replaceQuery) => set({ replaceQuery }),
  setSearchMatchIndex: (searchMatchIndex) => set({ searchMatchIndex }),

  // Small on-screen cheat-sheet toggle for the keyboard shortcut list.
  shortcutsHelpOpen: false,
  toggleShortcutsHelp: () => set((s) => ({ shortcutsHelpOpen: !s.shortcutsHelpOpen })),

  // ---- Step 9: Collaboration layer (local-first) ----

  // Sidebar tab: 'maps' (workspace/folders), 'nodes' (flat list), 'activity' (session log).
  sidebarTab: 'maps',
  setSidebarTab: (sidebarTab) => set({ sidebarTab }),

  // Share dialog (generates a view-only / editable link encoding the current map).
  shareDialogOpen: false,
  openShareDialog: () => set({ shareDialogOpen: true }),
  closeShareDialog: () => set({ shareDialogOpen: false }),

  // ---- Step 12: Responsive / mobile layout ----
  // Sidebar and RightPanel are permanent columns on desktop (md+) but become
  // off-canvas slide-over drawers on narrow/mobile screens, toggled from the
  // toolbar. Default closed on mobile so the canvas gets full width; the
  // desktop layout ignores this flag entirely (see the `md:` classes on the
  // components themselves).
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen, rightPanelOpen: false })),
  closeSidebar: () => set({ sidebarOpen: false }),

  rightPanelOpen: false,
  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen, sidebarOpen: false })),
  closeRightPanel: () => set({ rightPanelOpen: false }),
  openRightPanel: () => set({ rightPanelOpen: true }),

  // Banner shown when the app was opened from a shared link.
  sharedBannerMode: null, // null | 'view' | 'edit'
  setSharedBannerMode: (sharedBannerMode) => set({ sharedBannerMode }),
  dismissSharedBanner: () => set({ sharedBannerMode: null }),
}));
