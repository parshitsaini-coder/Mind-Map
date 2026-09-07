import { useState } from 'react';
import { Send, Trash2, AtSign } from 'lucide-react';
import { useMindMapStore } from '../../store/mindMapStore.js';
import Section from '../panels/Section.jsx';

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// Renders comment text with @mentions highlighted in the accent color.
function MentionText({ text }) {
  const parts = text.split(/(@\w[\w-]*)/g);
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith('@') ? (
          <span key={i} className="text-ink bg-accent/40 rounded px-0.5 font-medium">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

export default function CommentsPanel({ nodeId }) {
  const node = useMindMapStore((s) => s.nodes[nodeId]);
  const addComment = useMindMapStore((s) => s.addComment);
  const deleteComment = useMindMapStore((s) => s.deleteComment);
  const readOnly = useMindMapStore((s) => s.readOnly);
  const [draft, setDraft] = useState('');

  if (!node) return null;

  const submit = () => {
    if (!draft.trim()) return;
    addComment(nodeId, draft, 'You');
    setDraft('');
  };

  return (
    <Section title="Comments">
      <div className="space-y-2 mb-2 max-h-56 overflow-y-auto thin-scroll">
        {node.comments.length === 0 ? (
          <div className="text-[10.5px] text-graphite/60">
            No comments yet. Use <span className="font-mono">@name</span> to mention a teammate.
          </div>
        ) : (
          node.comments.map((c) => (
            <div key={c.id} className="bg-sage/20 rounded px-2 py-1.5 group relative">
              <div className="flex items-center justify-between text-[10px] text-graphite/70 mb-0.5">
                <span className="font-semibold text-ink">{c.author}</span>
                <span>{timeAgo(c.createdAt)}</span>
              </div>
              <div className="text-[11px] leading-snug text-ink pr-4">
                <MentionText text={c.text} />
              </div>
              {!readOnly && (
                <button
                  onClick={() => deleteComment(nodeId, c.id)}
                  className="absolute top-1.5 right-1.5 text-graphite/50 hover:text-ink opacity-0 group-hover:opacity-100 transition"
                  title="Delete comment"
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {!readOnly && (
        <div className="flex items-center gap-1">
          <AtSign size={12} className="text-graphite shrink-0" />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
            placeholder="Comment or @mention…"
            className="flex-1 text-[11px] border border-sage rounded px-1.5 py-1 outline-none focus:ring-1 focus:ring-accent"
          />
          <button
            onClick={submit}
            className="w-6 h-6 flex items-center justify-center rounded bg-accent text-ink hover:brightness-95 active:scale-95 transition shrink-0"
          >
            <Send size={11} />
          </button>
        </div>
      )}
    </Section>
  );
}
