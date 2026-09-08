import { useEffect } from 'react';
import { useMindMapStore, getSiblingNode, getOrderedChildren } from '../store/mindMapStore.js';
import { useUIStore } from '../store/uiStore.js';

// Full shortcut map, shown in the on-screen cheat sheet (ShortcutsHelp.jsx) too.
export const SHORTCUTS = [
  { keys: 'Right-click', desc: 'Rename / add child / delete a node' },
  { keys: 'Double-click', desc: 'Rename the selected node' },
  { keys: 'Tab', desc: 'Add child node' },
  { keys: 'Shift+Tab', desc: 'Outdent (move to grandparent)' },
  { keys: 'Enter', desc: 'Add sibling node' },
  { keys: 'Delete / Backspace', desc: 'Delete selected node' },
  { keys: '↑ / ↓', desc: 'Select previous / next sibling' },
  { keys: '← / →', desc: 'Select parent / first child' },
  { keys: 'Alt+↑ / Alt+↓', desc: 'Reorder among siblings' },
  { keys: 'Space', desc: 'Expand / collapse branch' },
  { keys: 'Ctrl/Cmd+F', desc: 'Search & replace' },
  { keys: 'Ctrl/Cmd+Z', desc: 'Undo' },
  { keys: 'Ctrl/Cmd+Shift+Z', desc: 'Redo' },
  { keys: 'F', desc: 'Focus mode on selected branch' },
  { keys: 'P', desc: 'Presentation mode' },
  { keys: 'Esc', desc: 'Close panel / exit mode / deselect' },
  { keys: '?', desc: 'Toggle this shortcut list' },
];

function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
}

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e) => {
      if (isTypingTarget(e.target)) {
        // Even while typing, Escape should still be able to close overlays.
        if (e.key === 'Escape') {
          const ui = useUIStore.getState();
          if (ui.searchOpen) ui.closeSearch();
        }
        return;
      }

      const store = useMindMapStore.getState();
      const ui = useUIStore.getState();
      const { selectedNodeId, nodes, rootIds } = store;

      // ---- global overlay shortcuts (work with or without a selection) ----
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        ui.openSearch();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) store.redo();
        else store.undo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        store.redo();
        return;
      }
      if (e.key === '?') {
        e.preventDefault();
        ui.toggleShortcutsHelp();
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        if (ui.searchOpen) ui.closeSearch();
        else if (ui.presentationOpen) ui.stopPresentation();
        else if (ui.focusNodeId) ui.exitFocus();
        else if (ui.shortcutsHelpOpen) ui.toggleShortcutsHelp();
        else store.selectNode(null);
        return;
      }
      if (e.key.toLowerCase() === 'p' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        ui.startPresentation();
        return;
      }

      // ---- node-relative shortcuts (need a selection) ----
      if (!selectedNodeId || !nodes[selectedNodeId]) return;
      const node = nodes[selectedNodeId];

      if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        const parent = nodes[node.parentId];
        if (parent) {
          store.reparentNode(selectedNodeId, parent.parentId);
        }
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        const newId = store.addNode(selectedNodeId, { label: 'New Node' });
        store.selectNode(newId);
        ui.requestEdit(newId);
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (node.floating) return;
        const newId = store.addNode(node.parentId, { label: 'New Node' });
        store.selectNode(newId);
        ui.requestEdit(newId);
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        store.deleteNode(selectedNodeId);
        store.selectNode(null);
        return;
      }

      if (e.key === ' ') {
        e.preventDefault();
        const hasChildren = getOrderedChildren(nodes, selectedNodeId).length > 0;
        if (hasChildren) store.toggleCollapse(selectedNodeId);
        return;
      }

      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const direction = e.key === 'ArrowUp' ? -1 : 1;
        if (e.altKey) {
          store.reorderSibling(selectedNodeId, direction);
          return;
        }
        const sibling = getSiblingNode(nodes, rootIds, selectedNodeId, direction);
        if (sibling) store.selectNode(sibling.id);
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (node.parentId) store.selectNode(node.parentId);
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (node.collapsed) {
          store.toggleCollapse(selectedNodeId);
          return;
        }
        const children = getOrderedChildren(nodes, selectedNodeId);
        if (children.length > 0) store.selectNode(children[0].id);
        return;
      }

      if (e.key.toLowerCase() === 'f' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        ui.enterFocus(selectedNodeId);
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
