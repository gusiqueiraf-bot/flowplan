import Link from 'next/link';
import { ArrowLeft, Plus, Diamond, Settings, Grid3x3, CalendarOff, Palette, ChevronDown, Type } from 'lucide-react';
import { useStore, type ColorMode } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const COLOR_MODE_LABELS: Record<ColorMode, string> = {
  stage: 'Por etapa',
  responsible: 'Por responsável',
  custom: 'Personalizado',
};

export function TopBar() {
  const creationMode = useStore((s) => s.creationMode);
  const setCreationMode = useStore((s) => s.setCreationMode);
  
  const showWeekends = useStore((s) => s.showWeekends);
  const setShowWeekends = useStore((s) => s.setShowWeekends);
  const showGrid = useStore((s) => s.showGrid);
  const setShowGrid = useStore((s) => s.setShowGrid);
  const colorMode = useStore((s) => s.colorMode);
  const setColorMode = useStore((s) => s.setColorMode);
  const projectStartDate = useStore((s) => s.projectStartDate);
  const setProjectStartDate = useStore((s) => s.setProjectStartDate);

  return (
    <div
      className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4"
      style={{
        height: 48,
        backgroundColor: 'hsl(var(--card))',
        borderBottom: '1px solid hsl(var(--border))',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Left: brand */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors bg-muted/50 px-2 py-1.5 rounded-md">
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar ao Dashboard
        </Link>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-tight text-foreground">FlowPlan</span>
          <span className="text-xs text-muted-foreground font-mono">v0.1</span>
        </div>
      </div>

      {/* Center: actions */}
      <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
        <Button
          variant={creationMode === 'task' ? 'default' : 'ghost'}
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={() => setCreationMode('task')}
        >
          <Plus className="w-3.5 h-3.5" />
          Tarefa
        </Button>
        <Button
          variant={creationMode === 'event' ? 'default' : 'ghost'}
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={() => setCreationMode('event')}
        >
          <Diamond className="w-3.5 h-3.5" />
          Marco
        </Button>
        <Button
          variant={creationMode === 'text' ? 'default' : 'ghost'}
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={() => setCreationMode('text')}
        >
          <Type className="w-3.5 h-3.5" />
          Texto
        </Button>
      </div>

      {/* Right: settings */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5">
            <Settings className="w-3.5 h-3.5" />
            Configurações
            <ChevronDown className="w-3 h-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">

          {/* Project Start Date */}
          <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Projeto
          </DropdownMenuLabel>
          <div className="flex items-center justify-between px-2 py-1.5">
            <Label htmlFor="start-date" className="text-xs cursor-pointer">
              Dia de início
            </Label>
            <input
              id="start-date"
              type="date"
              className="text-xs rounded border border-input bg-background px-2 py-1 outline-none"
              value={projectStartDate instanceof Date && !isNaN(projectStartDate.getTime()) ? projectStartDate.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                if (e.target.value) {
                  // Ensure local timezone parsing by appending T00:00:00
                  setProjectStartDate(new Date(e.target.value + 'T00:00:00'));
                }
              }}
            />
          </div>

          <DropdownMenuSeparator />

          {/* Weekends toggle */}
          <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Calendário
          </DropdownMenuLabel>
          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="flex items-center gap-2">
              <CalendarOff className="w-3.5 h-3.5 text-muted-foreground" />
              <Label htmlFor="weekends-toggle" className="text-xs cursor-pointer">
                Incluir finais de semana
              </Label>
            </div>
            <Switch
              id="weekends-toggle"
              checked={showWeekends}
              onCheckedChange={setShowWeekends}
              className="scale-75"
            />
          </div>

          {/* Grid toggle */}
          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="flex items-center gap-2">
              <Grid3x3 className="w-3.5 h-3.5 text-muted-foreground" />
              <Label htmlFor="grid-toggle" className="text-xs cursor-pointer">
                Grade de dias
              </Label>
            </div>
            <Switch
              id="grid-toggle"
              checked={showGrid}
              onCheckedChange={setShowGrid}
              className="scale-75"
            />
          </div>

          <DropdownMenuSeparator />

          {/* Color mode */}
          <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Palette className="w-3 h-3" />
              Cor dos cards
            </div>
          </DropdownMenuLabel>
          {(['stage', 'responsible', 'custom'] as ColorMode[]).map((mode) => (
            <DropdownMenuItem
              key={mode}
              onClick={() => setColorMode(mode)}
              className="text-xs cursor-pointer"
            >
              <span
                className="w-2 h-2 rounded-full mr-2 shrink-0"
                style={{
                  backgroundColor: colorMode === mode ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                }}
              />
              {COLOR_MODE_LABELS[mode]}
              {colorMode === mode && (
                <span className="ml-auto text-[10px] text-primary font-semibold">✓</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
