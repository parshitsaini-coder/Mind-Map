import { getBezierPath, getSmoothStepPath, BaseEdge } from 'reactflow';

export default function BranchEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data }) {
  const pathFn = data?.orthogonal ? getSmoothStepPath : getBezierPath;
  const [path] = pathFn({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, borderRadius: 6 });
  return (
    <BaseEdge
      id={id}
      path={path}
      style={{
        stroke: data?.color || '#333533',
        strokeWidth: data?.width || 2,
        strokeDasharray: data?.dashed ? '5 4' : undefined,
      }}
    />
  );
}
