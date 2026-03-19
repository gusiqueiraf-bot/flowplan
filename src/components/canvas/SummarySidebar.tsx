'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { ChevronRight, ChevronLeft, LayoutDashboard, Flag, Users, Clock } from 'lucide-react';

export function SummarySidebar() {
  const [open, setOpen] = useState(false);
  const nodes = useStore((s) => s.nodes);
  const stages = useStore((s) => s.stages);
  const people = useStore((s) => s.people);

  const taskNodes = nodes.filter((n) => n.type === 'taskNode');
  
  // Duração Total
  const totalDuration = taskNodes.reduce((acc, curr) => acc + (Number(curr.data.duration) || 0), 0);

  // Entregas Totais
  const entregas = taskNodes.filter((n) => (n.data.stage as string)?.toLowerCase() === 'entrega').length;

  // Resumo por Etapa
  const stageCounts = taskNodes.reduce((acc, curr) => {
    const s = (curr.data.stage as string) || 'Sem etapa';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Responsáveis
  const personCounts = taskNodes.reduce((acc, curr) => {
    const pid = curr.data.responsibleId as string | undefined;
    if (pid) {
      const p = people.find((x) => x.id === pid)?.name || 'Desconhecido';
      acc[p] = (acc[p] || 0) + 1;
    } else {
      acc['Sem responsável'] = (acc['Sem responsável'] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div 
      className={`absolute top-12 bottom-0 right-0 z-40 bg-white border-l border-gray-100 transition-all duration-300 shadow-2xl flex flex-col ${open ? 'w-80' : 'w-0'}`}
    >
      <button 
        onClick={() => setOpen(!open)}
        className="absolute top-4 -left-10 w-10 h-10 bg-white border border-gray-100 rounded-l-xl flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors"
      >
        {open ? <ChevronRight className="w-5 h-5 text-gray-500" /> : <LayoutDashboard className="w-5 h-5 text-gray-600" />}
      </button>

      {open && (
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6 w-80 animate-in fade-in duration-300">
          <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Resumo do Projeto</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col items-center justify-center text-center">
              <Clock className="w-5 h-5 text-blue-500 mb-1" />
              <span className="text-2xl font-black text-blue-700">{totalDuration}</span>
              <span className="text-[10px] uppercase font-bold text-blue-600/70 tracking-wider mt-1">Dias Totais</span>
            </div>
            <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex flex-col items-center justify-center text-center">
              <Flag className="w-5 h-5 text-green-500 mb-1" />
              <span className="text-2xl font-black text-green-700">{entregas}</span>
              <span className="text-[10px] uppercase font-bold text-green-600/70 tracking-wider mt-1">Entregas</span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><LayoutDashboard className="w-3.5 h-3.5"/> Por Etapas</h3>
            <div className="flex flex-col gap-2">
              {Object.entries(stageCounts).sort((a,b) => b[1] - a[1]).map(([st, count]) => {
                const sObj = stages.find(x => x.label === st);
                return (
                  <div key={st} className="flex items-center justify-between bg-gray-50/80 px-3 py-2 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{backgroundColor: sObj?.color || '#ccc'}} />
                      <span className="text-sm font-medium text-gray-700">{st}</span>
                    </div>
                    <span className="text-xs font-bold bg-white px-2 py-1 rounded text-gray-600 border shadow-sm">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Users className="w-3.5 h-3.5"/> Responsáveis</h3>
            <div className="flex flex-col gap-2">
              {Object.entries(personCounts).sort((a,b) => b[1] - a[1]).map(([person, count]) => (
                <div key={person} className="flex items-center justify-between px-3 py-2 border-b last:border-0 border-gray-50 hover:bg-gray-50 transition-colors rounded-lg">
                  <span className="text-sm text-gray-600 font-medium">{person}</span>
                  <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{count}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
