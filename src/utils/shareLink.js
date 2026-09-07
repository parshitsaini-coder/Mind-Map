// ============================================================
// Shareable links (Step 9 — local-first collaboration).
//
// GitHub Pages is static hosting, so there's no server to store
// shared maps behind a short URL. Instead the whole map is encoded
// straight into the URL hash (base64 of JSON). This works great for
// small/medium maps and needs no backend — the trade-off is the
// link gets long for very large maps, and "edit" links let anyone
// who opens them edit their OWN local copy (no live sync back to
// you). We surface both trade-offs in the Share dialog UI.
// ============================================================

const HASH_PREFIX = '#share=';

export function encodeMapToHash(mapData, mode = 'view') {
  const payload = { mode, data: mapData, v: 1 };
  const json = JSON.stringify(payload);
  const base64 = btoa(unescape(encodeURIComponent(json)));
  return HASH_PREFIX + base64;
}

export function buildShareUrl(mapData, mode = 'view') {
  const base = window.location.href.split('#')[0];
  return base + encodeMapToHash(mapData, mode);
}

export function readMapFromLocation() {
  const hash = window.location.hash;
  if (!hash || !hash.startsWith(HASH_PREFIX)) return null;
  try {
    const base64 = hash.slice(HASH_PREFIX.length);
    const json = decodeURIComponent(escape(atob(base64)));
    const payload = JSON.parse(json);
    if (!payload?.data) return null;
    return { mode: payload.mode === 'edit' ? 'edit' : 'view', data: payload.data };
  } catch {
    return null;
  }
}

export function clearShareHash() {
  const url = window.location.href.split('#')[0];
  window.history.replaceState(null, '', url);
}

// Rough size estimate so the Share dialog can warn on very large maps.
export function estimateShareUrlLength(mapData, mode) {
  return buildShareUrl(mapData, mode).length;
}
