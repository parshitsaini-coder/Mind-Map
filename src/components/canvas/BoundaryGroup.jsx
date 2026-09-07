// A boundary is rendered as a plain react-flow "node" so it pans/zooms with the
// canvas, but it's non-draggable/non-selectable and sits behind real nodes.
export default function BoundaryGroup({ data }) {
  const { label, color, shape } = data;
  const isCircle = shape === 'circle';
  return (
    <div
      className={`relative w-full h-full border-2 border-dashed pointer-events-none ${isCircle ? 'rounded-[50%]' : 'rounded-2xl'}`}
      style={{ borderColor: color, backgroundColor: `${color}22` }}
    >
      {label && (
        <span
          className="absolute -top-2.5 left-3 px-1.5 text-[9.5px] font-semibold rounded bg-canvas"
          style={{ color }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
