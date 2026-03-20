-- Enable Row Level Security functionality
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Attempt to enable RLS on nodes and edges if they exist. 
-- (Note: Currently the application saves nodes and edges as JSON within 'projects.content', 
-- so these two tables might not exist in your database. If they don't, these commands will just return a notice/error which is fine.)
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'nodes') THEN
        ALTER TABLE public.nodes ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'edges') THEN
        ALTER TABLE public.edges ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-------------------------------------------------------------------------
-- POLICIES FOR 'projects' TABLE
-------------------------------------------------------------------------
-- Remove any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can insert their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
DROP POLICY IF EXISTS "Public can view shared projects" ON public.projects;

-- 1. Insert Policy (user_id must match authenticated user)
CREATE POLICY "Users can insert their own projects" 
ON public.projects FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 2. Select Policy (user can view their own, PLUS anyone can view a project if they know the ID for /share route)
-- Since the prompt requested data isolation but also mentioned "/share should be read-only", 
-- if /share is meant to be public to anyone with the UUID link, we define an OR condition.
-- If the project MUST be restricted to members only, change this to only auth.uid() = user_id.
-- Given UUIDs are unguessable, this allows public sharing if the UUID is shared.
CREATE POLICY "Users can view their own projects or shared projects" 
ON public.projects FOR SELECT
USING ( auth.uid() = user_id OR true );
-- NOTE CAUTION: "OR true" on SELECT allows ANYONE to SELECT * FROM projects! 
-- Supabase REST API protects against this IF we use RLS properly. 
-- For strict security (preventing scraping all IDs):
DROP POLICY IF EXISTS "Users can view their own projects or shared projects" ON public.projects;
CREATE POLICY "Users can view their own projects" 
ON public.projects FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Public can view projects by ID"
ON public.projects FOR SELECT
USING (true);
-- To avoid data scraping, it's better to NOT USE `true` and instead use a secure approach.
-- If you want absolute isolation as requested:
DROP POLICY IF EXISTS "Public can view projects by ID" ON public.projects;

-- STRICT SELECT POLICY: Only the owner can view.
-- (This will break the public /share route if the user is not logged in. If you want /share to work publicly, 
-- you need an 'is_public' bool on the project, and then use: `auth.uid() = user_id OR is_public = true`)
CREATE POLICY "Users can view their own projects" 
ON public.projects FOR SELECT 
USING (auth.uid() = user_id);

-- 3. Update Policy (user can only update their own)
CREATE POLICY "Users can update their own projects" 
ON public.projects FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 4. Delete Policy (user can only delete their own)
CREATE POLICY "Users can delete their own projects" 
ON public.projects FOR DELETE 
USING (auth.uid() = user_id);


-------------------------------------------------------------------------
-- POLICIES FOR 'nodes' AND 'edges' TABLES (If they exist)
-------------------------------------------------------------------------
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'nodes') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Users can access their own nodes" ON public.nodes;';
        -- Assumes nodes table has a user_id or project_id that joins securely
        EXECUTE 'CREATE POLICY "Users can access their own nodes" ON public.nodes USING (auth.uid() = user_id);';
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'edges') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Users can access their own edges" ON public.edges;';
        -- Assumes edges table has a user_id or project_id that joins securely
        EXECUTE 'CREATE POLICY "Users can access their own edges" ON public.edges USING (auth.uid() = user_id);';
    END IF;
END $$;
