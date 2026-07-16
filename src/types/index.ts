export interface Todo {
  id: string;
  title: string;
  description: string | null;
  type: 'learning' | 'daily';
  completed: boolean;
  created_at: string;
}

export interface Revision {
  id: string;
  todo_id: string;
  revision_number: number;
  due_date: string;
  completed: boolean;
  completed_at: string | null;
  todos?: Todo; // Matches Supabase's auto-pluralization join
}

export interface MasteredTopic {
  id: string;
  todo_id: string;
  mastered_at: string;
  todos?: Todo; // Matches Supabase's auto-pluralization join
}

export interface DefaultTodo {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
}

