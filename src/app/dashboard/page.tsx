'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  created_at: string
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [newProjectName, setNewProjectName] = useState('')
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
      setProjects(data || [])
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

    const { data, error } = await supabase
      .from('projects')
      .insert([
        { 
          name: newProjectName, 
          user_id: user.id,
          content: { nodes: [], edges: [], zoom: 1 } // Initial empty state configured for the timeline editor
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

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
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

        <form onSubmit={handleCreateProject} className="mb-8 flex gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="Nome do Novo Projeto..."
            className="flex-1 rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <button
            type="submit"
            disabled={isCreating}
            className="rounded-md bg-indigo-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isCreating ? 'Criando...' : 'Criar Projeto'}
          </button>
        </form>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/editor/${project.id}`}
              className="group block rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{project.name}</h3>
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                  Editor
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Criado em: {new Date(project.created_at).toLocaleDateString('pt-BR')}
              </p>
            </Link>
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
