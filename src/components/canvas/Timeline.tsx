import { useStore } from '@/store/useStore';
import { format, addDays, isWeekend, startOfWeek, isSameDay, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DAY_WIDTH_BASE = 120;
const TOTAL_DAYS = 120;
const TIMELINE_HEIGHT = 48; // matches TopBar height

export function Timeline() {
  const projectStartDate = useStore((s) => s.projectStartDate);
  const showWeekends = useStore((s) => s.showWeekends);
  const x = useStore((s) => s.viewportX);
  const zoom = useStore((s) => s.viewportZoom);

  const dayWidth = DAY_WIDTH_BASE * zoom;
  const offsetX = x;

  const renderMode = zoom < 0.15 ? 'month' : zoom < 0.4 ? 'week' : 'day';

  return (
    <div
      className="absolute left-0 right-0 z-10 pointer-events-none"
      style={{ top: TIMELINE_HEIGHT }}
    >
      <div
        className="h-10 border-b flex flex-col justify-center overflow-hidden"
        style={{
          backgroundColor: 'hsl(var(--timeline-bg) / 0.92)',
          borderColor: 'hsl(var(--border))',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="flex absolute" style={{ left: offsetX }}>
          {Array.from({ length: TOTAL_DAYS }, (_, i) => {
            const date = addDays(projectStartDate, i);
            const weekend = isWeekend(date);

            let showTick = false;
            let label = '';
            let subLabel = '';

            if (renderMode === 'day') {
              showTick = true;
              label = format(date, 'dd MMM', { locale: ptBR });
              subLabel = weekend && !showWeekends ? '—' : `D+${i}`;
            } else if (renderMode === 'week') {
              showTick = isSameDay(date, startOfWeek(date, { weekStartsOn: 1 })) || i === 0;
              label = `Sem. ${format(date, 'dd MMM', { locale: ptBR })}`;
            } else if (renderMode === 'month') {
              showTick = isSameDay(date, startOfMonth(date)) || i === 0;
              label = format(date, 'MMM yyyy', { locale: ptBR });
            }

            return (
              <div
                key={i}
                className={`relative shrink-0 flex flex-col items-center justify-center ${showTick ? 'border-r' : ''}`}
                style={{
                  width: dayWidth,
                  borderColor: showTick ? 'hsl(var(--canvas-grid))' : 'transparent',
                  backgroundColor: !showWeekends && weekend && renderMode === 'day'
                    ? 'hsl(var(--muted) / 0.6)'
                    : 'transparent',
                  opacity: !showWeekends && weekend && renderMode === 'day' ? 0.5 : 1,
                }}
              >
                {showTick && (
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 whitespace-nowrap z-10">
                    <span
                      className="text-[10px] font-semibold leading-tight block"
                      style={{
                        color: weekend && !showWeekends && renderMode === 'day'
                          ? 'hsl(var(--muted-foreground))'
                          : 'hsl(var(--timeline-text-strong))',
                      }}
                    >
                      {label}
                    </span>
                    {subLabel && (
                      <span
                        className="text-[9px] leading-tight font-mono block mt-0.5"
                        style={{ color: 'hsl(var(--timeline-text))' }}
                      >
                        {subLabel}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
