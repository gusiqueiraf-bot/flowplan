import { memo, useCallback, useRef, useState, useEffect } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { createPortal } from 'react-dom';
import { Calendar, Check, Pencil, Plus, Palette, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { addDays, addBusinessDays, format, parseISO, differenceInCalendarDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DAY_WIDTH } from '@/lib/constants';

function PopoverPortal({ children, anchorRect, onClose, rightAlign = false }: { children: React.ReactNode, anchorRect: DOMRect | null, onClose: () => void, rightAlign?: boolean }) {
  if (!anchorRect) return null;
  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998]" onMouseDown={onClose} onClick={onClose} onWheel={onClose} />
      <div
        className="fixed z-[9999]"
        style={{ 
          top: anchorRect.bottom + 8, 
          left: rightAlign ? undefined : anchorRect.left,
          right: rightAlign ? window.innerWidth - anchorRect.right : undefined
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </>,
    document.body
  );
}

export interface TaskNodeData {
  title: string;
  duration: number;
  color: string;
  responsibleId?: string;
  stage?: string;
  description?: string;
  height?: number;
}

const PALETTE = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#10B981',
  '#F97316', '#EF4444', '#06B6D4', '#F59E0B',
];

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

function TaskNodeComponent({ data, xPos, id }: NodeProps<TaskNodeData>) {
  const zoom                = useStore((s) => s.viewportZoom);
  const projectStartDate    = useStore((s) => s.projectStartDate);
  const stages              = useStore((s) => s.stages);
  const people              = useStore((s) => s.people);
  const colorMode           = useStore((s) => s.colorMode);
  const showWeekends        = useStore((s) => s.showWeekends);
  const updateNodeData      = useStore((s) => s.updateNodeData);
  const removeNode          = useStore((s) => s.removeNode);
  const cascadeNodeDuration = useStore((s) => s.cascadeNodeDuration);
  const setNodeStartDate    = useStore((s) => s.setNodeStartDate);
  const setEditingNodeId    = useStore((s) => s.setEditingNodeId);
  const addStage            = useStore((s) => s.addStage);
  const addPerson           = useStore((s) => s.addPerson);
  const isReadOnly          = useStore((s) => s.isReadOnly);

  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  // Scaling inverso ao zoom (aplicado no CSS root do node)
  // Explicação: 1 / sqrt(zoom). Se zoom = 0.25 (1/4), sqrt(0.25) = 0.5. 1 / 0.5 = 2.0x escopo texto.
  const textScale = Math.min(2.5, Math.max(0.8, 1 / Math.pow(zoom, 0.5)));
  const btnScale = Math.max(1, 0.8 / zoom);

  const isShort = data.duration <= 2;
  const titleScale = isShort ? textScale * 0.8 : textScale;
  const descScale = isShort ? textScale * 0.9 : textScale;

  // ─── Editing state ─────────────────────────────────────────────────────
  const [editingTitle,     setEditingTitle]    = useState(false);
  const [localTitle,       setLocalTitle]      = useState(data.title);
  const [editingDesc,      setEditingDesc]     = useState(false);
  const [localDesc,        setLocalDesc]       = useState(data.description || '');

  const [stagePickerRect,  setStagePickerRect]  = useState<DOMRect | null>(null);
  const [personPickerRect, setPersonPickerRect] = useState<DOMRect | null>(null);
  const [colorPickerRect,  setColorPickerRect]  = useState<DOMRect | null>(null);
  const [datePickerRect,   setDatePickerRect]   = useState<DOMRect | null>(null);

  const [editingDuration,  setEditingDuration] = useState(false);
  const [localDuration,    setLocalDuration]   = useState(String(data.duration));
  const [isResizing,       setIsResizing]      = useState(false);

  // ─── New-stage inline form state ────────────────────────────────────────
  const [addingStage,    setAddingStage]    = useState(false);
  const [newStageLabel,  setNewStageLabel]  = useState('');
  const [newStageColor,  setNewStageColor]  = useState(PALETTE[0]);

  // ─── New-person inline form state ───────────────────────────────────────
  const [addingPerson,   setAddingPerson]   = useState(false);
  const [newPersonName,  setNewPersonName]  = useState('');
  const [newPersonColor, setNewPersonColor] = useState(PALETTE[2]);

  const lastDurationRef = useRef(data.duration);

  useEffect(() => setLocalTitle(data.title),              [data.title]);
  useEffect(() => setLocalDesc(data.description || ''),   [data.description]);
  useEffect(() => setLocalDuration(String(data.duration)), [data.duration]);

  // ─── Color resolution ───────────────────────────────────────────────────
  const person   = people.find((p) => p.id === data.responsibleId);
  const stageObj = stages.find((s) => s.label === data.stage);

  let accentColor = data.color || '#3B82F6';
  if      (colorMode === 'stage'       && stageObj) accentColor = stageObj.color;
  else if (colorMode === 'responsible' && person)   accentColor = person.color;

  const stageBadgeColor = stageObj?.color ?? '#9CA3AF';
  const personColor     = person?.color   ?? '#9CA3AF';

  // ─── Dates ──────────────────────────────────────────────────────────────
  const dayOffset    = Math.round(xPos / DAY_WIDTH);
  const startDate    = addDays(projectStartDate, dayOffset);
  const endDate      = showWeekends
    ? addDays(startDate, data.duration)
    : addBusinessDays(startDate, data.duration);
  const startDateStr = format(startDate, 'yyyy-MM-dd');

  const calendarDays = differenceInCalendarDays(endDate, startDate);
  const calculatedWidth = Math.max((showWeekends ? data.duration : calendarDays) * DAY_WIDTH, DAY_WIDTH);
  const width = Math.max(calculatedWidth, 150);

  // ─── Resize (nodrag tells ReactFlow to skip its drag on this element) ───
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setIsResizing(true);
      useStore.temporal.getState().pause();
      const startX   = e.clientX;
      const startDur = data.duration;
      lastDurationRef.current = startDur;

      const onMove = (mv: MouseEvent) => {
        const daysDelta   = Math.round((mv.clientX - startX) / (DAY_WIDTH * zoomRef.current));
        const newDuration = Math.max(1, startDur + daysDelta);
        if (newDuration !== lastDurationRef.current) {
          cascadeNodeDuration(id, lastDurationRef.current, newDuration);
          lastDurationRef.current = newDuration;
        }
      };
      const onUp = () => {
        setIsResizing(false);
        useStore.temporal.getState().resume();
        useStore.setState((s) => ({ ...s }));
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [data.duration, id, cascadeNodeDuration],
  );

  const handleVerticalResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      useStore.temporal.getState().pause();
      const startY = e.clientY;
      const startHeight = data.height || (e.currentTarget.parentElement?.getBoundingClientRect().height ?? 150);

      const onMove = (mv: MouseEvent) => {
        const delta = (mv.clientY - startY) / zoomRef.current;
        const newHeight = Math.max(100, startHeight + delta);
        updateNodeData(id, { height: newHeight });
      };
      const onUp = () => {
        useStore.temporal.getState().resume();
        useStore.setState((s) => ({ ...s }));
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [data.height, id, updateNodeData],
  );

  // ─── Commit helpers ─────────────────────────────────────────────────────
  const commitTitle = () => {
    updateNodeData(id, { title: localTitle.trim() || 'Nova tarefa' });
    setEditingTitle(false);
  };
  const commitDesc = () => {
    updateNodeData(id, { description: localDesc.trim() });
    setEditingDesc(false);
  };
  const commitDuration = () => {
    const n = Math.max(1, parseInt(localDuration) || 1);
    cascadeNodeDuration(id, data.duration, n);
    setEditingDuration(false);
  };
  const selectStage  = (label: string | undefined) => { updateNodeData(id, { stage: label }); setStagePickerRect(null); };
  const selectPerson = (pid:   string | undefined) => { updateNodeData(id, { responsibleId: pid }); setPersonPickerRect(null); };

  const commitNewStage = () => {
    if (newStageLabel.trim()) {
      const newId = `stage-${Date.now()}`;
      addStage({ id: newId, label: newStageLabel.trim(), color: newStageColor });
      selectStage(newStageLabel.trim());
    }
    setNewStageLabel(''); setAddingStage(false);
  };
  const commitNewPerson = () => {
    if (newPersonName.trim()) {
      const newId = `per-${Date.now()}`;
      addPerson({ id: newId, name: newPersonName.trim(), color: newPersonColor });
      selectPerson(newId);
    }
    setNewPersonName(''); setAddingPerson(false);
  };

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div 
      className="relative group/card" 
      style={{ 
        width,
        minHeight: data.height ? `${data.height}px` : '180px',
        '--text-scale': textScale,
        '--title-scale': titleScale,
        '--desc-scale': descScale
      } as React.CSSProperties}
    >
      <Handle
        type="target"
        position={Position.Left}
        className={`!w-4 !h-4 !bg-white !border-2 !-left-3 !z-50 transition-transform before:absolute before:-inset-4 before:content-[''] ${!isReadOnly ? 'hover:scale-125' : 'opacity-0 !pointer-events-none'}`}
        style={{ borderColor: accentColor, top: '50%' }}
        title="Entrada de dependência"
      />
      <Handle
        type="source"
        position={Position.Right}
        className={`!w-4 !h-4 !bg-white !border-2 !-right-3 !z-50 transition-transform before:absolute before:-inset-4 before:content-[''] ${!isReadOnly ? 'hover:scale-125 hover:bg-gray-50 cursor-crosshair' : 'opacity-0 !pointer-events-none'}`}
        style={{ borderColor: accentColor, top: '50%' }}
        title="Arraste para conectar com outro card"
      />

      {/* ── Card ─────────────────────────────────────────────────────────── */}
      <div
        className="absolute top-0 left-0 w-full min-h-[100%] min-w-[100%] group-hover/card:min-w-[280px] rounded-xl bg-white overflow-visible select-none transition-all duration-200 flex flex-col z-10 group-hover/card:z-40"
        style={{
          borderLeft: `5px solid ${accentColor}`,
          boxShadow: isResizing
            ? `0 8px 30px 0 ${accentColor}44, 0 0 0 2px ${accentColor}66`
            : '0 2px 14px 0 rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)',
          transformOrigin: 'top left',
        }}
        onMouseEnter={(e) => {
          // Bring node to front to prevent stacking context jitter
          const node = (e.target as HTMLElement).closest('.react-flow__node') as HTMLElement;
          if (node) node.style.zIndex = '1000';
        }}
        onMouseLeave={(e) => {
          const node = (e.target as HTMLElement).closest('.react-flow__node') as HTMLElement;
          if (node) node.style.zIndex = '';
        }}
      >
        {/* LOD Constraints */}
        <div className={`flex flex-col h-full w-full ${zoom < 0.15 ? 'p-2 justify-center' : 'p-3 space-y-3'}`}>

          {/* ── Row 1: Stage badge · Pencil ──────────────────────────────── */}
          <div className="flex items-center justify-between gap-2 min-w-0">

              {/* Stage picker */}
              <div className="relative flex-1 min-w-0">
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); if (!isReadOnly) setStagePickerRect(e.currentTarget.getBoundingClientRect()); }}
                  className={`inline-flex items-center gap-1.5 font-bold px-4 py-1.5 rounded-full text-white truncate max-w-full transition-all shadow-sm text-[calc(0.875rem*var(--text-scale))] ${!isReadOnly ? 'hover:brightness-110' : ''}`}
                  style={{ backgroundColor: stageBadgeColor }}
                  title="Clique para trocar etapa"
                >
                  {data.stage ?? 'Sem etapa'}
                </button>

                <PopoverPortal anchorRect={stagePickerRect} onClose={() => { setStagePickerRect(null); setAddingStage(false); }}>
                  <div className="min-w-[185px] rounded-xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-100 dark:border-gray-700 p-1.5 animate-in fade-in zoom-in duration-200">
                  {/* Existing stages */}
                  <div className="space-y-0.5">
                    {stages.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => selectStage(s.label)}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors"
                      >
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex-1 truncate">{s.label}</span>
                        {data.stage === s.label && <Check className="w-3.5 h-3.5 text-gray-400" />}
                      </button>
                    ))}
                    <div className="h-px bg-gray-100 dark:bg-gray-700 my-0.5" />
                    <button
                      type="button"
                      onClick={() => selectStage(undefined)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors"
                    >
                      <span className="w-3 h-3 rounded-full border-2 border-dashed border-gray-300 shrink-0" />
                      <span className="text-xs text-gray-400">Sem etapa</span>
                    </button>
                  </div>

                  {/* Add new stage */}
                  <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />
                  {addingStage ? (
                    <div className="px-2 py-1.5 space-y-2">
                      <input
                        autoFocus
                        value={newStageLabel}
                        onChange={(e) => setNewStageLabel(e.target.value)}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === 'Enter')  commitNewStage();
                          if (e.key === 'Escape') { setAddingStage(false); setNewStageLabel(''); }
                        }}
                        placeholder="Nome da etapa..."
                        className="nodrag w-full text-xs rounded-lg border border-gray-200 bg-white text-gray-900 px-2 py-1.5 outline-none focus:border-blue-500"
                      />
                      <div className="flex gap-1.5 flex-wrap">
                        {PALETTE.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setNewStageColor(c)}
                            className="w-5 h-5 rounded-full transition-transform hover:scale-125"
                            style={{
                              backgroundColor: c,
                              outline: newStageColor === c ? `2px solid ${c}` : 'none',
                              outlineOffset: '2px',
                            }}
                          />
                        ))}
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onMouseDown={commitNewStage}
                          className="flex-1 text-xs font-semibold py-1 rounded-lg text-white transition-colors"
                          style={{ backgroundColor: newStageColor }}
                        >
                          Criar
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAddingStage(false); setNewStageLabel(''); }}
                          className="px-2 text-xs text-gray-400 hover:text-gray-600 rounded-lg"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAddingStage(true)}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors text-xs text-gray-400 hover:text-gray-600"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Nova etapa
                    </button>
                  )}
                </div>
              </PopoverPortal>
            </div>

            {/* Right side actions */}
            {!isReadOnly && (
              <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover/card:opacity-100 transition-opacity">
                {colorMode === 'custom' && (
                <div className="relative">
                  <button
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-colors shadow-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 text-gray-400 hover:text-gray-600"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); setColorPickerRect(e.currentTarget.getBoundingClientRect()); }}
                    title="Mudar cor do card"
                  >
                    <Palette className="w-3.5 h-3.5" style={{ color: accentColor }} />
                  </button>
                  <PopoverPortal anchorRect={colorPickerRect} onClose={() => setColorPickerRect(null)} rightAlign>
                    <div className="min-w-[114px] p-2 rounded-xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-100 dark:border-gray-700 flex gap-1.5 flex-wrap animate-in fade-in zoom-in duration-200">
                      {PALETTE.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => { updateNodeData(id, { color: c }); setColorPickerRect(null); }}
                          className="w-5 h-5 rounded-full hover:scale-125 transition-transform"
                          style={{ backgroundColor: c, outline: data.color === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }}
                        />
                      ))}
                    </div>
                  </PopoverPortal>
                </div>
              )}

              {/* Pencil */}
              <button
                className="w-7 h-7 rounded-full flex items-center justify-center shadow-sm"
                style={{ backgroundColor: accentColor, color: '#fff' }}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); setEditingNodeId(id); }}
                title="Abrir edição completa"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          </div>

          {/* ── Row 2: Title ─────────────────────────────────────────────── */}
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
              className="nodrag w-full font-black rounded-lg px-2 py-1 outline-none border border-gray-200 bg-white text-gray-900 focus:border-blue-500 leading-tight text-[calc(1.75rem*var(--text-scale))]"
              style={{ color: accentColor }}
            />
          ) : (
            <p
              className="font-black leading-tight cursor-text break-words line-clamp-3 mb-1 text-[calc(1.75rem*var(--title-scale))]"
              style={{ color: accentColor }}
              onDoubleClick={(e) => { e.stopPropagation(); if (!isReadOnly) { setLocalTitle(data.title); setEditingTitle(true); } }}
              onMouseDown={(e) => e.stopPropagation()}
              title={!isReadOnly ? "Duplo clique para editar" : undefined}
            >
              {data.title || 'Nova tarefa'}
            </p>
          )}

          {/* ── Row 3: Responsible ───────────────────────────────────────── */}
          <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); if (!isReadOnly) setPersonPickerRect(e.currentTarget.getBoundingClientRect()); }}
                className={`flex items-center gap-2 min-w-0 w-full transition-opacity ${!isReadOnly ? 'hover:opacity-75' : ''}`}
                title={!isReadOnly ? "Clique para alterar responsável" : undefined}
              >
                <div
                  className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-sm"
                  style={{ backgroundColor: personColor }}
                >
                  {person ? getInitials(person.name) : '?'}
                </div>
                <span className="text-gray-500 dark:text-gray-400 truncate font-medium text-[calc(0.875rem*var(--text-scale))]">
                  {person ? person.name : 'Sem responsável'}
                </span>
              </button>

              <PopoverPortal anchorRect={personPickerRect} onClose={() => { setPersonPickerRect(null); setAddingPerson(false); }}>
                <div className="min-w-[200px] rounded-xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-100 dark:border-gray-700 p-1.5 animate-in fade-in zoom-in duration-200">
                {/* Existing people */}
                <div className="space-y-0.5">
                  {people.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectPerson(data.responsibleId === p.id ? undefined : p.id)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors"
                    >
                      <div
                        className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ backgroundColor: p.color }}
                      >
                        {getInitials(p.name)}
                      </div>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 flex-1 truncate">{p.name}</span>
                      {data.responsibleId === p.id && <Check className="w-3.5 h-3.5 text-gray-400" />}
                    </button>
                  ))}
                  <div className="h-px bg-gray-100 dark:bg-gray-700 my-0.5" />
                  <button
                    type="button"
                    onClick={() => selectPerson(undefined)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
                  >
                    <div className="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 shrink-0" />
                    <span className="text-xs text-gray-400">Sem responsável</span>
                  </button>
                </div>

                {/* Add new person */}
                <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />
                {addingPerson ? (
                  <div className="px-2 py-1.5 space-y-2">
                    <input
                      autoFocus
                      value={newPersonName}
                      onChange={(e) => setNewPersonName(e.target.value)}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Enter')  commitNewPerson();
                        if (e.key === 'Escape') { setAddingPerson(false); setNewPersonName(''); }
                      }}
                      placeholder="Nome da pessoa..."
                      className="nodrag w-full text-xs rounded-lg border border-gray-200 bg-white text-gray-900 px-2 py-1.5 outline-none focus:border-blue-500"
                    />
                    <div className="flex gap-1.5 flex-wrap">
                      {PALETTE.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewPersonColor(c)}
                          className="w-5 h-5 rounded-full transition-transform hover:scale-125"
                          style={{
                            backgroundColor: c,
                            outline: newPersonColor === c ? `2px solid ${c}` : 'none',
                            outlineOffset: '2px',
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onMouseDown={commitNewPerson}
                        className="flex-1 text-xs font-semibold py-1 rounded-lg text-white transition-colors"
                        style={{ backgroundColor: newPersonColor }}
                      >
                        Criar
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAddingPerson(false); setNewPersonName(''); }}
                        className="px-2 text-xs text-gray-400 hover:text-gray-600 rounded-lg"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddingPerson(true)}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors text-xs text-gray-400 hover:text-gray-600"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Nova pessoa
                  </button>
                )}
              </div>
            </PopoverPortal>
          </div>

          {/* ── Row 4: Dates + Duration ───────────────────────────────────── */}
          <div
            className="relative flex items-center justify-between w-full gap-2"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden whitespace-nowrap">
              <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); if (!isReadOnly) setDatePickerRect(e.currentTarget.getBoundingClientRect()); }}
                className={`font-semibold tabular-nums transition-colors text-[calc(0.875rem*var(--text-scale))] shrink-0 ${!isReadOnly ? 'hover:underline underline-offset-2' : ''}`}
                style={{ color: accentColor }}
                title={!isReadOnly ? "Clique para mudar data de início" : undefined}
              >
                {format(startDate, 'dd MMM', { locale: ptBR })}
              </button>

              <span className="text-gray-400 text-[calc(0.875rem*var(--text-scale))] shrink-0">→</span>
              <span className="font-medium text-gray-400 tabular-nums text-[calc(0.875rem*var(--text-scale))] shrink-0">
                {format(endDate, 'dd MMM', { locale: ptBR })}
              </span>
            </div>

            <div className="shrink-0 flex items-center justify-end">
              {editingDuration ? (
                <input
                  autoFocus
                  type="number"
                  min={1}
                  max={365}
                  value={localDuration}
                  onChange={(e) => setLocalDuration(e.target.value)}
                  onBlur={commitDuration}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter')  commitDuration();
                    if (e.key === 'Escape') setEditingDuration(false);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="nodrag w-16 font-mono font-bold text-center rounded-md border border-gray-200 bg-white text-gray-900 focus:border-blue-500 outline-none px-1 py-0.5 text-[calc(0.875rem*var(--text-scale))]"
                  style={{ color: accentColor }}
                />
              ) : (
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); if (!isReadOnly) { setLocalDuration(String(data.duration)); setEditingDuration(true); } }}
                  className="font-bold px-3 py-1 rounded-full transition-colors text-[calc(0.875rem*var(--text-scale))]"
                  style={{ color: accentColor, backgroundColor: `${accentColor}18` }}
                  title={!isReadOnly ? "Clique para editar duração" : undefined}
                >
                  {data.duration}d
                </button>
              )}
            </div>
          </div>

          <PopoverPortal anchorRect={datePickerRect} onClose={() => setDatePickerRect(null)}>
                <div className="bg-white dark:bg-gray-900 shadow-2xl border border-gray-100 dark:border-gray-700 rounded-xl p-2.5 animate-in fade-in zoom-in duration-200">
                  <p className="text-[10px] text-gray-400 mb-1.5 font-medium">Data de início</p>
                  <input
                    type="date"
                    defaultValue={startDateStr}
                    autoFocus
                    className="text-xs rounded border border-gray-200 bg-gray-50 px-2 py-1 outline-none dark:bg-gray-800 dark:border-gray-700"
                    onChange={(e) => {
                      if (!e.target.value) return;
                      try {
                        const d = parseISO(e.target.value);
                        setNodeStartDate(id, d);
                        setDatePickerRect(null);
                      } catch {
                        // ignore parse error
                      }
                    }}
                  />
                </div>
              </PopoverPortal>

          {/* ── Row 5: Description ───────────────────────────────────────── */}
          <div className="mt-auto pt-4 flex-1 flex flex-col">
              {editingDesc ? (
                <textarea
                  autoFocus
                  value={localDesc}
                  onChange={(e) => setLocalDesc(e.target.value)}
                  onBlur={commitDesc}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Escape') { setLocalDesc(data.description || ''); setEditingDesc(false); }
                    if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); commitDesc(); }
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="nodrag w-full flex-1 min-h-[40px] resize-none rounded-lg px-2 py-1 outline-none border border-gray-200 bg-white text-gray-900 focus:border-blue-500 text-[calc(0.75rem*var(--text-scale))] leading-snug"
                  placeholder="Insira a descrição..."
                />
              ) : (
                <div
                  className={`flex-1 ${!isReadOnly ? 'cursor-text' : ''}`}
                  onDoubleClick={(e) => { e.stopPropagation(); if (!isReadOnly) setEditingDesc(true); }}
                  onMouseDown={(e) => e.stopPropagation()}
                  title={!isReadOnly ? "Duplo clique para editar descrição" : undefined}
                >
                  {data.description ? (
                    <p className="text-gray-500 dark:text-gray-400 leading-snug text-[calc(0.75rem*var(--desc-scale))] whitespace-pre-wrap break-words">
                      {data.description}
                    </p>
                  ) : (
                    <p className="text-gray-300 dark:text-gray-600 leading-snug text-[calc(0.75rem*var(--desc-scale))] italic">
                      Acrescentar descrição...
                    </p>
                  )}
                </div>
              )}
            </div>
        </div>
        
        {/* Bottom Resize Handle */}
        {!isReadOnly && (
          <div
            className="nodrag absolute bottom-0 left-0 w-full h-[12px] -mb-[6px] cursor-ns-resize hover:bg-gray-200/50 transition-colors z-20 flex justify-center items-center"
            onMouseDown={handleVerticalResizeMouseDown}
            title="Arraste para ajustar a altura"
          >
            <div className="w-8 h-1.5 rounded-full bg-gray-300 opacity-0 group-hover/card:opacity-100 transition-opacity" />
          </div>
        )}

        {/* Delete node button */}
        {!isReadOnly && (
          <button
            onClick={(e) => { e.stopPropagation(); removeNode(id); }}
            className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-red-100 dark:bg-red-900 hover:bg-red-500 dark:hover:bg-red-500 text-red-500 dark:text-red-300 hover:text-white dark:hover:text-white flex items-center justify-center transition-all opacity-0 group-hover/card:opacity-100 shadow-sm z-30 pointer-events-auto"
            style={{ transform: `scale(${btnScale})`, transformOrigin: 'center' }}
            title="Remover tarefa"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* ── Resize strip — Horizontal width duration resize ── */}
        {!isReadOnly && (
          <div
            className="nodrag absolute top-0 right-0 h-full w-[16px] -mr-[8px] cursor-ew-resize z-20 flex items-center justify-center opacity-0 group-hover/card:opacity-100"
            onMouseDown={handleResizeMouseDown}
            title="Arraste para alterar a duração"
          >
            <div
              className={`w-1.5 rounded-full transition-all duration-150 ${
                isResizing ? 'opacity-90' : 'opacity-20 group-hover/card:opacity-70'
              }`}
              style={{
                height: isResizing ? '70%' : '40%',
                backgroundColor: accentColor,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export const TaskNode = memo(TaskNodeComponent);
