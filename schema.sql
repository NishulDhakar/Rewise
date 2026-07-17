-- Rewise Database Schema
-- Run this in your Supabase SQL Editor if you ever need to recreate the database.

-- 1. Create Todos Table
CREATE TABLE IF NOT EXISTS public.todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anonymous_id UUID,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('learning', 'daily')),
    completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS todos_anonymous_id_idx ON public.todos(anonymous_id);

-- Enable RLS and insert default policies for anon access
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read" ON public.todos;
CREATE POLICY "Allow anon read" ON public.todos FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow anon insert" ON public.todos;
CREATE POLICY "Allow anon insert" ON public.todos FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon update" ON public.todos;
CREATE POLICY "Allow anon update" ON public.todos FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow anon delete" ON public.todos;
CREATE POLICY "Allow anon delete" ON public.todos FOR DELETE USING (true);


-- 2. Create Revisions Table
CREATE TABLE IF NOT EXISTS public.revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    todo_id UUID NOT NULL REFERENCES public.todos(id) ON DELETE CASCADE,
    revision_number INTEGER NOT NULL CHECK (revision_number BETWEEN 1 AND 5),
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS and insert default policies for anon access
ALTER TABLE public.revisions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read" ON public.revisions;
CREATE POLICY "Allow anon read" ON public.revisions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow anon insert" ON public.revisions;
CREATE POLICY "Allow anon insert" ON public.revisions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon update" ON public.revisions;
CREATE POLICY "Allow anon update" ON public.revisions FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow anon delete" ON public.revisions;
CREATE POLICY "Allow anon delete" ON public.revisions FOR DELETE USING (true);


-- 3. Create Mastered Topics Table
CREATE TABLE IF NOT EXISTS public.mastered_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    todo_id UUID NOT NULL REFERENCES public.todos(id) ON DELETE CASCADE,
    mastered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and insert default policies for anon access
ALTER TABLE public.mastered_topics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read" ON public.mastered_topics;
CREATE POLICY "Allow anon read" ON public.mastered_topics FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow anon insert" ON public.mastered_topics;
CREATE POLICY "Allow anon insert" ON public.mastered_topics FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon delete" ON public.mastered_topics;
CREATE POLICY "Allow anon delete" ON public.mastered_topics FOR DELETE USING (true);


-- 4. Create Default Todos Table
CREATE TABLE IF NOT EXISTS public.default_todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anonymous_id UUID,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS default_todos_anonymous_id_idx ON public.default_todos(anonymous_id);

-- Enable RLS and insert default policies for anon access
ALTER TABLE public.default_todos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read" ON public.default_todos;
CREATE POLICY "Allow anon read" ON public.default_todos FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow anon insert" ON public.default_todos;
CREATE POLICY "Allow anon insert" ON public.default_todos FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon update" ON public.default_todos;
CREATE POLICY "Allow anon update" ON public.default_todos FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow anon delete" ON public.default_todos;
CREATE POLICY "Allow anon delete" ON public.default_todos FOR DELETE USING (true);
