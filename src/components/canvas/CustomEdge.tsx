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
                e.stopPropagation();
                if (e.key === 'Enter') commitLabel();
                if (e.key === 'Escape') {
                  setLocalLabel(data?.label || '');
                  setIsEditing(false);
                }
              }}
              className="nodrag text-center rounded outline-none border border-gray-300 bg-white text-gray-800 px-2 py-1 pointer-events-auto shadow-lg z-50 min-w-[80px]"
              style={{ fontSize: `calc(14px * var(--text-scale))` }}
            />
          ) : (
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm pointer-events-auto">
              <div
                className="relative cursor-text font-semibold text-gray-800 hover:text-black transition-colors"
                style={{ fontSize: `calc(14px * var(--text-scale))` }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
              >
                {data?.label || <span className="text-gray-400 italic font-normal">Insira texto...</span>}
              </div>

              {/* Botão de excluir TEXTO da Edge (somente se houver texto) */}
              {data?.label && (
                <button
                  onClick={(e) => { e.stopPropagation(); updateEdgeData(id, { label: undefined }); }}
                  className="w-5 h-5 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  title="Limpar texto da linha"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Delete ENTIRE Edge Button */}
          <button
            onClick={(e) => { e.stopPropagation(); removeEdge(id); }}
            className={`flex items-center gap-1 px-3 py-1.5 absolute top-1/2 left-[calc(50%+40px)] -translate-y-1/2 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold transition-all shadow-md pointer-events-auto ${
              isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
            }`}
            style={{ fontSize: `calc(12px * var(--text-scale))`, transformOrigin: 'left center' }}
            title="Cortar conexão"
          >
            <X className="w-3.5 h-3.5" />
            Apagar Linha
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const CustomEdge = memo(CustomEdgeComponent);
