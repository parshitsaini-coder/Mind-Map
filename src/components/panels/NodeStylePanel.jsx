import { useRef } from 'react';
import { Star, Upload, X } from 'lucide-react';
import { useMindMapStore } from '../../store/mindMapStore.js';
import { ICON_LIBRARY, EMOJI_SET } from '../../data/iconLibrary.js';
import Section from './Section.jsx';

const SHAPES = ['rectangle', 'oval', 'cloud', 'hexagon', 'none'];
const FILL_SWATCHES = ['#e8eddf', '#f5cb5c', '#cfdbd5', '#333533', '#242423', '#ffffff'];
const TEXT_SWATCHES = ['#242423', '#333533', '#f5cb5c', '#ffffff', '#e8eddf'];
const BRANCH_SWATCHES = ['#333533', '#f5cb5c', '#cfdbd5', '#242423'];

function Swatch({ color, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-5 h-5 rounded-full border ${active ? 'ring-2 ring-accent ring-offset-1 ring-offset-offwhite' : 'border-sage'}`}
      style={{ backgroundColor: color }}
      title={color}
    />
  );
}

// Renders the per-node visual design controls. Expects a resolved `node`
// object (caller looks it up from the store) so it can be reused wherever
// a node's style needs editing.
export default function NodeStylePanel({ nodeId }) {
  const node = useMindMapStore((s) => s.nodes[nodeId]);
  const updateNode = useMindMapStore((s) => s.updateNode);
  const fileInputRef = useRef(null);

  if (!node) return null;

  const patchStyle = (patch) => updateNode(nodeId, { style: patch });
  const patchTaskMeta = (patch) => updateNode(nodeId, { taskMeta: patch });

  const onImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => patchStyle({ image: reader.result });
    reader.readAsDataURL(file);
  };

  return (
    <>
      <Section title="Shape">
        <div className="flex flex-wrap gap-1">
          {SHAPES.map((shape) => (
            <button
              key={shape}
              onClick={() => patchStyle({ shape })}
              className={`text-[10px] px-2 py-1 rounded capitalize transition ${
                node.style.shape === shape ? 'bg-accent text-ink' : 'bg-sage/40 text-graphite hover:bg-sage/70'
              }`}
            >
              {shape}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Fill Color">
        <div className="flex flex-wrap gap-1.5 items-center">
          {FILL_SWATCHES.map((c) => (
            <Swatch key={c} color={c} active={node.style.color === c} onClick={() => patchStyle({ color: c })} />
          ))}
          <input
            type="color"
            value={node.style.color}
            onChange={(e) => patchStyle({ color: e.target.value })}
            className="w-5 h-5 rounded-full overflow-hidden border border-sage cursor-pointer"
          />
        </div>
      </Section>

      <Section title="Text Color">
        <div className="flex flex-wrap gap-1.5 items-center">
          {TEXT_SWATCHES.map((c) => (
            <Swatch key={c} color={c} active={(node.style.textColor || '#242423') === c} onClick={() => patchStyle({ textColor: c })} />
          ))}
          <input
            type="color"
            value={node.style.textColor || '#242423'}
            onChange={(e) => patchStyle({ textColor: e.target.value })}
            className="w-5 h-5 rounded-full overflow-hidden border border-sage cursor-pointer"
          />
        </div>
      </Section>

      <Section title="Branch Color & Thickness">
        <div className="flex flex-wrap gap-1.5 items-center mb-1.5">
          {BRANCH_SWATCHES.map((c) => (
            <Swatch key={c} color={c} active={node.style.branchColor === c} onClick={() => patchStyle({ branchColor: c })} />
          ))}
        </div>
        <input
          type="range"
          min="1" max="8" step="1"
          value={node.style.branchWidth}
          onChange={(e) => patchStyle({ branchWidth: Number(e.target.value) })}
          className="w-full accent-[#f5cb5c]"
        />
      </Section>

      <Section title="Icon">
        <div className="grid grid-cols-6 gap-1">
          <button
            onClick={() => patchStyle({ icon: null })}
            className={`flex items-center justify-center h-6 rounded text-[9px] ${!node.style.icon ? 'bg-accent' : 'bg-sage/40 hover:bg-sage/70'}`}
          >
            ✕
          </button>
          {Object.keys(ICON_LIBRARY).map((name) => {
            const Ico = ICON_LIBRARY[name];
            return (
              <button
                key={name}
                onClick={() => patchStyle({ icon: name })}
                title={name}
                className={`flex items-center justify-center h-6 rounded transition ${
                  node.style.icon === name ? 'bg-accent' : 'bg-sage/40 hover:bg-sage/70'
                }`}
              >
                <Ico size={13} />
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Emoji">
        <div className="grid grid-cols-8 gap-1">
          <button
            onClick={() => patchStyle({ emoji: null })}
            className={`flex items-center justify-center h-6 rounded text-[9px] ${!node.style.emoji ? 'bg-accent' : 'bg-sage/40 hover:bg-sage/70'}`}
          >
            ✕
          </button>
          {EMOJI_SET.map((em) => (
            <button
              key={em}
              onClick={() => patchStyle({ emoji: em })}
              className={`flex items-center justify-center h-6 rounded text-[13px] transition ${
                node.style.emoji === em ? 'bg-accent' : 'bg-sage/40 hover:bg-sage/70'
              }`}
            >
              {em}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Image">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={onImagePick} className="hidden" />
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-sage/40 hover:bg-sage/70 text-graphite"
          >
            <Upload size={12} /> Upload
          </button>
          {node.style.image && (
            <>
              <img src={node.style.image} alt="" className="w-6 h-6 rounded object-cover" />
              <button onClick={() => patchStyle({ image: null })} className="text-graphite hover:text-ink">
                <X size={12} />
              </button>
            </>
          )}
        </div>
      </Section>

      <Section title="Badges & Progress">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-graphite">Starred</span>
          <button onClick={() => patchTaskMeta({ starred: !node.taskMeta.starred })}>
            <Star size={15} className={node.taskMeta.starred ? 'fill-[#f5cb5c] text-[#f5cb5c]' : 'text-graphite'} />
          </button>
        </div>

        <div className="mb-2">
          <span className="text-[11px] text-graphite block mb-1">Priority</span>
          <div className="grid grid-cols-9 gap-0.5">
            {Array.from({ length: 9 }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => patchTaskMeta({ priority: node.taskMeta.priority === p ? null : p })}
                className={`h-5 rounded text-[9px] ${
                  node.taskMeta.priority === p ? 'bg-accent text-ink' : 'bg-sage/40 text-graphite hover:bg-sage/70'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="text-[11px] text-graphite block mb-1">Progress ({node.taskMeta.progress}%)</span>
          <input
            type="range"
            min="0" max="100" step="5"
            value={node.taskMeta.progress}
            onChange={(e) => patchTaskMeta({ progress: Number(e.target.value) })}
            className="w-full accent-[#f5cb5c]"
          />
        </div>
      </Section>
    </>
  );
}
