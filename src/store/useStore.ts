import { create } from 'zustand';
import { temporal } from 'zundo';
import {
  Node, Edge, OnNodesChange, OnEdgesChange, Connection,
  addEdge, applyNodeChanges, applyEdgeChanges, MarkerType,
} from 'reactflow';
import type { TaskNodeData } from '@/components/canvas/TaskNode';
import type { EventNodeData } from '@/components/canvas/EventNode';
import { DAY_WIDTH } from '@/lib/constants';
import { differenceInCalendarDays } from 'date-fns';

/* ─── Stage ──────────────────────────────────────────────────────────────── */
export interface Stage {
  id: string;
  label: string;
  color: string;
}

export const DEFAULT_STAGES: Stage[] = [
  { id: 'planejamento', label: 'Planejamento', color: '#8B5CF6' },
  { id: 'design',       label: 'Design',       color: '#EC4899' },
  { id: 'dev',          label: 'Desenvolvimento', color: '#3B82F6' },
  { id: 'testes',       label: 'Testes',       color: '#10B981' },
  { id: 'revisao',      label: 'Revisão',      color: '#F59E0B' },
  { id: 'entrega',      label: 'Entrega',      color: '#EF4444' },
];

/* ─── Person ─────────────────────────────────────────────────────────────── */
export interface Person {
  id: string;
  name: string;
  color: string;
}

export const DEFAULT_PEOPLE: Person[] = [
  { id: 'per1', name: 'João Silva',   color: '#3B82F6' },
  { id: 'per2', name: 'Ana Costa',    color: '#EC4899' },
  { id: 'per3', name: 'Carlos Lima',  color: '#10B981' },
  { id: 'per4', name: 'Bia Rocha',    color: '#F59E0B' },
  { id: 'per5', name: 'Diego Motta',  color: '#8B5CF6' },
];

/* ─── Color mode ─────────────────────────────────────────────────────────── */
export type ColorMode = 'stage' | 'responsible' | 'custom';

/* ─── State type ─────────────────────────────────────────────────────────── */
interface FlowPlanState {
  creationMode: 'task' | 'event' | 'text';
  projectStartDate: Date;
  nodes: Node[];
  edges: Edge[];
  editingNodeId: string | null;
  isCreatingTask: boolean;

  stages: Stage[];
  people: Person[];
  showWeekends: boolean;
  showGrid: boolean;
  colorMode: ColorMode;
  viewportX: number;
  viewportZoom: number;

  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  setProjectStartDate: (date: Date) => void;

  addTask: (data: TaskNodeData, position?: { x: number; y: number }) => void;
  addEvent: (data: EventNodeData, position?: { x: number; y: number }) => void;
  updateNodeData: (id: string, data: Record<string, unknown>) => void;
  removeNode: (id: string) => void;
  removeEdge: (id: string) => void;
  updateEdgeData: (id: string, data: Record<string, unknown>) => void;
  addTextNode: (data: Record<string, unknown>, position?: { x: number; y: number }) => void;

  /** Updates node x-position so start date changes */
  setNodeStartDate: (nodeId: string, newDate: Date) => void;
  /** Updates duration and cascades downstream connected nodes */
  cascadeNodeDuration: (nodeId: string, oldDuration: number, newDuration: number) => void;

  setEditingNodeId: (id: string | null) => void;
  setIsCreatingTask: (v: boolean) => void;
  setCreationMode: (mode: 'task' | 'event' | 'text') => void;

  addStage: (stage: Omit<Stage, 'id'>) => void;
  updateStage: (id: string, updates: Partial<Omit<Stage, 'id'>>) => void;
  removeStage: (id: string) => void;

  addPerson: (person: Omit<Person, 'id'>) => void;
  updatePerson: (id: string, updates: Partial<Omit<Person, 'id'>>) => void;
  removePerson: (id: string) => void;

  setViewport: (x: number, zoom: number) => void;
  setShowWeekends: (show: boolean) => void;
  setShowGrid: (show: boolean) => void;
  setColorMode: (mode: ColorMode) => void;
  setState: (state: Partial<FlowPlanState>) => void;
}

let nodeCounter = 0;

export const useStore = create<FlowPlanState>()(
  temporal(
    (set, get) => ({
  creationMode: 'task',
  projectStartDate: new Date(),
  nodes: [],
  edges: [],
  editingNodeId: null,
  isCreatingTask: false,
  stages: DEFAULT_STAGES,
  people: DEFAULT_PEOPLE,
  showWeekends: true,
  showGrid: true,
  colorMode: 'stage',
  viewportX: 0,
  viewportZoom: 1,

  onNodesChange: (changes) =>
    set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) =>
    set({ edges: applyEdgeChanges(changes, get().edges) }),

  onConnect: (connection) =>
    set({
      edges: addEdge(
        {
          ...connection,
          type: 'custom',
          animated: false,
          style: { stroke: '#94a3b8', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
          data: { label: '' },
        },
        get().edges,
      ),
    }),

  setProjectStartDate: (date) => set({ projectStartDate: date }),

  addTask: (data, position) => {
    const id = `task-${++nodeCounter}`;
    const x = position?.x ?? DAY_WIDTH * (nodeCounter - 1);
    const y = position?.y ?? (140 + ((nodeCounter - 1) % 6) * 100);
    set({ nodes: [...get().nodes, { id, type: 'taskNode', position: { x, y }, data }] });
  },

  addEvent: (data, position) => {
    const id = `event-${++nodeCounter}`;
    const x = position?.x ?? DAY_WIDTH * (nodeCounter - 1);
    const y = position?.y ?? (140 + ((nodeCounter - 1) % 6) * 100);
    set({ nodes: [...get().nodes, { id, type: 'eventNode', position: { x, y }, data }] });
  },

  addTextNode: (data, position) => {
    const id = `text-${++nodeCounter}`;
    const x = position?.x ?? DAY_WIDTH * (nodeCounter - 1);
    const y = position?.y ?? (140 + ((nodeCounter - 1) % 6) * 100);
    set({ nodes: [...get().nodes, { id, type: 'textNode', position: { x, y }, data }] });
  },

  updateNodeData: (id, data) =>
    set({
      nodes: get().nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...data } } : n,
      ),
    }),

  removeNode: (id) =>
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
    }),

  removeEdge: (id) =>
    set({ edges: get().edges.filter((e) => e.id !== id) }),

  updateEdgeData: (id, data) =>
    set({
      edges: get().edges.map((e) =>
        e.id === id ? { ...e, data: { ...e.data, ...data } } : e,
      ),
    }),

  setNodeStartDate: (nodeId, newDate) => {
    const { nodes, projectStartDate } = get();
    const dayOffset = differenceInCalendarDays(newDate, projectStartDate);
    const newX = Math.max(0, dayOffset * DAY_WIDTH);
    set({
      nodes: nodes.map((n) =>
        n.id === nodeId ? { ...n, position: { ...n.position, x: newX } } : n,
      ),
    });
  },

  cascadeNodeDuration: (nodeId, oldDuration, newDuration) => {
    if (newDuration === oldDuration) return;
    const { nodes, edges } = get();
    const pxDelta = (newDuration - oldDuration) * DAY_WIDTH;

    // BFS: collect all downstream node ids
    const downstream = new Set<string>();
    const queue = [nodeId];
    const visited = new Set<string>([nodeId]);
    while (queue.length) {
      const cur = queue.shift()!;
      for (const edge of edges) {
        if (edge.source === cur && !visited.has(edge.target)) {
          visited.add(edge.target);
          downstream.add(edge.target);
          queue.push(edge.target);
        }
      }
    }

    set({
      nodes: nodes.map((n) => {
        if (n.id === nodeId) return { ...n, data: { ...n.data, duration: newDuration } };
        if (downstream.has(n.id)) return { ...n, position: { ...n.position, x: n.position.x + pxDelta } };
        return n;
      }),
    });
  },

  setEditingNodeId: (id) => set({ editingNodeId: id }),
  setIsCreatingTask: (v) => set({ isCreatingTask: v }),
  setCreationMode: (mode) => set({ creationMode: mode }),

  addStage: (stage) =>
    set({ stages: [...get().stages, { ...stage, id: `stage-${Date.now()}` }] }),
  updateStage: (id, updates) =>
    set({ stages: get().stages.map((s) => (s.id === id ? { ...s, ...updates } : s)) }),
  removeStage: (id) =>
    set({ stages: get().stages.filter((s) => s.id !== id) }),

  addPerson: (person) =>
    set({ people: [...get().people, { ...person, id: `per-${Date.now()}` }] }),
  updatePerson: (id, updates) =>
    set({ people: get().people.map((p) => (p.id === id ? { ...p, ...updates } : p)) }),
  removePerson: (id) =>
    set({ people: get().people.filter((p) => p.id !== id) }),

  setViewport: (x, zoom) => set({ viewportX: x, viewportZoom: zoom }),
  setShowWeekends: (show) => set({ showWeekends: show }),
  setShowGrid: (show) => set({ showGrid: show }),
  setColorMode: (mode) => set({ colorMode: mode }),
  setState: (state) => set(state),
}), { partialize: (state) => ({ nodes: state.nodes, edges: state.edges }) }));
