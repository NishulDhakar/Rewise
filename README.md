# REWISE — Spaced Repetition Todo & Time Tracker

Rewise is a premium, minimal, cyber-themed task manager and productivity suite built on Next.js. It merges an automated **Spaced Repetition System (SRS)** with a **Toggl-like client-side Time Tracker** and **Analytics Dashboard** to help you build long-term memory, manage daily habits, and log focus sessions offline.

---

## 🚀 Key Features

### 1. Spaced Repetition Task Manager
Automate your study intervals and watch tasks transform into permanent knowledge:
*   **Learning Topics**: Add topics you want to memorize. Checking them off triggers the Rewise interval scheduler.
*   **Automated Scheduling (R1 to R5)**: Re-appears in your **Revise Today** column at increasing intervals:
    $$\text{Start} \rightarrow \text{R1 (1d)} \rightarrow \text{R2 (3d)} \rightarrow \text{R3 (7d)} \rightarrow \text{R4 (15d)} \rightarrow \text{R5 (30d)} \rightarrow \text{Mastery}$$
*   **Archived Mastery**: Completing the 5th revision permanently archives the item in the **What You Know** list.
*   **Daily Tasks**: Automatically resets templates every calendar day.

### 2. Toggl-Style Time Tracker (`/clock`)
An offline-first, client-side stopwatch tracker stored securely in your browser's local storage:
*   **Live stopwatch ticker** calculated relative to start times, preventing lag or background tab drift.
*   **Inline Project Creator**: Create projects with custom colors and pin favorites to the top.
*   **Daily Occurrence Grouping**: Groups identical contiguous entries with a count badge. Click any group to expand/collapse individual segments.
*   **Quick Restart**: Click the "Play" icon on any past entry to restart the clock with the same description and project.
*   **Full Editor**: Modify descriptions, projects, and start/end times via a modal interface.

### 3. Time Spent Analytics (`/time-spent`)
A comprehensive visual dashboard detailing where your focus is directed:
*   **Daily, Weekly, and Monthly Filter Scopes** to view short-term or long-term trends.
*   **Visual Charts**:
    *   *Project Allocation*: Color-coded, ordered progress bars indicating total time and percentages.
    *   *Activity Timeline*: A custom SVG bar graph displaying logged hours per day with hover tooltips.
*   **Summary Cards**: Highlights total time (formatted in seconds, minutes, or hours), session counts, top projects, and top focused tasks.
*   **Log Table**: Detailed breakdown table showing unique tasks, projects, session counts, average session durations, and percentage allocations.

### 4. Cyberpunk & Chalkboard Aesthetics
*   Curated minimal dark theme (`#0a0b0d` background, glowing green, cyan, and purple accents).
*   **`font-doto` (dot-matrix digital font)** integrated for page titles, clocks, counters, and statistics.
*   Smooth micro-animations and border hover states (`glow-card`, `glow-btn`).

---

## 🛠️ Technology Stack
*   **Framework**: Next.js 16 (App Router, Turbopack)
*   **Library**: React 19
*   **Styling**: Tailwind CSS v4
*   **Database / Backend**: Supabase (for core Spaced Repetition items)
*   **Local Persistence**: `localStorage` API (for clock entries, projects, and active timer)
*   **Icons**: Lucide React
*   **Content**: MDX (for spaced repetition learning blogs)

---

## 💾 Database Setup & Schema
Rewise utilizes **Supabase** for persisting task and spaced repetition records. Execute the following SQL schema inside your Supabase SQL Editor to set up the required tables:

```sql
-- 1. Create Todos Table
CREATE TABLE IF NOT EXISTS public.todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('learning', 'daily')),
    completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Revisions Table
CREATE TABLE IF NOT EXISTS public.revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    todo_id UUID NOT NULL REFERENCES public.todos(id) ON DELETE CASCADE,
    revision_number INTEGER NOT NULL CHECK (revision_number BETWEEN 1 AND 5),
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 3. Create Mastered Topics Table
CREATE TABLE IF NOT EXISTS public.mastered_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    todo_id UUID NOT NULL REFERENCES public.todos(id) ON DELETE CASCADE,
    mastered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Default Todos Table (Daily Templates)
CREATE TABLE IF NOT EXISTS public.default_todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

---

## ⚡ Server Actions
Next.js Server Actions are used to manage server state and revalidate cached paths:
*   `addTodoAction(title, description, type)`: Creates a new learning or daily task.
*   `toggleTodoAction(id, completed, type)`: Handles checking off tasks. For learning tasks, it automatically calculates and schedules **Revision 1** in the `revisions` table. Unchecking deletes all active revisions.
*   `toggleRevisionAction(id, todoId, revisionNumber)`: Completes the current revision. Calculates and inserts the next revision with the correct spacing interval ($1 \rightarrow 3 \rightarrow 7 \rightarrow 15 \rightarrow 30$ days). If revision number 5 is completed, it writes to `mastered_topics` and clears revision logs.
*   `applyDefaultTodosAction()`: Automatically checks if default daily templates need to be spawned on client mount (occurs once per calendar day, tracked via client `localStorage`).

---

## 💻 Getting Started

### Prerequisites
Ensure you have **Node.js** (v18+) and **npm** installed.

### Setup Instructions

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/NishulDhakar/Rewise.git
    cd rewise
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Variables**:
    Create a `.env` file in the root directory and add your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run the development server**:
    ```bash
    npm run dev
    ```

5.  **Access the application**:
    Open [http://localhost:3000](http://localhost:3000) (or the active port outputted in your console) in your web browser.

---

## 📂 Project Structure
```text
├── src/
│   ├── app/                # Next.js App Router Page components
│   │   ├── blogs/          # Spaced repetition blog posts
│   │   ├── clock/          # /clock local storage time tracker
│   │   ├── time-spent/     # /time-spent analytics dashboard
│   │   ├── globals.css     # Styling imports & custom CSS classes
│   │   ├── actions.ts      # Server Actions (Mutations & Revalidations)
│   │   └── page.tsx        # Homepage (Supabase fetcher)
│   ├── components/         # Reusable React components
│   │   ├── DashboardClient.tsx # Main dashboard layout and modal states
│   │   ├── TodoColumn.tsx      # Active todo management column
│   │   ├── RevisionColumn.tsx  # Spaced repetition revision list
│   │   └── MasteredColumn.tsx  # Mastered concepts showcase
│   ├── utils/              # Client-side helpers and API clients (Supabase connection)
│   └── types/              # TypeScript interface declarations
├── schema.sql              # Supabase tables and policies SQL script
├── spec/                   # Local specification documents (Git ignored)
```

---

## 📅 Roadmap & Next Steps
We are continuously optimizing Rewise. Upcoming updates include:
*   **Clocky Feature Analysis**: Study and port advanced features from popular clock apps.
*   **Brain Architecture Modeling**: Introduce graphical visualization of memory retention patterns.
*   **Community Integration**: Setting up Telegram & Instagram feeds to post productivity tips and saving advice.
*   **More Blog Topics**: Upcoming articles on *Productivity Rules*, *Tips for Time Saving*, and *Journal logs*.
