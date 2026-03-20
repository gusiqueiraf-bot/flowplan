'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Trash2, Copy, FileText, Layers } from 'lucide-react'

interface Project {
  id: string
  name: string
  created_at: string
  is_template?: boolean
  content?: any
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [templates, setTemplates] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [newProjectName, setNewProjectName] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkUserAndFetchProjects()
  }, [])

  const checkUserAndFetchProjects = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching projects:', error)
    } else {
      setProjects((data || []).filter(p => !p.is_template))
      setTemplates((data || []).filter(p => p.is_template))
    }
    setLoading(false)
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectName.trim()) return

    setIsCreating(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    let templateContent = { nodes: [], edges: [], zoom: 1 } // Default empty state
    if (selectedTemplate) {
      const templateRecord = templates.find(t => t.id === selectedTemplate)
      if (templateRecord && templateRecord.content) {
        templateContent = templateRecord.content
      }
    }

    const { data, error } = await supabase
      .from('projects')
      .insert([
        { 
          name: newProjectName, 
          user_id: user.id,
          content: templateContent,
          is_template: false
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating project:', error)
      alert('Erro ao criar projeto.')
    } else if (data) {
      router.push(`/editor/${data.id}`)
    }
    setIsCreating(false)
  }

  const handleDuplicateProject = async (e: React.MouseEvent, projectToClone: Project) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsCreating(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const baseName = projectToClone.name.replace(/^\[Template\]\s*/, '')
    const copyName = `Cópia de ${baseName}`

    const { data, error } = await supabase
      .from('projects')
      .insert([
        { 
          name: copyName, 
          user_id: user.id,
          content: projectToClone.content || { nodes: [], edges: [], zoom: 1 },
          is_template: false
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error duplicating:', error)
      alert('Erro ao duplicar o projeto.')
    } else if (data) {
      setProjects([data, ...projects])
    }
    setIsCreating(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (window.confirm('Deseja excluir este projeto?')) {
      const { error } = await supabase.from('projects').delete().eq('id', id)
      if (error) {
        console.error('Error deleting project:', error)
        alert('Erro ao excluir projeto.')
      } else {
        setProjects(projects.filter((p) => p.id !== id))
        setTemplates(templates.filter((t) => t.id !== id))
      }
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-xl font-medium text-gray-600">Carregando Projetos...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Painel de Projetos</h1>
            <p className="mt-1 text-sm text-gray-500">Gerencie seus projetos da Spectrum Acustica</p>
          </div>
          <button
            onClick={handleSignOut}
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50 border border-gray-200"
          >
            Sair da Conta
          </button>
        </div>

        <form onSubmit={handleCreateProject} className="mb-10 flex flex-col sm:flex-row gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100 items-end sm:items-center">
          <div className="flex-1 w-full space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase">Nome do Projeto</label>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Digite o nome..."
              className="w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          {templates.length > 0 && (
            <div className="w-full sm:w-64 flex-shrink-0 space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Template</label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Projeto Vazio</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
          <button
            type="submit"
            disabled={isCreating}
            className="w-full sm:w-auto mt-2 sm:mt-0 rounded-md bg-indigo-600 px-6 py-2 h-[42px] text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isCreating ? 'Criando...' : 'Criar Projeto'}
          </button>
        </form>

        {/* --- TEMPLATES SECTION --- */}
        {templates.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2"><Layers className="w-5 h-5 text-indigo-500"/> Meus Templates</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((project) => (
                <div key={project.id} className="group block rounded-xl border-2 border-indigo-100 bg-indigo-50/30 p-6 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all relative">
                  <div className="flex justify-between items-start mb-4">
                    <Link href={`/editor/${project.id}`} className="text-xl font-semibold text-indigo-900 group-hover:text-indigo-600 transition-colors cursor-pointer mr-2 break-words">
                      {project.name}
                    </Link>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => handleDuplicateProject(e, project)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-md transition-colors"
                        title="Criar projeto a partir deste template"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteProject(e, project.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        title="Excluir Template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    Criado em: {new Date(project.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- NORMAL PROJECTS SECTION --- */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-gray-400"/> Meus Projetos</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group block rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all relative"
            >
              <div className="flex justify-between items-start mb-4">
                <Link href={`/editor/${project.id}`} className="text-xl font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors cursor-pointer mr-2 break-words">
                  {project.name}
                </Link>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 hidden sm:inline-flex">
                    Editor
                  </span>
                  <button
                    onClick={(e) => handleDuplicateProject(e, project)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                    title="Duplicar Projeto"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteProject(e, project.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    title="Excluir Projeto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Criado em: {new Date(project.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="col-span-full rounded-xl border-2 border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
              Nenhum projeto encontrado. Crie o seu primeiro projeto acima!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
