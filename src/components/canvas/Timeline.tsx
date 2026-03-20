import { useStore } from '@/store/useStore';
import { format, addDays, isWeekend, startOfWeek, isSameDay, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DAY_WIDTH_BASE = 120;
const TIMELINE_HEIGHT = 48; // matches TopBar height

export function Timeline() {
  const projectStartDate = useStore((s) => s.projectStartDate);
  const showWeekends = useStore((s) => s.showWeekends);
  const x = useStore((s) => s.viewportX);
  const zoom = useStore((s) => s.viewportZoom);
  const nodes = useStore((s) => s.nodes);

  const maxPx = nodes.reduce((max, n) => {
    let w = 80;
    if (n.type === 'taskNode') {
      w = ((n.data?.duration as number) || 1) * DAY_WIDTH_BASE;
    } else {
      w = (n.data?.width as number) || 80;
    }
    return Math.max(max, n.position.x + w);
  }, 0);
  // O usuário pediu explicitamente: "Se qualquer node estiver a menos de 500px do fim da grade, adicione mais colunas"
  // Então, o px final necessário é o maxPx + 500.
  const maxNodeDays = Math.ceil((maxPx + 500) / DAY_WIDTH_BASE);

  const dayWidth = DAY_WIDTH_BASE * zoom;
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
  // -x is how far we panned right (viewportX is negative when panning right). 
  // We divide by dayWidth (scaled) to know how many days are hidden to the left.
  const panDays = Math.ceil((-x + screenWidth) / dayWidth);

  const TOTAL_DAYS = Math.max(120, maxNodeDays + 30, panDays + 30);

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
        <div className="flex absolute w-max" style={{ left: offsetX }}>
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
