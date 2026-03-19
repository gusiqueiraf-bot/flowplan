import { useState, useRef, useEffect } from 'react';
import { Plus, X, Check, Pencil } from 'lucide-react';
import { useStore } from '@/store/useStore';

const PALETTE = [
  '#3B82F6', '#EC4899', '#10B981', '#F59E0B',
  '#8B5CF6', '#EF4444', '#06B6D4', '#F97316',
  '#6366F1', '#84CC16', '#14B8A6', '#E11D48',
];

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

interface Props {
  /** Currently selected person id */
  value?: string;
  onChange: (personId: string | undefined) => void;
}

export function PersonSelector({ value, onChange }: Props) {
  const people = useStore((s) => s.people);
  const addPerson = useStore((s) => s.addPerson);
  const updatePerson = useStore((s) => s.updatePerson);
  const removePerson = useStore((s) => s.removePerson);

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PALETTE[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState(PALETTE[0]);
  const newInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (adding) newInputRef.current?.focus(); }, [adding]);
  useEffect(() => { if (editingId) editInputRef.current?.focus(); }, [editingId]);

  const commitNew = () => {
    if (newName.trim()) addPerson({ name: newName.trim(), color: newColor });
    setNewName('');
    setAdding(false);
  };

  const startEdit = (person: { id: string; name: string; color: string }) => {
    setEditingId(person.id);
    setEditName(person.name);
    setEditColor(person.color);
  };

  const commitEdit = () => {
    if (editingId && editName.trim()) {
      updatePerson(editingId, { name: editName.trim(), color: editColor });
    }
    setEditingId(null);
  };

  return (
    <div className="space-y-2">
      {/* Person pills */}
      <div className="flex flex-wrap gap-2">
        {people.map((person) => {
          const selected = value === person.id;
          const isEditing = editingId === person.id;

          return (
            <div key={person.id} className="group relative">
              {isEditing ? (
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-xs font-semibold"
                  style={{ backgroundColor: editColor }}
                >
                  {/* Color swatch in edit mode */}
                  <div className="flex gap-1">
                    {PALETTE.slice(0, 6).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditColor(c)}
                        className="w-3 h-3 rounded-full transition-transform hover:scale-125"
                        style={{
                          backgroundColor: c,
                          outline: editColor === c ? '2px solid white' : 'none',
                          outlineOffset: '1px',
                        }}
                      />
                    ))}
                  </div>
                  <input
                    ref={editInputRef}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitEdit();
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="bg-transparent outline-none w-24 text-white placeholder:text-white/60 text-xs"
                  />
                  <button type="button" onMouseDown={commitEdit}>
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onChange(selected ? undefined : person.id)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-xs font-semibold transition-all hover:brightness-110 active:scale-95"
                  style={{
                    backgroundColor: person.color,
                    opacity: value && !selected ? 0.35 : 1,
                    outline: selected ? `2px solid ${person.color}` : 'none',
                    outlineOffset: '2px',
                  }}
                  title="Clique para selecionar · Duplo clique para editar"
                  onDoubleClick={(e) => { e.preventDefault(); startEdit(person); }}
                >
                  <span
                    className="w-4 h-4 rounded-full bg-white/25 flex items-center justify-center text-[8px] font-bold shrink-0"
                  >
                    {getInitials(person.name)}
                  </span>
                  {person.name}
                  {selected && <Check className="w-3 h-3 shrink-0" />}
                </button>
              )}

              {/* Edit + Remove buttons on hover */}
              {!isEditing && (
                <div className="absolute -top-1.5 -right-1.5 hidden group-hover:flex gap-0.5">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); startEdit(person); }}
                    className="w-4 h-4 rounded-full bg-gray-700 text-white flex items-center justify-center"
                    title="Editar"
                  >
                    <Pencil className="w-2 h-2" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (value === person.id) onChange(undefined);
                      removePerson(person.id);
                    }}
                    className="w-4 h-4 rounded-full bg-gray-700 text-white flex items-center justify-center"
                    title="Remover"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
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
          Nova pessoa
        </button>
      </div>

      {/* Add new person form */}
      {adding && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-muted/30">
          <input
            ref={newInputRef}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome da pessoa..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitNew();
              if (e.key === 'Escape') setAdding(false);
            }}
          />
          <div className="flex gap-1.5 flex-wrap max-w-[140px]">
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
