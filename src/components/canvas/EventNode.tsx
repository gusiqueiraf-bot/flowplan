import { memo, useState, useEffect } from 'react';
import { Handle, Position, type NodeProps, NodeResizer } from 'reactflow';
import { useStore } from '@/store/useStore';
import { addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DAY_WIDTH } from '@/lib/constants';
import { Check, X } from 'lucide-react';

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

export interface EventNodeData {
  title: string;
  color?: string;
  scale?: number;
  width?: number;
  height?: number;
  responsibleId?: string;
}

const EVENT_COLORS = [
  { label: 'Roxo',     value: '#8B5CF6' },
  { label: 'Azul',     value: '#3B82F6' },
  { label: 'Rosa',     value: '#EC4899' },
  { label: 'Verde',    value: '#10B981' },
  { label: 'Laranja',  value: '#F97316' },
  { label: 'Vermelho', value: '#EF4444' },
  { label: 'Ciano',    value: '#06B6D4' },
  { label: 'Amarelo',  value: '#F59E0B' },
];

function EventNodeComponent({ data, xPos, id, selected }: NodeProps<EventNodeData>) {
  const projectStartDate = useStore((s) => s.projectStartDate);
  const updateNodeData   = useStore((s) => s.updateNodeData);
  const removeNode       = useStore((s) => s.removeNode);
  const zoom             = useStore((s) => s.viewportZoom);
  const isReadOnly       = useStore((s) => s.isReadOnly);
  const people           = useStore((s) => s.people);

  const person = people.find((p) => p.id === data.responsibleId);

  const textScale = Math.min(2.5, Math.max(0.8, 1 / Math.pow(zoom, 0.5)));
  const btnScale = Math.max(1, 0.8 / zoom);
  const nodeWidth = data.width || (data.scale ? 80 * data.scale : 80);
  const nodeScale = nodeWidth / 80;

  const [editingTitle,    setEditingTitle]    = useState(false);
  const [localTitle,      setLocalTitle]      = useState(data.title);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isHovered,       setIsHovered]       = useState(false);

  useEffect(() => setLocalTitle(data.title), [data.title]);

  // Close color picker on outside click
  useEffect(() => {
    if (!showColorPicker) return;
    const close = () => setShowColorPicker(false);
    const t = setTimeout(() => document.addEventListener('click', close), 0);
    return () => { clearTimeout(t); document.removeEventListener('click', close); };
  }, [showColorPicker]);

  const color = data.color || '#8B5CF6';

  const dayOffset = Math.round(xPos / DAY_WIDTH);
  const date      = addDays(projectStartDate, dayOffset);
  const dateStr   = format(date, "dd 'de' MMM", { locale: ptBR });

  const commitTitle = () => {
    updateNodeData(id, { title: localTitle.trim() || 'Marco' });
    setEditingTitle(false);
  };

  return (
    <>
      {!isReadOnly && (
        <NodeResizer 
          color={color}
          isVisible={selected || isHovered}
          minWidth={40}
          minHeight={40}
          handleStyle={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid white' }}
          onResizeStart={() => useStore.temporal.getState().pause()}
          onResizeEnd={() => {
            useStore.temporal.getState().resume();
            useStore.setState((s) => ({ ...s }));
          }}
          onResize={(_, params) => {
            const size = Math.max(params.width, params.height);
            updateNodeData(id, { width: size, height: size });
          }}
        />
      )}
      <div 
        className="group/event relative flex flex-col items-center gap-1" 
        style={{ width: nodeWidth, minHeight: nodeWidth, '--text-scale': textScale, '--node-scale': nodeScale } as React.CSSProperties}
        onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Handles */}
      <>
        <Handle
          type="target"
          position={Position.Left}
          className={`!w-4 !h-4 !border-2 !bg-white !z-50 before:absolute before:-inset-4 before:content-[''] ${isReadOnly ? 'opacity-0 !pointer-events-none' : ''}`}
          style={{ borderColor: color, top: '40%' }}
          title="Entrada de dependência"
        />
        <Handle
          type="source"
          position={Position.Right}
          className={`!w-4 !h-4 !border-2 !bg-white !z-50 before:absolute before:-inset-4 before:content-[''] ${isReadOnly ? 'opacity-0 !pointer-events-none' : ''}`}
          style={{ borderColor: color, top: '40%' }}
          title="Arraste para conectar"
        />
      </>

      {/* Diamond + color picker container styled with exact diagonal height to push text down correctly */}
      <div className="relative flex items-center justify-center" style={{ width: 62 * nodeScale, height: 62 * nodeScale }}>
        
        {/* Responsible Badge */}
        {person && (
          <div
            className="absolute -top-3 -right-3 flex items-center justify-center rounded-full text-white font-bold shadow-sm z-20"
            style={{
              backgroundColor: person.color,
              width: 22 * btnScale,
              height: 22 * btnScale,
              fontSize: 10 * btnScale,
            }}
            title={`Responsável: ${person.name}`}
          >
            {getInitials(person.name)}
          </div>
        )}

        <button
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); if (!isReadOnly) setShowColorPicker((v) => !v); }}
          className={`rotate-45 rounded-lg transition-all ${!isReadOnly ? 'hover:scale-110 active:scale-95' : ''}`}
          style={{
            width: 44 * nodeScale,
            height: 44 * nodeScale,
            backgroundColor: color,
            boxShadow: `0 4px 20px 0 ${color}55, 0 0 0 2px ${color}33`,
          }}
          title="Clique para mudar cor"
        />

        {/* Date line below diamond */}
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-px"
          style={{ height: 12, backgroundColor: `${color}66` }}
        />

        {/* Color picker */}
        {showColorPicker && (
          <div
            className="absolute left-1/2 -translate-x-1/2 top-full mt-3 z-50 bg-white rounded-xl shadow-2xl border border-gray-100 p-2.5"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[10px] text-gray-400 font-medium mb-2 text-center">Cor do marco</p>
            <div className="flex gap-2">
              {EVENT_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => { updateNodeData(id, { color: c.value }); setShowColorPicker(false); }}
                  className="w-6 h-6 rounded-full transition-transform hover:scale-125 relative"
                  style={{ backgroundColor: c.value }}
                >
                  {color === c.value && (
                    <Check className="w-3 h-3 text-white absolute inset-0 m-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Title */}
      {editingTitle ? (
        <input
          autoFocus
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter')  commitTitle();
            if (e.key === 'Escape') { setLocalTitle(data.title); setEditingTitle(false); }
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="nodrag mt-2 font-bold text-center rounded-lg px-2 py-1 border outline-none bg-white text-gray-900 border-gray-200 focus:border-blue-500 w-auto"
          style={{ color, borderColor: `${color}66`, minWidth: 100, fontSize: `calc(0.75rem * ${textScale} * ${nodeScale})` }}
        />
      ) : (
        <p
          className={`mt-2 font-bold whitespace-nowrap px-1 text-[calc(0.75rem*var(--text-scale)*var(--node-scale))] ${!isReadOnly ? 'cursor-text' : ''}`}
          style={{ color }}
          onDoubleClick={(e) => { e.stopPropagation(); if (!isReadOnly) setEditingTitle(true); }}
          title={!isReadOnly ? "Duplo clique para editar" : undefined}
        >
          {data.title || 'Marco'}
        </p>
      )}

      {/* Date */}
      <span
        className="font-medium tabular-nums mt-0.5 text-[calc(0.625rem*var(--text-scale)*var(--node-scale))]"
        style={{ color: `${color}99` }}
      >
        {dateStr}
      </span>

      {/* Delete node button */}
      {!isReadOnly && (
        <button
          onClick={(e) => { e.stopPropagation(); removeNode(id); }}
          className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-red-100 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover/event:opacity-100 shadow-sm z-10 pointer-events-auto"
          style={{ transform: `scale(${btnScale})`, transformOrigin: 'center' }}
          title="Remover marco"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

    </div>
    </>
  );
}

export const EventNode = memo(EventNodeComponent);
