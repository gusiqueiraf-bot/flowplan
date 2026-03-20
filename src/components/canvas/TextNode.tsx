import { memo, useState, useEffect } from 'react';
import { type NodeProps, NodeResizer } from 'reactflow';
import { useStore } from '@/store/useStore';
import { X, Type } from 'lucide-react';

export interface TextNodeData {
  text: string;
  fontSize: number;
  width: number;
  height: number;
}

function TextNodeComponent({ data, id, selected }: NodeProps<TextNodeData>) {
  const updateNodeData = useStore((s) => s.updateNodeData);
  const removeNode = useStore((s) => s.removeNode);
  const zoom = useStore((s) => s.viewportZoom);
  const isReadOnly = useStore((s) => s.isReadOnly);

  const textScale = Math.min(1.4, Math.max(0.85, 1 / Math.pow(zoom, 0.5)));
  const btnScale = Math.max(1, 0.8 / zoom);

  const [isEditing, setIsEditing] = useState(false);
  const [localText, setLocalText] = useState(data.text);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => { setLocalText(data.text); }, [data.text]);

  const commitText = () => {
    updateNodeData(id, { text: localText });
    setIsEditing(false);
  };

  const currentFontSize = data.fontSize || 16;

  return (
    <>
      {!isReadOnly && (
        <NodeResizer 
          color="#94a3b8" 
          isVisible={selected || isHovered} 
          minWidth={100} 
          minHeight={40} 
          onResizeStart={() => useStore.temporal.getState().pause()}
          onResizeEnd={() => {
            useStore.temporal.getState().resume();
            useStore.setState((s) => ({ ...s }));
          }}
          onResize={(_, params) => {
            updateNodeData(id, { width: params.width, height: params.height });
          }} 
        />
      )}
      <div 
        className="relative group/text flex flex-col items-center justify-center p-2 rounded-xl transition-colors"
        style={{
          width: data.width || 200,
          height: data.height || 100,
          fontSize: currentFontSize * textScale,
          backgroundColor: !isReadOnly && (isHovered || isEditing || selected) ? 'rgba(255, 255, 255, 0.4)' : 'transparent',
          border: !isReadOnly && (isHovered || isEditing || selected) ? '1px dashed #cbd5e1' : '1px solid transparent',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDoubleClick={() => { if (!isReadOnly) setIsEditing(true); }}
      >
        {isEditing ? (
          <textarea
            autoFocus
            className="nodrag w-full h-full resize-none outline-none bg-transparent text-center text-gray-800"
            value={localText}
            onChange={(e) => setLocalText(e.target.value)}
            onBlur={commitText}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Escape') { setLocalText(data.text); setIsEditing(false); }
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { commitText(); }
            }}
            onMouseDown={(e) => e.stopPropagation()}
            placeholder="Digite seu texto..."
          />
        ) : (
          <div className={`w-full h-full whitespace-pre-wrap flex items-center justify-center text-center text-gray-800 font-semibold leading-snug break-words ${!isReadOnly ? 'cursor-text' : ''}`}>
            {data.text || (!isReadOnly ? 'Texto (duplo clique para editar)' : '')}
          </div>
        )}

        {/* Delete text node button */}
        {!isReadOnly && (
          <button
            onClick={() => removeNode(id)}
            className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-red-100 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover/text:opacity-100 shadow-sm z-10"
            style={{ transform: `scale(${btnScale})`, transformOrigin: 'center' }}
            title="Remover texto"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Font size controls */}
        {!isReadOnly && (
          <div 
            className="absolute -bottom-4 left-1/2 flex items-center gap-1 opacity-0 group-hover/text:opacity-100 transition-opacity bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-1 z-10"
            style={{ transform: `translateX(-50%) scale(${btnScale})`, transformOrigin: 'top center' }}
          >
            <button 
              onClick={(e) => { e.stopPropagation(); updateNodeData(id, { fontSize: Math.max(24, currentFontSize - 8) }); }}
              className="w-5 h-5 flex flex-col items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 text-xs font-bold leading-none pb-0.5"
              title="Diminuir fonte"
            >
              -
            </button>
            <div className="text-[10px] text-gray-400 font-medium px-0.5">{currentFontSize}</div>
            <button 
              onClick={(e) => { e.stopPropagation(); updateNodeData(id, { fontSize: Math.min(128, currentFontSize + 8) }); }}
              className="w-5 h-5 flex flex-col items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 text-xs font-bold leading-none pb-0.5"
              title="Aumentar fonte"
            >
              +
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export const TextNode = memo(TextNodeComponent);
