'use server';

import { getServerSupabase } from '../utils/supabase-server';
import { revalidatePath } from 'next/cache';
import { getAnonymousId } from '../utils/anonymous';
import { cookies } from 'next/headers';

export async function getUserOrAnonymous() {
  const client = await getServerSupabase();
  const anonymousId = await getAnonymousId();
  
  const { data: { user } } = await client.auth.getUser().catch(() => ({ data: { user: null } }));

  return {
    userId: user?.id || null,
    anonymousId,
    isAuth: !!user,
    client,
  };
}

export async function setSessionCookieAction(token: string) {
  const cookieStore = await cookies();
  cookieStore.set({
    name: 'rewise_session_token',
    value: token,
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });

  // Sync profile details to the public.profiles table
  try {
    const client = await getServerSupabase();
    const { data: { user } } = await client.auth.getUser().catch(() => ({ data: { user: null } }));
    
    if (user) {
      const profileData = {
        id: user.id,
        email: user.email || null,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
        updated_at: new Date().toISOString(),
      };

      await client
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' });
    }
  } catch (err) {
    console.error('Error syncing profile in setSessionCookieAction:', err);
  }

  revalidatePath('/');
}

export async function clearSessionCookieAction() {
  const cookieStore = await cookies();
  cookieStore.delete('rewise_session_token');
  revalidatePath('/');
}

export async function migrateAnonymousTodosAction() {
  const { userId, anonymousId, client } = await getUserOrAnonymous();

  if (userId && anonymousId) {
    // Migrate todos
    const { error: todoError } = await client
      .from('todos')
      .update({ user_id: userId })
      .eq('anonymous_id', anonymousId)
      .is('user_id', null);

    if (todoError) {
      console.error('Error migrating todos:', todoError);
    }

    // Migrate default_todos
    const { error: defaultError } = await client
      .from('default_todos')
      .update({ user_id: userId })
      .eq('anonymous_id', anonymousId)
      .is('user_id', null);

    if (defaultError) {
      console.error('Error migrating default todos:', defaultError);
    }
  }

  revalidatePath('/');
}

export async function addTodoAction(
  title: string,
  description: string | null,
  type: 'learning' | 'daily'
) {
  if (!title.trim()) return { error: 'Title is required' };

  const { userId, anonymousId, client } = await getUserOrAnonymous();
  const { error } = await client.from('todos').insert({
    title: title.trim(),
    description: description?.trim() || null,
    type,
    completed: false,
    user_id: userId,
    anonymous_id: userId ? null : anonymousId,
  });

  if (error) {
    console.error('Error adding todo:', error);
    return { error: error.message };
  }

  revalidatePath('/');
  return { success: true };
}

export async function toggleTodoAction(
  id: string,
  completed: boolean,
  type: 'learning' | 'daily'
) {
  const { userId, anonymousId, client } = await getUserOrAnonymous();

  // Verify ownership first
  const query = client
    .from('todos')
    .select('id')
    .eq('id', id);

  if (userId) {
    query.eq('user_id', userId);
  } else {
    query.eq('anonymous_id', anonymousId);
  }

  const { data: todo, error: ownerError } = await query.single();

  if (ownerError || !todo) {
    console.error('Error verifying todo ownership:', ownerError);
    return { error: 'Unauthorized or todo not found' };
  }

  if (type === 'daily') {
    // For daily tasks, simply update the completed state
    const updateQuery = client
      .from('todos')
      .update({ completed })
      .eq('id', id);

    if (userId) {
      updateQuery.eq('user_id', userId);
    } else {
      updateQuery.eq('anonymous_id', anonymousId);
    }

    const { error } = await updateQuery;

    if (error) {
      console.error('Error toggling daily todo:', error);
      return { error: error.message };
    }
  } else {
    // For learning tasks
    if (completed) {
      // 1. Mark todo as completed
      const updateQuery = client
        .from('todos')
        .update({ completed: true })
        .eq('id', id);

      if (userId) {
        updateQuery.eq('user_id', userId);
      } else {
        updateQuery.eq('anonymous_id', anonymousId);
      }

      const { error: todoError } = await updateQuery;

      if (todoError) {
        console.error('Error completing learning todo:', todoError);
        return { error: todoError.message };
      }

      // 2. Schedule Revision 1 (due in 1 day)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 1);

      const { error: revError } = await client.from('revisions').insert({
        todo_id: id,
        revision_number: 1,
        due_date: dueDate.toISOString(),
        completed: false,
      });

      if (revError) {
        console.error('Error scheduling revision 1:', revError);
        return { error: revError.message };
      }
    } else {
      // Unchecking learning todo: Reset it back (delete revisions & mastered status)
      const updateQuery = client
        .from('todos')
        .update({ completed: false })
        .eq('id', id);

      if (userId) {
        updateQuery.eq('user_id', userId);
      } else {
        updateQuery.eq('anonymous_id', anonymousId);
      }

      const { error: todoError } = await updateQuery;

      if (todoError) {
        console.error('Error resetting learning todo:', todoError);
        return { error: todoError.message };
      }

      // Revisions and mastered_topics will be deleted automatically via ON DELETE CASCADE
      await client.from('revisions').delete().eq('todo_id', id);
      await client.from('mastered_topics').delete().eq('todo_id', id);
    }
  }

  revalidatePath('/');
  return { success: true };
}

export async function toggleRevisionAction(
  revisionId: string,
  todoId: string,
  revisionNumber: number
) {
  const { userId, anonymousId, client } = await getUserOrAnonymous();

  // Verify todo ownership first
  const query = client
    .from('todos')
    .select('id')
    .eq('id', todoId);

  if (userId) {
    query.eq('user_id', userId);
  } else {
    query.eq('anonymous_id', anonymousId);
  }

  const { data: todo, error: ownerError } = await query.single();

  if (ownerError || !todo) {
    console.error('Error verifying todo ownership for revision:', ownerError);
    return { error: 'Unauthorized or todo not found' };
  }

  // 1. Complete the current revision
  const now = new Date().toISOString();
  const { error: updateError } = await client
    .from('revisions')
    .update({ completed: true, completed_at: now })
    .eq('id', revisionId);

  if (updateError) {
    console.error('Error completing revision:', updateError);
    return { error: updateError.message };
  }

  // 2. Determine next step
  if (revisionNumber < 5) {
    const daysToAdd =
      revisionNumber === 1
        ? 3
        : revisionNumber === 2
        ? 7
        : revisionNumber === 3
        ? 15
        : 30; // revisionNumber === 4

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysToAdd);

    const { error: insertError } = await client.from('revisions').insert({
      todo_id: todoId,
      revision_number: revisionNumber + 1,
      due_date: dueDate.toISOString(),
      completed: false,
    });

    if (insertError) {
      console.error('Error scheduling next revision:', insertError);
      return { error: insertError.message };
    }
  } else {
    // Revision 5 completed! Add to mastered_topics
    const { error: masterError } = await client
      .from('mastered_topics')
      .insert({
        todo_id: todoId,
        mastered_at: now,
      });

    if (masterError) {
      console.error('Error mastering topic:', masterError);
      return { error: masterError.message };
    }
  }

  revalidatePath('/');
  return { success: true };
}

export async function deleteTodoAction(id: string) {
  const { userId, anonymousId, client } = await getUserOrAnonymous();
  const query = client
    .from('todos')
    .delete()
    .eq('id', id);

  if (userId) {
    query.eq('user_id', userId);
  } else {
    query.eq('anonymous_id', anonymousId);
  }

  const { error } = await query;

  if (error) {
    console.error('Error deleting todo:', error);
    return { error: error.message };
  }

  revalidatePath('/');
  return { success: true };
}

export async function addDefaultTodoAction(title: string, description: string | null) {
  if (!title.trim()) return { error: 'Title is required' };

  const { userId, anonymousId, client } = await getUserOrAnonymous();
  const { error } = await client.from('default_todos').insert({
    title: title.trim(),
    description: description?.trim() || null,
    user_id: userId,
    anonymous_id: userId ? null : anonymousId,
  });

  if (error) {
    console.error('Error adding default todo:', error);
    return { error: error.message };
  }

  revalidatePath('/');
  return { success: true };
}

export async function updateDefaultTodoAction(id: string, title: string, description: string | null) {
  if (!title.trim()) return { error: 'Title is required' };

  const { userId, anonymousId, client } = await getUserOrAnonymous();
  const query = client
    .from('default_todos')
    .update({
      title: title.trim(),
      description: description?.trim() || null,
    })
    .eq('id', id);

  if (userId) {
    query.eq('user_id', userId);
  } else {
    query.eq('anonymous_id', anonymousId);
  }

  const { error } = await query;

  if (error) {
    console.error('Error updating default todo:', error);
    return { error: error.message };
  }

  revalidatePath('/');
  return { success: true };
}

export async function deleteDefaultTodoAction(id: string) {
  const { userId, anonymousId, client } = await getUserOrAnonymous();
  const query = client
    .from('default_todos')
    .delete()
    .eq('id', id);

  if (userId) {
    query.eq('user_id', userId);
  } else {
    query.eq('anonymous_id', anonymousId);
  }

  const { error } = await query;

  if (error) {
    console.error('Error deleting default todo:', error);
    return { error: error.message };
  }

  revalidatePath('/');
  return { success: true };
}

export async function applyDefaultTodosAction() {
  const { userId, anonymousId, client } = await getUserOrAnonymous();

  // 1. Fetch all default todos for this user
  const query = client
    .from('default_todos')
    .select('*');

  if (userId) {
    query.eq('user_id', userId);
  } else {
    query.eq('anonymous_id', anonymousId);
  }

  const { data: defaults, error: fetchError } = await query;

  if (fetchError) {
    console.error('Error fetching default todos:', fetchError);
    return { error: fetchError.message };
  }

  if (!defaults || defaults.length === 0) {
    return { success: true, count: 0 };
  }

  // 2. Insert into todos as uncompleted daily tasks for this user
  const insertData = defaults.map(d => ({
    title: d.title,
    description: d.description,
    type: 'daily',
    completed: false,
    user_id: userId,
    anonymous_id: userId ? null : anonymousId,
  }));

  const { error: insertError } = await client.from('todos').insert(insertData);

  if (insertError) {
    console.error('Error applying default todos:', insertError);
    return { error: insertError.message };
  }

  revalidatePath('/');
  return { success: true, count: defaults.length };
}
