import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore } from '@/store/useStore';

const PRESET_COLORS = [
  { label: 'Azul', value: 'hsl(215, 60%, 55%)' },
  { label: 'Verde', value: 'hsl(145, 55%, 45%)' },
  { label: 'Laranja', value: 'hsl(25, 90%, 55%)' },
  { label: 'Roxo', value: 'hsl(270, 55%, 60%)' },
  { label: 'Rosa', value: 'hsl(340, 65%, 58%)' },
  { label: 'Vermelho', value: 'hsl(0, 65%, 55%)' },
  { label: 'Ciano', value: 'hsl(185, 60%, 45%)' },
  { label: 'Amarelo', value: 'hsl(45, 90%, 50%)' },
];

const STAGES = ['Planejamento', 'Design', 'Desenvolvimento', 'Testes', 'Revisão', 'Entrega'];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_COLOR = PRESET_COLORS[0].value;

export function AddTaskDialog({ open, onOpenChange }: Props) {
  const addTask = useStore((s) => s.addTask);

  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(3);
  const [stage, setStage] = useState('');
  const [responsible, setResponsible] = useState('');
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    addTask({
      title: title.trim() || 'Nova tarefa',
      duration: Math.max(1, duration),
      color,
      responsibleId: responsible.trim() || undefined,
      stage: stage || undefined,
      description: description.trim() || undefined,
      height: 180,
    });
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setTitle('');
    setDuration(3);
    setStage('');
    setResponsible('');
    setColor(DEFAULT_COLOR);
    setDescription('');
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-base">Nova Tarefa</DialogTitle>
          <DialogDescription className="sr-only">
            Preencha os dados para criar uma nova tarefa no plano.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-medium">
              Título
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome da tarefa"
              className="h-8 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <Label htmlFor="duration" className="text-xs font-medium">
              Duração (dias)
            </Label>
            <Input
              id="duration"
              type="number"
              min={1}
              max={90}
              value={duration}
              onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
              className="h-8 text-sm w-24"
            />
          </div>

          {/* Stage */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Etapa do projeto</Label>
            <div className="flex flex-wrap gap-1.5">
              {STAGES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStage(stage === s ? '' : s)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                    stage === s
                      ? 'bg-foreground text-background border-foreground'
                      : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Responsible */}
          <div className="space-y-1.5">
            <Label htmlFor="responsible" className="text-xs font-medium">
              Responsável
            </Label>
            <Input
              id="responsible"
              value={responsible}
              onChange={(e) => setResponsible(e.target.value)}
              placeholder="Nome do responsável"
              className="h-8 text-sm"
            />
          </div>

          {/* Color */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Cor</Label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => setColor(c.value)}
                  className="w-6 h-6 rounded-full transition-transform"
                  style={{
                    backgroundColor: c.value,
                    outline: color === c.value ? `2px solid ${c.value}` : 'none',
                    outlineOffset: '2px',
                    transform: color === c.value ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-medium">
              Descrição{' '}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes, contexto ou observações..."
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSubmit}>
            Criar Tarefa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
