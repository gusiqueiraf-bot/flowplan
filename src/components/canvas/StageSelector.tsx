import { useState, useRef, useEffect } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { useStore } from '@/store/useStore';

const PALETTE = [
  '#8B5CF6', '#EC4899', '#3B82F6', '#10B981',
  '#F59E0B', '#EF4444', '#06B6D4', '#84CC16',
  '#F97316', '#6366F1', '#14B8A6', '#E11D48',
];

interface Props {
  value?: string;
  onChange: (label: string | undefined) => void;
}

export function StageSelector({ value, onChange }: Props) {
  const stages = useStore((s) => s.stages);
  const addStage = useStore((s) => s.addStage);
  const updateStage = useStore((s) => s.updateStage);
  const removeStage = useStore((s) => s.removeStage);

  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState(PALETTE[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const newInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) newInputRef.current?.focus();
  }, [adding]);

  useEffect(() => {
    if (editingId) editInputRef.current?.focus();
  }, [editingId]);

  const commitNew = () => {
    if (newLabel.trim()) {
      addStage({ label: newLabel.trim(), color: newColor });
    }
    setNewLabel('');
    setAdding(false);
  };

  const commitEdit = () => {
    if (editingId && editLabel.trim()) {
      updateStage(editingId, { label: editLabel.trim() });
    }
    setEditingId(null);
  };

  return (
    <div className="space-y-2">
      {/* Stage pills */}
      <div className="flex flex-wrap gap-1.5">
        {stages.map((stage) => {
          const selected = value === stage.label;
          return (
            <div key={stage.id} className="group relative">
              {editingId === stage.id ? (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: stage.color }}
                >
                  <input
                    ref={editInputRef}
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitEdit();
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="bg-transparent outline-none w-24 text-white placeholder:text-white/60"
                    style={{ minWidth: 60 }}
                  />
                  <button type="button" onMouseDown={commitEdit}>
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onChange(selected ? undefined : stage.label)}
                  onDoubleClick={() => {
                    setEditingId(stage.id);
                    setEditLabel(stage.label);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white transition-all hover:brightness-110 active:scale-95"
                  style={{
                    backgroundColor: stage.color,
                    opacity: value && !selected ? 0.35 : 1,
                    outline: selected ? `2px solid ${stage.color}` : 'none',
                    outlineOffset: '2px',
                  }}
                  title="Clique para selecionar · Duplo clique para editar"
                >
                  {selected && <Check className="w-3 h-3 shrink-0" />}
                  {stage.label}
                </button>
              )}
              {/* Remove button on hover */}
              {!editingId && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (value === stage.label) onChange(undefined);
                    removeStage(stage.id);
                  }}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-foreground text-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] border border-dashed border-muted-foreground/40 text-muted-foreground hover:border-foreground/50 hover:text-foreground transition-colors"
        >
          <Plus className="w-3 h-3" />
          Nova etapa
        </button>
      </div>

      {/* New stage form */}
      {adding && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-muted/30">
          <input
            ref={newInputRef}
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Nome da etapa..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitNew();
              if (e.key === 'Escape') setAdding(false);
            }}
          />
          <div className="flex gap-1.5">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewColor(c)}
                className="w-4 h-4 rounded-full transition-transform hover:scale-110"
                style={{
                  backgroundColor: c,
                  outline: newColor === c ? `2px solid ${c}` : 'none',
                  outlineOffset: '1px',
                }}
              />
            ))}
          </div>
          <button
            type="button"
            onMouseDown={commitNew}
            className="text-xs font-semibold text-primary px-1.5"
          >
            OK
          </button>
          <button
            type="button"
            onClick={() => setAdding(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
