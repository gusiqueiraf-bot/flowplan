import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
const Label = 'label' as any;
import { useStore } from '@/store/useStore';
import { StageSelector } from './StageSelector';
import { PersonSelector } from './PersonSelector';

const PRESET_COLORS = [
  { label: 'Azul',     value: '#3B82F6' },
  { label: 'Roxo',     value: '#8B5CF6' },
  { label: 'Rosa',     value: '#EC4899' },
  { label: 'Verde',    value: '#10B981' },
  { label: 'Laranja',  value: '#F97316' },
  { label: 'Vermelho', value: '#EF4444' },
  { label: 'Ciano',    value: '#06B6D4' },
  { label: 'Amarelo',  value: '#F59E0B' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeId?: string | null;
}

export function TaskDialog({ open, onOpenChange, nodeId }: Props) {
  const addTask             = useStore((s) => s.addTask);
  const updateNodeData      = useStore((s) => s.updateNodeData);
  const cascadeNodeDuration = useStore((s) => s.cascadeNodeDuration);
  const nodes               = useStore((s) => s.nodes);

  const isEdit   = !!nodeId;
  const node     = nodeId ? nodes.find((n) => n.id === nodeId) : null;
  const nodeData = node?.data as Record<string, unknown> | undefined;

  const [title,         setTitle]         = useState('');
  const [duration,      setDuration]      = useState(3);
  const [stage,         setStage]         = useState<string | undefined>(undefined);
  const [responsibleId, setResponsibleId] = useState<string | undefined>(undefined);
  const [color,         setColor]         = useState(PRESET_COLORS[0].value);
  const [description,   setDescription]   = useState('');

  // Populate form only when dialog opens
  useEffect(() => {
    if (!open) return;
    if (isEdit && nodeData) {
      setTitle((nodeData.title as string) || '');
      setDuration((nodeData.duration as number) || 3);
      setStage((nodeData.stage as string | undefined) || undefined);
      setResponsibleId((nodeData.responsibleId as string | undefined) || undefined);
      setColor((nodeData.color as string) || PRESET_COLORS[0].value);
      setDescription((nodeData.description as string) || '');
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetForm = () => {
    setTitle('');
    setDuration(3);
    setStage(undefined);
    setResponsibleId(undefined);
    setColor(PRESET_COLORS[0].value);
    setDescription('');
  };

  const handleSubmit = () => {
    const data = {
      title: title.trim() || 'Nova tarefa',
      duration: Math.max(1, duration),
      color,
      responsibleId: responsibleId || undefined,
      stage: stage || undefined,
      description: description.trim() || undefined,
      height: (nodeData?.height as number) || 180,
    };

    if (isEdit && nodeId) {
      const oldDuration = (nodeData?.duration as number) ?? data.duration;
      // Update all fields (title, color, stage, responsible, description, duration)
      updateNodeData(nodeId, data);
      // If duration changed, also cascade downstream connected nodes
      if (data.duration !== oldDuration) {
        cascadeNodeDuration(nodeId, oldDuration, data.duration);
      }
    } else {
      addTask(data);
    }

    if (!isEdit) resetForm();
    onOpenChange(false);
  };

  const handleOpenChange = (o: boolean) => {
    if (!o && !isEdit) resetForm();
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="text-base">
            {isEdit ? 'Editar Tarefa' : 'Nova Tarefa'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Preencha os dados da tarefa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="task-title" className="text-xs font-medium">Título</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome da tarefa"
              className="h-8 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              autoFocus
            />
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <Label htmlFor="task-duration" className="text-xs font-medium">Duração (dias)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="task-duration"
                type="number"
                min={1}
                max={365}
                value={duration}
                onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                className="h-8 text-sm w-24"
              />
              <div className="flex gap-1">
                {[1, 3, 5, 7, 14].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className={`text-[11px] px-2 py-1 rounded border transition-all ${
                      duration === d
                        ? 'bg-foreground text-background border-foreground'
                        : 'border-border text-muted-foreground hover:border-foreground/40'
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stage */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Etapa{' '}
              <span className="text-muted-foreground font-normal text-[10px]">
                · duplo clique para editar · × para remover
              </span>
            </Label>
            <StageSelector value={stage} onChange={setStage} />
          </div>

          {/* Responsible */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Responsável{' '}
              <span className="text-muted-foreground font-normal text-[10px]">
                · duplo clique para editar · × para remover
              </span>
            </Label>
            <PersonSelector value={responsibleId} onChange={setResponsibleId} />
          </div>

          {/* Custom color */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Cor personalizada{' '}
              <span className="text-muted-foreground font-normal text-[10px]">(modo "personalizado")</span>
            </Label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => setColor(c.value)}
                  className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c.value,
                    outline: color === c.value ? `2px solid ${c.value}` : 'none',
                    outlineOffset: '2px',
                    transform: color === c.value ? 'scale(1.2)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="task-desc" className="text-xs font-medium">
              Descrição <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <textarea
              id="task-desc"
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
            {isEdit ? 'Salvar' : 'Criar Tarefa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
