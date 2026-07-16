import { supabase } from '../utils/supabase';
import DashboardClient from '../components/DashboardClient';
import { Todo, Revision, MasteredTopic, DefaultTodo } from '../types';

export const revalidate = 0; // Disable static rendering to ensure dynamic database reads on every load

export default async function HomePage() {
  // Fetch active, uncompleted todos
  const { data: todos } = await supabase
    .from('todos')
    .select('*')
    .eq('completed', false)
    .order('created_at', { ascending: false });

  // Fetch pending, uncompleted revisions with joined todo details
  const { data: revisions } = await supabase
    .from('revisions')
    .select('*, todos (*)')
    .eq('completed', false)
    .order('due_date', { ascending: true });

  // Fetch mastered topics with joined todo details
  const { data: mastered } = await supabase
    .from('mastered_topics')
    .select('*, todos (*)')
    .order('mastered_at', { ascending: false });

  // Fetch default todos (templates)
  const { data: defaults } = await supabase
    .from('default_todos')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <DashboardClient
      initialTodos={(todos as Todo[]) || []}
      initialRevisions={(revisions as unknown as (Revision & { todos: Todo | null })[]) || []}
      initialMastered={(mastered as unknown as (MasteredTopic & { todos: Todo | null })[]) || []}
      initialDefaults={(defaults as DefaultTodo[]) || []}
    />
  );
}

