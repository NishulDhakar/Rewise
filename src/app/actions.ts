'use server';

import { supabase } from '../utils/supabase';
import { revalidatePath } from 'next/cache';

export async function addTodoAction(
  title: string,
  description: string | null,
  type: 'learning' | 'daily'
) {
  if (!title.trim()) return { error: 'Title is required' };

  const { error } = await supabase.from('todos').insert({
    title: title.trim(),
    description: description?.trim() || null,
    type,
    completed: false,
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
  if (type === 'daily') {
    // For daily tasks, simply update the completed state
    const { error } = await supabase
      .from('todos')
      .update({ completed })
      .eq('id', id);

    if (error) {
      console.error('Error toggling daily todo:', error);
      return { error: error.message };
    }
  } else {
    // For learning tasks
    if (completed) {
      // 1. Mark todo as completed
      const { error: todoError } = await supabase
        .from('todos')
        .update({ completed: true })
        .eq('id', id);

      if (todoError) {
        console.error('Error completing learning todo:', todoError);
        return { error: todoError.message };
      }

      // 2. Schedule Revision 1 (due in 1 day)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 1);

      const { error: revError } = await supabase.from('revisions').insert({
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
      const { error: todoError } = await supabase
        .from('todos')
        .update({ completed: false })
        .eq('id', id);

      if (todoError) {
        console.error('Error resetting learning todo:', todoError);
        return { error: todoError.message };
      }

      // Revisions and mastered_topics will be deleted automatically via ON DELETE CASCADE
      // if we delete or we can clean them up.
      // But wait! We unchecked the original task, so we delete its revisions and mastered records:
      await supabase.from('revisions').delete().eq('todo_id', id);
      await supabase.from('mastered_topics').delete().eq('todo_id', id);
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
  // 1. Complete the current revision
  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from('revisions')
    .update({ completed: true, completed_at: now })
    .eq('id', revisionId);

  if (updateError) {
    console.error('Error completing revision:', updateError);
    return { error: updateError.message };
  }

  // 2. Determine next step
  if (revisionNumber < 5) {
    // Schedule next revision
    // Intervals from previous completion:
    // Rev 1 -> Rev 2: 3 days
    // Rev 2 -> Rev 3: 7 days
    // Rev 3 -> Rev 4: 15 days
    // Rev 4 -> Rev 5: 30 days
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

    const { error: insertError } = await supabase.from('revisions').insert({
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
    const { error: masterError } = await supabase
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
  const { error } = await supabase.from('todos').delete().eq('id', id);

  if (error) {
    console.error('Error deleting todo:', error);
    return { error: error.message };
  }

  revalidatePath('/');
  return { success: true };
}

export async function addDefaultTodoAction(title: string, description: string | null) {
  if (!title.trim()) return { error: 'Title is required' };

  const { error } = await supabase.from('default_todos').insert({
    title: title.trim(),
    description: description?.trim() || null,
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

  const { error } = await supabase
    .from('default_todos')
    .update({
      title: title.trim(),
      description: description?.trim() || null,
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating default todo:', error);
    return { error: error.message };
  }

  revalidatePath('/');
  return { success: true };
}

export async function deleteDefaultTodoAction(id: string) {
  const { error } = await supabase.from('default_todos').delete().eq('id', id);

  if (error) {
    console.error('Error deleting default todo:', error);
    return { error: error.message };
  }

  revalidatePath('/');
  return { success: true };
}

export async function applyDefaultTodosAction() {
  // 1. Fetch all default todos
  const { data: defaults, error: fetchError } = await supabase
    .from('default_todos')
    .select('*');

  if (fetchError) {
    console.error('Error fetching default todos:', fetchError);
    return { error: fetchError.message };
  }

  if (!defaults || defaults.length === 0) {
    return { success: true, count: 0 };
  }

  // 2. Insert into todos as uncompleted daily tasks
  const insertData = defaults.map(d => ({
    title: d.title,
    description: d.description,
    type: 'daily',
    completed: false,
  }));

  const { error: insertError } = await supabase.from('todos').insert(insertData);

  if (insertError) {
    console.error('Error applying default todos:', insertError);
    return { error: insertError.message };
  }

  revalidatePath('/');
  return { success: true, count: defaults.length };
}

