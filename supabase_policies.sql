-- Execute isso no Supabase SQL Editor para ativar as políticas de segurança (RLS)
-- Tabela: projects

-- 1. Ativar RLS na Tabela
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 2. Permitir que o usuário leia apenas seus próprios projetos
CREATE POLICY "Users can view their own projects"
ON projects FOR SELECT
USING (auth.uid() = user_id);

-- 3. Permitir que o usuário crie projetos vinculados ao seu ID
CREATE POLICY "Users can create their own projects"
ON projects FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 4. Permitir que o usuário edite apenas seus próprios projetos
CREATE POLICY "Users can update their own projects"
ON projects FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Permitir que o usuário delete apenas seus projetos
CREATE POLICY "Users can delete their own projects"
ON projects FOR DELETE
USING (auth.uid() = user_id);
