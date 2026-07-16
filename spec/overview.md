# Rewise

## Overview

**Rewise** is an advanced Todo and learning management application that combines traditional task management with **Spaced Repetition**. Instead of simply marking learning tasks as completed, Rewise automatically schedules revisions with intervals of **1, 3, 7, 15, and 30 days** between consecutive sessions to improve long-term memory retention.

The application features a clean, distraction-free interface using the **Doto** font for a modern and minimal user experience.

## Features

- ✅ Create, Read, Update, and Delete (CRUD) todos
- 🧠 Automatic spaced repetition (intervals of 1 → 3 → 7 → 15 → 30 days between revisions)
- 📅 "Revise Today" section for due revisions
- 🎓 "What You Know" section for mastered topics
- 🎨 Minimal UI with **Doto** typography
- ☁️ Data stored in **Supabase (PostgreSQL)**

## Tech Stack

- **Frontend:** React + Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Font:** Doto

## Database

The application uses **Supabase** as the backend database. All data supports full **CRUD (Create, Read, Update, Delete)** operations.

### 1. `todos`

Stores all user tasks.

| Column | Type |
|---------|------|
| id | UUID |
| title | Text |
| description | Text |
| type | learning / daily |
| completed | Boolean |
| created_at | Timestamp |

---

### 2. `revisions`

Stores the spaced repetition schedule for learning tasks.

| Column | Type |
|---------|------|
| id | UUID |
| todo_id | UUID (FK) |
| revision_number | Integer |
| due_date | Timestamp |
| completed | Boolean |
| completed_at | Timestamp |

---

### 3. `mastered_topics`

Stores tasks that have completed all five revision cycles.

| Column | Type |
|---------|------|
| id | UUID |
| todo_id | UUID (FK) |
| mastered_at | Timestamp |

## Revision Flow

```text
Create Learning Task
        │
        ▼
Complete Task
        │
        ▼
Revision 1 (1 day after completion)
        │
        ▼
Revision 2 (3 days after Revision 1 completion)
        │
        ▼
Revision 3 (7 days after Revision 2 completion)
        │
        ▼
Revision 4 (15 days after Revision 3 completion)
        │
        ▼
Revision 5 (30 days after Revision 4 completion)
        │
        ▼
Move to "What You Know"
```

## Goal

Rewise helps users **not only complete tasks but also remember what they learn**, turning daily learning into long-term knowledge through an automated spaced repetition system.