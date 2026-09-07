import { useRef } from 'react';
import { Link2, Paperclip, Video, X, FileText, File as FileIcon } from 'lucide-react';
import { useMindMapStore } from '../../store/mindMapStore.js';
import RichTextEditor from './RichTextEditor.jsx';
import AudioRecorder from './AudioRecorder.jsx';
import Section from './Section.jsx';

function attachmentIcon(type) {
  if (type?.includes('pdf')) return FileText;
  if (type?.includes('audio')) return FileIcon;
  return FileIcon;
}

export default function ContentPanel({ nodeId }) {
  const node = useMindMapStore((s) => s.nodes[nodeId]);
  const updateNode = useMindMapStore((s) => s.updateNode);
  const addAttachment = useMindMapStore((s) => s.addAttachment);
  const removeAttachment = useMindMapStore((s) => s.removeAttachment);
  const fileInputRef = useRef(null);

  if (!node) return null;

  const onFilePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => addAttachment(nodeId, { name: file.name, type: file.type, url: reader.result });
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <>
      <Section title="Notes">
        <RichTextEditor
          value={node.notes}
          onChange={(html) => updateNode(nodeId, { notes: html })}
          placeholder="Detailed notes for this node…"
        />
      </Section>

      <Section title="Hyperlink">
        <div className="flex items-center gap-1">
          <Link2 size={12} className="text-graphite shrink-0" />
          <input
            type="url"
            placeholder="https://…"
            value={node.link?.url || ''}
            onChange={(e) => updateNode(nodeId, { link: { ...node.link, url: e.target.value, label: node.link?.label || '' } })}
            className="flex-1 text-[11px] border border-sage rounded px-1.5 py-1 outline-none focus:ring-1 focus:ring-accent"
          />
          {node.link?.url && (
            <button onClick={() => updateNode(nodeId, { link: null })} className="text-graphite hover:text-ink">
              <X size={12} />
            </button>
          )}
        </div>
      </Section>

      <Section title="Video Embed">
        <div className="flex items-center gap-1">
          <Video size={12} className="text-graphite shrink-0" />
          <input
            type="url"
            placeholder="YouTube / Vimeo / .mp4 URL"
            value={node.videoEmbed || ''}
            onChange={(e) => updateNode(nodeId, { videoEmbed: e.target.value })}
            className="flex-1 text-[11px] border border-sage rounded px-1.5 py-1 outline-none focus:ring-1 focus:ring-accent"
          />
          {node.videoEmbed && (
            <button onClick={() => updateNode(nodeId, { videoEmbed: null })} className="text-graphite hover:text-ink">
              <X size={12} />
            </button>
          )}
        </div>
        {node.videoEmbed && /youtube|vimeo/.test(node.videoEmbed) && (
          <div className="text-[10px] text-graphite/70 mt-1">Preview renders on export/presentation views.</div>
        )}
      </Section>

      <Section title="File Attachments">
        <input ref={fileInputRef} type="file" onChange={onFilePick} className="hidden" />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-sage/40 hover:bg-sage/70 text-graphite mb-1.5"
        >
          <Paperclip size={11} /> Attach file
        </button>
        <div className="space-y-1">
          {node.attachments.map((a) => {
            const Ico = attachmentIcon(a.type);
            return (
              <div key={a.id} className="flex items-center gap-1.5 text-[11px] bg-sage/20 rounded px-1.5 py-1">
                <Ico size={12} className="shrink-0 text-graphite" />
                <span className="flex-1 truncate">{a.name}</span>
                <button onClick={() => removeAttachment(nodeId, a.id)} className="text-graphite hover:text-ink shrink-0">
                  <X size={11} />
                </button>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Voice Memo">
        <AudioRecorder onRecorded={(dataUrl) => addAttachment(nodeId, { name: `Voice note ${new Date().toLocaleTimeString()}`, type: 'audio/webm', url: dataUrl })} />
        {node.attachments.filter((a) => a.type?.startsWith('audio')).map((a) => (
          <div key={a.id} className="mt-1.5 flex items-center gap-1.5">
            <audio controls src={a.url} className="h-7 flex-1" />
            <button onClick={() => removeAttachment(nodeId, a.id)} className="text-graphite hover:text-ink shrink-0">
              <X size={11} />
            </button>
          </div>
        ))}
      </Section>
    </>
  );
}
