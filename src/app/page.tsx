import { getServerSupabase } from '../utils/supabase-server';
import DashboardClient from '../components/DashboardClient';
import { Todo, Revision, MasteredTopic, DefaultTodo } from '../types';
import { getAnonymousId } from '../utils/anonymous';
import { cookies } from 'next/headers';

export const revalidate = 0; // Disable static rendering to ensure dynamic database reads on every load

export default async function HomePage() {
  const [client, anonymousId, cookieStore] = await Promise.all([
    getServerSupabase(),
    getAnonymousId(),
    cookies(),
  ]);
  
  // Only check Supabase user if session cookie is present to save on API overhead
  const hasToken = cookieStore.has('rewise_session_token');
  let userId: string | null = null;
  let userProfile = null;

  if (hasToken) {
    const { data: { user } } = await client.auth.getUser().catch(() => ({ data: { user: null } }));
    if (user) {
      userId = user.id;
      userProfile = {
        name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        email: user.email || null,
        avatarUrl: user.user_metadata?.avatar_url || null,
      };
    }
  }

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

  // Fetch mastered topics with joined todo details for this user
  const masteredQuery = client
    .from('mastered_topics')
    .select('*, todos!inner(*)');

  if (userId) {
    masteredQuery.eq('todos.user_id', userId);
  } else {
    masteredQuery.eq('todos.anonymous_id', anonymousId);
  }

  // Fetch default todos (templates) for this user
  const defaultsQuery = client
    .from('default_todos')
    .select('*');

  if (userId) {
    defaultsQuery.eq('user_id', userId);
  } else {
    defaultsQuery.eq('anonymous_id', anonymousId);
  }

  // Execute all queries in parallel to drastically improve page load speeds
  const [
    { data: todos },
    { data: revisions },
    { data: mastered },
    { data: defaults }
  ] = await Promise.all([
    todosQuery.order('created_at', { ascending: false }),
    revisionsQuery.order('due_date', { ascending: true }),
    masteredQuery.order('mastered_at', { ascending: false }),
    defaultsQuery.order('created_at', { ascending: false }),
  ]);

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
