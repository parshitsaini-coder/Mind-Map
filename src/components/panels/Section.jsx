export default function Section({ title, children }) {
  return (
    <div className="border-b border-sage px-2.5 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-graphite mb-1.5">{title}</div>
      {children}
    </div>
  );
}
