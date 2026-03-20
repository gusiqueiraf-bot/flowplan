'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'

import ReactFlow, { Background, Controls, BackgroundVariant, ReactFlowProvider, useReactFlow, SelectionMode } from 'reactflow'
import 'reactflow/dist/style.css'
import { Timeline } from '@/components/canvas/Timeline'
import { TopBar } from '@/components/canvas/TopBar'
import { TaskNode } from '@/components/canvas/TaskNode'
import { EventNode } from '@/components/canvas/EventNode'
import { TextNode } from '@/components/canvas/TextNode'
import { CustomEdge } from '@/components/canvas/CustomEdge'
import { TaskDialog } from '@/components/canvas/TaskDialog'
import { SummarySidebar } from '@/components/canvas/SummarySidebar'

const TOPBAR_HEIGHT = 48
const TIMELINE_HEIGHT = 40

function FlowPlanEditor({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // UseStore bindings identical to Index.tsx
  const nodes = useStore((s) => s.nodes)
  const edges = useStore((s) => s.edges)
  const viewportX = useStore((s) => s.viewportX)
  const viewportZoom = useStore((s) => s.viewportZoom)
  
  const onNodesChange = useStore((s) => s.onNodesChange)
  const onEdgesChange = useStore((s) => s.onEdgesChange)
  const onConnect = useStore((s) => s.onConnect)
  const showGrid = useStore((s) => s.showGrid)
  const showWeekends = useStore((s) => s.showWeekends)
  const colorMode = useStore((s) => s.colorMode)
  const projectStartDate = useStore((s) => s.projectStartDate)
  const stages = useStore((s) => s.stages)
  const people = useStore((s) => s.people)

  const setViewport = useStore((s) => s.setViewport)
  const editingNodeId = useStore((s) => s.editingNodeId)
  const setEditingNodeId = useStore((s) => s.setEditingNodeId)
  const isCreatingTask = useStore((s) => s.isCreatingTask)
  const setIsCreatingTask = useStore((s) => s.setIsCreatingTask)
  const setState = useStore((s) => s.setState)

  const creationMode = useStore((s) => s.creationMode)
  const addTask = useStore((s) => s.addTask)
  const addEvent = useStore((s) => s.addEvent)
  const addTextNode = useStore((s) => s.addTextNode)

  const { screenToFlowPosition } = useReactFlow()
  const router = useRouter()

  useEffect(() => {
    loadProject()
  }, [projectId])

  const loadProject = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', session.user.id)
      .single()

    if (error || !data) {
      console.error('Failed to load project:', error)
      setLoading(false)
      router.push('/dashboard')
      return
    }

    // Hydrate store
    if (data.content) {
      setState({
        nodes: data.content.nodes || [],
        edges: data.content.edges || [],
        viewportZoom: data.content.viewportZoom || 1,
        viewportX: data.content.viewportX || 0,
        stages: data.content.stages || useStore.getState().stages,
        people: data.content.people || useStore.getState().people,
        projectStartDate: data.content.projectStartDate ? new Date(data.content.projectStartDate) : new Date(),
        showWeekends: data.content.showWeekends ?? true,
        showGrid: data.content.showGrid ?? true,
        colorMode: data.content.colorMode ?? 'stage',
      })
    }
    setLoading(false)
  }

  // Undo/Redo hotkey logic
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing inside an input/textarea
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          useStore.getState().redo()
        } else {
          useStore.getState().undo()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Auto-save logic
  useEffect(() => {
    if (loading) return;
    
    const saveState = async () => {
      setSaving(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const { error } = await supabase
          .from('projects')
          .update({
            content: {
              nodes,
              edges,
              viewportZoom,
              viewportX,
              stages,
              people,
              projectStartDate: projectStartDate.toISOString(),
              showWeekends,
              showGrid,
              colorMode,
            }
          })
          .eq('id', projectId)
          .eq('user_id', session.user.id);
        
        if (error) {
          console.error("SUPABASE SAVE ERROR:", error);
        }
      } catch (err) {
        console.error("CATCH SAVE ERROR:", err);
      } finally {
        setTimeout(() => setSaving(false), 500)
      }
    }

    const timeoutId = setTimeout(saveState, 2000)
    return () => clearTimeout(timeoutId)
  }, [nodes, edges, viewportZoom, viewportX, projectId, loading, stages, people, projectStartDate, showWeekends, showGrid, colorMode])

  const handlePaneDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })
      
      switch (creationMode) {
        case 'task':
          addTask({ title: 'Nova Tarefa', duration: 3, color: '#3B82F6' }, position)
          break
        case 'event':
          addEvent({ title: 'Novo marco' }, position)
          break
        case 'text':
          addTextNode({ text: 'Nova anotação...', fontSize: 32, width: 300, height: 120 }, position)
          break
      }
    },
    [screenToFlowPosition, creationMode, addTask, addEvent, addTextNode]
  )

  const nodeTypes = useMemo(() => ({ taskNode: TaskNode, eventNode: EventNode, textNode: TextNode }), [])
  const edgeTypes = useMemo(() => ({ custom: CustomEdge }), [])

  const dialogOpen = isCreatingTask || !!editingNodeId
  const handleDialogClose = () => {
    setEditingNodeId(null)
    setIsCreatingTask(false)
  }

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50 font-medium text-gray-500">Carregando Editor...</div>

  return (
    <div className="w-screen h-screen relative" style={{ backgroundColor: 'hsl(var(--canvas-bg))' }}>
      <TopBar />
      <SummarySidebar />
      
      {/* Saving Indicator */}
      {saving && (
        <div className="absolute bottom-4 left-4 z-50 bg-indigo-600 shadow-md text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
          Salvando...
        </div>
      )}

      <div style={{ position: 'absolute', top: TOPBAR_HEIGHT, left: 0, right: 0, bottom: 0 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStart={() => undefined}
          onNodeDragStop={() => {
            useStore.getState().pushHistory();
            useStore.setState((s) => ({ ...s }));
          }}
          onDoubleClick={(e) => {
            if (!(e.target as Element).closest('.react-flow__node')) {
              handlePaneDoubleClick(e)
            }
          }}
          zoomOnDoubleClick={false}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          snapToGrid
          snapGrid={[120, 24]}
          minZoom={0.1}
          maxZoom={2}
          defaultViewport={{ x: viewportX, y: TIMELINE_HEIGHT, zoom: viewportZoom }}
          onMove={(_, vp) => setViewport(vp.x, vp.zoom)}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ type: 'custom' }}
          panOnDrag={true}
          selectionOnDrag={false}
          selectionKeyCode="Shift"
          panOnScroll={false}
          zoomOnScroll={true}
          selectionMode={SelectionMode.Partial}
        >
          {showGrid && (
            <Background
              variant={BackgroundVariant.Lines}
              gap={120}
              size={1}
              color="hsl(var(--canvas-grid))"
            />
          )}
          <Controls position="bottom-right" showInteractive={false} />
          <Timeline />
        </ReactFlow>
      </div>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={(open) => { if (!open) handleDialogClose() }}
        nodeId={editingNodeId}
      />
    </div>
  )
}

export default function EditorPageWrapper() {
  const params = useParams()
  // React 19 / Next 15 might surface params as a Promise, but in client components we simply unwrap or it works natively with hook `useParams()`.
  const projectId = params.id as string

  if (!projectId) return null;

  return (
    <ReactFlowProvider>
      <FlowPlanEditor projectId={projectId} />
    </ReactFlowProvider>
  )
}
