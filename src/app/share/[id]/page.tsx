'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'

import ReactFlow, { Background, Controls, BackgroundVariant, ReactFlowProvider } from 'reactflow'
import 'reactflow/dist/style.css'
import { Timeline } from '@/components/canvas/Timeline'
import { TaskNode } from '@/components/canvas/TaskNode'
import { EventNode } from '@/components/canvas/EventNode'
import { CustomEdge } from '@/components/canvas/CustomEdge'
import { TextNode } from '@/components/canvas/TextNode'

function ShareViewer({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  
  const nodes = useStore((s) => s.nodes)
  const edges = useStore((s) => s.edges)
  const viewportX = useStore((s) => s.viewportX)
  const viewportZoom = useStore((s) => s.viewportZoom)
  const setViewport = useStore((s) => s.setViewport)
  const setState = useStore((s) => s.setState)
  const setIsReadOnly = useStore((s) => s.setIsReadOnly)

  useEffect(() => {
    setIsReadOnly(true)
    loadProject()
  }, [projectId])

  const loadProject = async () => {
    // Carregue os dados do projeto via Supabase (mesmo sem usuário logado).
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (error || !data) {
      console.error('Failed to load project:', error)
      router.push('/dashboard')
      return
    }

    if (data.content) {
      setState({
        nodes: data.content.nodes || [],
        edges: data.content.edges || [],
        viewportZoom: data.content.viewportZoom || 1,
        viewportX: data.content.viewportX || 0,
      })
    }
    setLoading(false)
  }

  const nodeTypes = useMemo(() => ({ taskNode: TaskNode, eventNode: EventNode, textNode: TextNode }), [])
  const edgeTypes = useMemo(() => ({ custom: CustomEdge }), [])

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50 font-medium text-gray-500">Carregando Visualização...</div>

  return (
    <div className="w-screen h-screen relative" style={{ backgroundColor: 'hsl(var(--canvas-bg))' }}>
      {/* Readonly TopBar */}
      <div
        className="absolute top-0 left-0 right-0 z-30 flex items-center px-4 gap-4"
        style={{
          height: 48,
          backgroundColor: 'hsl(var(--card))',
          borderBottom: '1px solid hsl(var(--border))',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-tight text-foreground">FlowPlan</span>
        </div>
        <div className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full text-[10px] tracking-wide uppercase shadow-sm border border-blue-200">
          Modo Visualização
        </div>
      </div>

      <div style={{ position: 'absolute', top: 48, left: 0, right: 0, bottom: 0 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={true}
          zoomOnScroll={true}
          zoomOnDoubleClick={false}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          minZoom={0.1}
          maxZoom={2}
          defaultViewport={{ x: viewportX, y: 40, zoom: viewportZoom }}
          onMove={(_, vp) => setViewport(vp.x, vp.zoom)}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ type: 'custom' }}
        >
          <Background variant={BackgroundVariant.Lines} gap={120} size={1} color="hsl(var(--canvas-grid))" />
          <Controls position="bottom-right" showInteractive={false} />
          <Timeline />
        </ReactFlow>
      </div>
    </div>
  )
}

export default function SharePage() {
  const params = useParams()
  const projectId = params.id as string
  if (!projectId) return null;
  return (
    <ReactFlowProvider>
      <ShareViewer projectId={projectId} />
    </ReactFlowProvider>
  )
}
