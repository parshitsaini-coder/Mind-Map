import { useRef, useEffect } from 'react';
import { Bold, Italic, Underline } from 'lucide-react';

const FONTS = [
  { label: 'Default', value: '' },
  { label: 'Serif', value: 'Georgia, serif' },
  { label: 'Mono', value: '"JetBrains Mono", monospace' },
];

export default function RichTextEditor({ value, onChange, placeholder }) {
  const ref = useRef(null);

  // Only sync external value into the DOM when it actually differs
  // (avoids clobbering the caret position while typing).
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (value || '')) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);

  const exec = (command, arg) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    onChange(ref.current?.innerHTML || '');
  };

  return (
    <div className="border border-sage rounded-md overflow-hidden bg-white">
      <div className="flex items-center gap-0.5 px-1 py-1 border-b border-sage bg-sage/20">
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec('bold')} className="p-1 rounded hover:bg-sage/50" title="Bold">
          <Bold size={12} />
        </button>
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec('italic')} className="p-1 rounded hover:bg-sage/50" title="Italic">
          <Italic size={12} />
        </button>
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec('underline')} className="p-1 rounded hover:bg-sage/50" title="Underline">
          <Underline size={12} />
        </button>
        <select
          onMouseDown={(e) => e.preventDefault()}
          onChange={(e) => exec('fontName', e.target.value)}
          className="text-[10px] bg-transparent ml-1 outline-none"
          defaultValue=""
        >
          {FONTS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(ref.current?.innerHTML || '')}
        data-placeholder={placeholder}
        className="text-[12px] leading-snug px-2 py-1.5 min-h-[70px] max-h-[160px] overflow-y-auto thin-scroll outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-graphite/40"
      />
    </div>
  );
}
