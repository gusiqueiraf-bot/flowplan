import { useState } from 'react';
import { Plus, Diamond } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { AddTaskDialog } from './AddTaskDialog';

export function Toolbar() {
  const addEvent = useStore((s) => s.addEvent);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <div
        className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 px-2 py-1.5 rounded-md border"
        style={{
          backgroundColor: 'hsl(var(--card) / 0.9)',
          borderColor: 'hsl(var(--border))',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="w-3.5 h-3.5" />
          Tarefa
        </Button>
        <div className="w-px h-4 bg-border" />
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={() => addEvent({ title: 'Novo marco' })}
        >
          <Diamond className="w-3.5 h-3.5" />
          Marco
        </Button>
      </div>

      <AddTaskDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
