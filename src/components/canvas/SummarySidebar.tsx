'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { ChevronRight, ChevronLeft, LayoutDashboard, Flag, Users, Clock, Pencil, X, Check, Plus, Calendar } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DAY_WIDTH } from '@/lib/constants';

const PALETTE = [
  '#3B82F6', '#EC4899', '#10B981', '#F59E0B',
  '#8B5CF6', '#EF4444', '#06B6D4', '#F97316',
  '#6366F1', '#84CC16', '#14B8A6', '#E11D48',
];

export function SummarySidebar() {
  const [open, setOpen] = useState(false);
  const nodes = useStore((s) => s.nodes);
  const stages = useStore((s) => s.stages);
  const people = useStore((s) => s.people);
  const isReadOnly = useStore((s) => s.isReadOnly);

  const addStage = useStore((s) => s.addStage);
  const updateStage = useStore((s) => s.updateStage);
  const removeStage = useStore((s) => s.removeStage);

  const addPerson = useStore((s) => s.addPerson);
  const updatePerson = useStore((s) => s.updatePerson);
  const removePerson = useStore((s) => s.removePerson);

  // States para edição/adição de Etapas
  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [addingStage, setAddingStage] = useState(false);
  const [stageForm, setStageForm] = useState({ label: '', color: PALETTE[0] });

  // States para edição/adição de Responsáveis
  const [editingPerson, setEditingPerson] = useState<string | null>(null);
  const [addingPerson, setAddingPerson] = useState(false);
  const [personForm, setPersonForm] = useState({ name: '', color: PALETTE[0] });

  const taskNodes = nodes.filter((n) => n.type === 'taskNode');
  
  // Duração Total
  const totalDuration = taskNodes.reduce((acc, curr) => acc + (Number(curr.data.duration) || 0), 0);

  // Total Tarefas
  const entregas = taskNodes.length;

  // Calculo de Prazo Final
  const projectStartDate = useStore((s) => s.projectStartDate);
  let finalDate = projectStartDate;
  nodes.forEach((n) => {
    const dayOffset = Math.round(n.position.x / DAY_WIDTH);
    const endDays = n.type === 'taskNode' ? Number(n.data.duration) : 1;
    const endDate = addDays(projectStartDate, dayOffset + endDays);
    if (endDate > finalDate) finalDate = endDate;
  });

  // Handlers para Etapas
  const commitStage = () => {
    if (!stageForm.label.trim()) return;
    if (editingStage) {
      updateStage(editingStage, { label: stageForm.label.trim(), color: stageForm.color });
      setEditingStage(null);
    } else if (addingStage) {
      addStage({ id: `stage-${Date.now()}`, label: stageForm.label.trim(), color: stageForm.color });
      setAddingStage(false);
    }
    setStageForm({ label: '', color: PALETTE[0] });
  };

  // Handlers para Pessoas
  const commitPerson = () => {
    if (!personForm.name.trim()) return;
    if (editingPerson) {
      updatePerson(editingPerson, { name: personForm.name.trim(), color: personForm.color });
      setEditingPerson(null);
    } else if (addingPerson) {
      addPerson({ id: `per-${Date.now()}`, name: personForm.name.trim(), color: personForm.color });
      setAddingPerson(false);
    }
    setPersonForm({ name: '', color: PALETTE[0] });
  };

  const getStageCount = (label: string) => taskNodes.filter(n => n.data.stage === label).length;
  const getPersonCount = (id: string) => taskNodes.filter(n => n.data.responsibleId === id).length;
  
  const orphansCount = taskNodes.filter(n => !n.data.responsibleId).length;

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
              <span className="text-[10px] uppercase font-bold text-green-600/70 tracking-wider mt-1">Tarefas</span>
            </div>
          </div>
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex flex-col items-center justify-center text-center mb-2">
              <Calendar className="w-5 h-5 text-indigo-500 mb-1" />
              <span className="text-xl font-black text-indigo-700">{format(finalDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}</span>
              <span className="text-[10px] uppercase font-bold text-indigo-600/70 tracking-wider mt-1">Data Final do Projeto</span>
          </div>

          {/* ETAPAS */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 justify-between">
              <div className="flex items-center gap-1.5"><LayoutDashboard className="w-3.5 h-3.5"/> Etapas</div>
            </h3>
            <div className="flex flex-col gap-2">
              {stages.map((sObj) => {
                const count = getStageCount(sObj.label);
                const isEditing = editingStage === sObj.id;

                if (isEditing) {
                  return (
                    <div key={sObj.id} className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 space-y-2">
                      <input 
                        className="nodrag w-full text-xs px-2 py-1.5 rounded border border-gray-200 outline-none focus:border-blue-500"
                        value={stageForm.label}
                        onChange={(e) => setStageForm(prev => ({...prev, label: e.target.value}))}
                        onKeyDown={(e) => { if (e.key === 'Enter') commitStage(); if (e.key === 'Escape') setEditingStage(null); }}
                        autoFocus
                        placeholder="Nome da etapa"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {PALETTE.map(c => (
                          <button key={c} type="button" onClick={() => setStageForm(prev => ({...prev, color: c}))} className="w-4 h-4 rounded-full transition-transform hover:scale-110" style={{backgroundColor: c, outline: stageForm.color === c ? `2px solid ${c}` : 'none', outlineOffset: '1px'}} />
                        ))}
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button type="button" onClick={() => setEditingStage(null)} className="flex-1 text-[10px] font-bold text-gray-400 bg-white border border-gray-200 rounded py-1">Cancelar</button>
                        <button type="button" onClick={commitStage} className="flex-1 text-[10px] font-bold text-white bg-blue-500 rounded py-1">Salvar</button>
                      </div>
                    </div>
                  )
                }

                return (
                  <div key={sObj.id} className="group flex items-center justify-between bg-gray-50/80 px-3 py-2 rounded-lg border border-gray-100 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{backgroundColor: sObj.color}} />
                      <span className="text-sm font-medium text-gray-700 truncate">{sObj.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isReadOnly && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button type="button" onClick={() => { setEditingStage(sObj.id); setStageForm({label: sObj.label, color: sObj.color}); }}><Pencil className="w-3.5 h-3.5 text-gray-400 hover:text-blue-500"/></button>
                          <button type="button" onClick={() => removeStage(sObj.id)}><X className="w-3.5 h-3.5 text-gray-400 hover:text-red-500"/></button>
                        </div>
                      )}
                      <span className="text-xs font-bold bg-white px-2 py-0.5 rounded text-gray-600 border shadow-sm">{count}</span>
                    </div>
                  </div>
                )
              })}

              {!isReadOnly && !editingStage && (
                addingStage ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 space-y-2">
                    <input 
                      className="nodrag w-full text-xs px-2 py-1.5 rounded border border-gray-200 outline-none focus:border-blue-500"
                      value={stageForm.label}
                      onChange={(e) => setStageForm(prev => ({...prev, label: e.target.value}))}
                      onKeyDown={(e) => { if (e.key === 'Enter') commitStage(); if (e.key === 'Escape') setAddingStage(false); }}
                      autoFocus
                      placeholder="Nova etapa..."
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {PALETTE.map(c => (
                        <button key={c} type="button" onClick={() => setStageForm(prev => ({...prev, color: c}))} className="w-4 h-4 rounded-full transition-transform hover:scale-110" style={{backgroundColor: c, outline: stageForm.color === c ? `2px solid ${c}` : 'none', outlineOffset: '1px'}} />
                      ))}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button type="button" onClick={() => setAddingStage(false)} className="flex-1 text-[10px] font-bold text-gray-400 bg-white border border-gray-200 rounded py-1">Cancelar</button>
                      <button type="button" onClick={commitStage} className="flex-1 text-[10px] font-bold text-white bg-blue-500 rounded py-1">Adicionar</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => { setAddingStage(true); setStageForm({label: '', color: PALETTE[0]}); }} className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-dashed border-gray-200 w-full transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Adicionar Etapa
                  </button>
                )
              )}
            </div>
          </div>

          {/* RESPONSÁVEIS */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Users className="w-3.5 h-3.5"/> Responsáveis</h3>
            <div className="flex flex-col gap-2">
              {people.map((pObj) => {
                const count = getPersonCount(pObj.id);
                const isEditing = editingPerson === pObj.id;

                if (isEditing) {
                  return (
                    <div key={pObj.id} className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 space-y-2">
                      <input 
                        className="nodrag w-full text-xs px-2 py-1.5 rounded border border-gray-200 outline-none focus:border-blue-500"
                        value={personForm.name}
                        onChange={(e) => setPersonForm(prev => ({...prev, name: e.target.value}))}
                        onKeyDown={(e) => { if (e.key === 'Enter') commitPerson(); if (e.key === 'Escape') setEditingPerson(null); }}
                        autoFocus
                        placeholder="Nome da pessoa"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {PALETTE.map(c => (
                          <button key={c} type="button" onClick={() => setPersonForm(prev => ({...prev, color: c}))} className="w-4 h-4 rounded-full transition-transform hover:scale-110" style={{backgroundColor: c, outline: personForm.color === c ? `2px solid ${c}` : 'none', outlineOffset: '1px'}} />
                        ))}
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button type="button" onClick={() => setEditingPerson(null)} className="flex-1 text-[10px] font-bold text-gray-400 bg-white border border-gray-200 rounded py-1">Cancelar</button>
                        <button type="button" onClick={commitPerson} className="flex-1 text-[10px] font-bold text-white bg-blue-500 rounded py-1">Salvar</button>
                      </div>
                    </div>
                  )
                }

                return (
                  <div key={pObj.id} className="group flex items-center justify-between px-3 py-2 border border-transparent hover:border-gray-100 hover:bg-gray-50 transition-colors rounded-lg">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0 shadow-sm" style={{backgroundColor: pObj.color}}>
                        {pObj.name.substring(0, 1).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-700 truncate">{pObj.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isReadOnly && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button type="button" onClick={() => { setEditingPerson(pObj.id); setPersonForm({name: pObj.name, color: pObj.color}); }}><Pencil className="w-3.5 h-3.5 text-gray-400 hover:text-blue-500"/></button>
                          <button type="button" onClick={() => removePerson(pObj.id)}><X className="w-3.5 h-3.5 text-gray-400 hover:text-red-500"/></button>
                        </div>
                      )}
                      <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{count}</span>
                    </div>
                  </div>
                )
              })}

              {/* Sem Responsável card */}
              <div className="flex items-center justify-between px-3 py-2 border border-transparent rounded-lg">
                <span className="text-sm text-gray-400 font-medium italic">Sem responsável</span>
                <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">{orphansCount}</span>
              </div>

              {!isReadOnly && !editingPerson && (
                addingPerson ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 space-y-2 mt-1">
                    <input 
                      className="nodrag w-full text-xs px-2 py-1.5 rounded border border-gray-200 outline-none focus:border-blue-500"
                      value={personForm.name}
                      onChange={(e) => setPersonForm(prev => ({...prev, name: e.target.value}))}
                      onKeyDown={(e) => { if (e.key === 'Enter') commitPerson(); if (e.key === 'Escape') setAddingPerson(false); }}
                      autoFocus
                      placeholder="Nova pessoa..."
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {PALETTE.map(c => (
                        <button key={c} type="button" onClick={() => setPersonForm(prev => ({...prev, color: c}))} className="w-4 h-4 rounded-full transition-transform hover:scale-110" style={{backgroundColor: c, outline: personForm.color === c ? `2px solid ${c}` : 'none', outlineOffset: '1px'}} />
                      ))}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button type="button" onClick={() => setAddingPerson(false)} className="flex-1 text-[10px] font-bold text-gray-400 bg-white border border-gray-200 rounded py-1">Cancelar</button>
                      <button type="button" onClick={commitPerson} className="flex-1 text-[10px] font-bold text-white bg-blue-500 rounded py-1">Adicionar</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => { setAddingPerson(true); setPersonForm({name: '', color: PALETTE[0]}); }} className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-dashed border-gray-200 w-full transition-colors mt-1">
                    <Plus className="w-3.5 h-3.5" /> Adicionar Pessoa
                  </button>
                )
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
