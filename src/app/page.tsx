import { getServerSupabase } from '../utils/supabase-server';
import DashboardClient from '../components/DashboardClient';
import { Todo, Revision, MasteredTopic, DefaultTodo } from '../types';
import { getAnonymousId } from '../utils/anonymous';

export const revalidate = 0; // Disable static rendering to ensure dynamic database reads on every load

export default async function HomePage() {
  const client = await getServerSupabase();
  const anonymousId = await getAnonymousId();
  
  // Fetch user if authenticated
  const { data: { user } } = await client.auth.getUser().catch(() => ({ data: { user: null } }));
  const userId = user?.id || null;

  // Build user profile details
  const userProfile = user ? {
    name: user.user_metadata?.full_name || user.user_metadata?.name || null,
    email: user.email || null,
    avatarUrl: user.user_metadata?.avatar_url || null,
  } : null;

  // Fetch active, uncompleted todos for this user
  const todosQuery = client
    .from('todos')
    .select('*')
    .eq('completed', false);

  if (userId) {
    todosQuery.eq('user_id', userId);
  } else {
    todosQuery.eq('anonymous_id', anonymousId);
  }

  const { data: todos } = await todosQuery.order('created_at', { ascending: false });

  // Fetch pending, uncompleted revisions with joined todo details for this user
  const revisionsQuery = client
    .from('revisions')
    .select('*, todos!inner(*)')
    .eq('completed', false);

  if (userId) {
    revisionsQuery.eq('todos.user_id', userId);
  } else {
    revisionsQuery.eq('todos.anonymous_id', anonymousId);
  }

  const { data: revisions } = await revisionsQuery.order('due_date', { ascending: true });

  // Fetch mastered topics with joined todo details for this user
  const masteredQuery = client
    .from('mastered_topics')
    .select('*, todos!inner(*)');

  if (userId) {
    masteredQuery.eq('todos.user_id', userId);
  } else {
    masteredQuery.eq('todos.anonymous_id', anonymousId);
  }

  const { data: mastered } = await masteredQuery.order('mastered_at', { ascending: false });

  // Fetch default todos (templates) for this user
  const defaultsQuery = client
    .from('default_todos')
    .select('*');

  if (userId) {
    defaultsQuery.eq('user_id', userId);
  } else {
    defaultsQuery.eq('anonymous_id', anonymousId);
  }

  const { data: defaults } = await defaultsQuery.order('created_at', { ascending: false });

  return (
    <DashboardClient
      user={userProfile}
      initialTodos={(todos as Todo[]) || []}
      initialRevisions={(revisions as unknown as (Revision & { todos: Todo | null })[]) || []}
      initialMastered={(mastered as unknown as (MasteredTopic & { todos: Todo | null })[]) || []}
      initialDefaults={(defaults as DefaultTodo[]) || []}
    />
  );
}
