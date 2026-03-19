import { memo, useState, useRef, useEffect } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from 'reactflow';
import { useStore } from '@/store/useStore';
import { X } from 'lucide-react';

export interface CustomEdgeData {
  label?: string;
}

function CustomEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps<CustomEdgeData>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const updateEdgeData = useStore((s) => s.updateEdgeData);
  const removeEdge = useStore((s) => s.removeEdge);
  const zoom = useStore((s) => s.viewportZoom);

  // Inverse zoom scaling for text on edges
  const textScale = Math.max(1, 0.8 / zoom);
  const btnScale = Math.max(1, 0.8 / zoom);

  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [localLabel, setLocalLabel] = useState(data?.label || '');

  useEffect(() => {
    setLocalLabel(data?.label || '');
  }, [data?.label]);

  const onEdgeClick = () => {
    // setIsEditing(true);
  };

  const commitLabel = () => {
    updateEdgeData(id, { label: localLabel });
    setIsEditing(false);
  };

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{ ...style, strokeWidth: isHovered ? 4 : 2 }}
        interactionWidth={20}
      />
      
      {/* Invisible thicker path for easier hover interaction */}
      <path
        d={edgePath}
        fill="none"
        strokeOpacity={0}
        strokeWidth={30}
        className="react-flow__edge-interaction"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onEdgeClick}
        onDoubleClick={() => setIsEditing(true)}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            '--text-scale': textScale,
          } as React.CSSProperties}
          className="flex items-center gap-1 group/edge"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {isEditing ? (
            <input
              autoFocus
              value={localLabel}
              onChange={(e) => setLocalLabel(e.target.value)}
              onBlur={commitLabel}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitLabel();
                if (e.key === 'Escape') {
                  setLocalLabel(data?.label || '');
                  setIsEditing(false);
                }
              }}
              className="text-center rounded outline-none border border-gray-300 bg-white text-gray-800 px-1 py-0.5 pointer-events-auto text-[calc(0.75rem*var(--text-scale))] shadow-lg z-50 min-w-[60px]"
            />
          ) : (
            <div
              className={`relative px-2 py-0.5 rounded-md cursor-pointer transition-opacity text-[calc(0.75rem*var(--text-scale))] font-medium ${
                data?.label || isHovered
                  ? 'bg-white text-gray-800 hover:text-black shadow-sm border border-gray-200'
                  : 'opacity-0'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
            >
              {data?.label || (isHovered && 'Adicionar texto')}
            </div>
          )}

          {/* Delete Edge Button */}
          <button
            onClick={() => removeEdge(id)}
            className={`w-5 h-5 rounded-full bg-red-100 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center transition-all shadow border border-red-200 absolute -right-6 z-10 ${
              isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            style={{ transform: `scale(${btnScale})`, transformOrigin: 'center left' }}
            title="Remover conexão"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const CustomEdge = memo(CustomEdgeComponent);
