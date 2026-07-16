# Guide to Adding Future Features in Rewise

Rewise is structured to be modular and easy to extend. This guide outlines how to implement common types of new features, changes, and database updates.

---

## 1. How to Add a New Field to Todos

Suppose you want to add a `priority` level (e.g. low, medium, high) to each todo task.

### Step 1: Update the Supabase Database Schema
Run a SQL command to add the column with default constraints:
```sql
ALTER TABLE public.todos 
ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium' 
CHECK (priority IN ('low', 'medium', 'high'));
```

### Step 2: Update TypeScript Interfaces
Add the property to the `Todo` interface in [src/types/index.ts](file:///Volumes/SanDisk/Projects/rewise/src/types/index.ts):
```typescript
export interface Todo {
  id: string;
  title: string;
  description: string | null;
  type: 'learning' | 'daily';
  completed: boolean;
  priority: 'low' | 'medium' | 'high'; // <-- Add this line
  created_at: string;
}
```

### Step 3: Update Server Actions
Update `addTodoAction` in [src/app/actions.ts](file:///Volumes/SanDisk/Projects/rewise/src/app/actions.ts) to accept and insert the new field:
```typescript
export async function addTodoAction(
  title: string,
  description: string | null,
  type: 'learning' | 'daily',
  priority: 'low' | 'medium' | 'high' // <-- Pass here
) {
  const { error } = await supabase.from('todos').insert({
    title,
    description,
    type,
    priority, // <-- Insert here
    completed: false,
  });
  // ...
}
```

### Step 4: Update the Frontend Input & UI
In [src/components/DashboardClient.tsx](file:///Volumes/SanDisk/Projects/rewise/src/components/DashboardClient.tsx):
1.  Add React state to hold the priority input: `const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');`.
2.  Add priority radio buttons or a select dropdown inside the `<form>`.
3.  Pass the `priority` state value when calling `addTodoAction`.
4.  Render a priority indicator badge next to the task titles.

---

## 2. How to Add a New Spaced Repetition Revision Stage

Currently, Rewise has 5 revision cycles (1, 3, 7, 15, 30 days). Suppose you want to add a **6th revision stage at 60 days** (`6th revise`).

### Step 1: Update Database Constraint
The database table `revisions` has a check constraint limiting `revision_number` to `BETWEEN 1 AND 5`. Run a SQL migration to update it:
```sql
ALTER TABLE public.revisions DROP CONSTRAINT IF EXISTS revisions_revision_number_check;
ALTER TABLE public.revisions ADD CONSTRAINT revisions_revision_number_check CHECK (revision_number BETWEEN 1 AND 6);
```

### Step 2: Update Server Action Interval Map
In [src/app/actions.ts](file:///Volumes/SanDisk/Projects/rewise/src/app/actions.ts), update the `toggleRevisionAction` logic to handle the new stage:
```typescript
// 1. Change the final step condition from 5 to 6:
if (revisionNumber < 6) { // <-- Change from 5 to 6
  // 2. Add the 60-day interval spacing offset:
  const daysToAdd =
    revisionNumber === 1 ? 3 : // Gap from 1st to 2nd revise
    revisionNumber === 2 ? 7 : // Gap from 2nd to 3rd revise
    revisionNumber === 3 ? 15 : // Gap from 3rd to 4th revise
    revisionNumber === 4 ? 30 : // Gap from 4th to 5th revise
    60; // revisionNumber === 5 -> Gap from 5th to 6th revise (+60 days)

  // ... rest of scheduling code ...
} else {
  // Revision 6 completed! Add to mastered_topics
  // ...
}
```

### Step 3: Update UI Grouping & Headers
In [src/components/DashboardClient.tsx](file:///Volumes/SanDisk/Projects/rewise/src/components/DashboardClient.tsx):
1.  Extend `revisionsByStage` initial state:
    ```typescript
    const revisionsByStage: Record<number, typeof initialRevisions> = {
      1: [], 2: [], 3: [], 4: [], 5: [], 6: [] // <-- Add 6
    };
    ```
2.  Extend the `getOrdinalName` switch block:
    ```typescript
    case 6: return '6th';
    ```

---

## 3. How to Create a New Task Type (e.g., 'weekly' or 'monthly')

Suppose you want to add a `weekly` task type that behaves like a daily task but only resets/remains active on a weekly schedule.

### Step 1: Update Database Checks
Run a SQL migration to update check constraint on the `type` column:
```sql
ALTER TABLE public.todos DROP CONSTRAINT IF EXISTS todos_type_check;
ALTER TABLE public.todos ADD CONSTRAINT todos_type_check CHECK (type IN ('learning', 'daily', 'weekly'));
```

### Step 2: Update Interfaces & Server Actions
1.  Update `type: 'learning' | 'daily' | 'weekly'` in [src/types/index.ts](file:///Volumes/SanDisk/Projects/rewise/src/types/index.ts).
2.  Update the parameter type inside `addTodoAction` and `toggleTodoAction` in [src/app/actions.ts](file:///Volumes/SanDisk/Projects/rewise/src/app/actions.ts).

### Step 3: Render in Frontend
In [src/components/DashboardClient.tsx](file:///Volumes/SanDisk/Projects/rewise/src/components/DashboardClient.tsx):
1.  Filter out the weekly tasks: `const weeklyTodos = todos.filter(t => t.type === 'weekly');`.
2.  Add a radio button option for 'weekly' in the Create form.
3.  Add a new section in the first column rendering `weeklyTodos` list (similar to the Daily Tasks section).
