'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { Sparkles, Loader2, BookOpen, Clock, Activity } from 'lucide-react';
import Link from 'next/link';
import { Todo, Revision, MasteredTopic, DefaultTodo } from '../types';
import {
  addTodoAction,
  toggleTodoAction,
  toggleRevisionAction,
  deleteTodoAction,
  addDefaultTodoAction,
  deleteDefaultTodoAction,
  applyDefaultTodosAction
} from '../app/actions';
import TodoColumn from './TodoColumn';
import RevisionColumn from './RevisionColumn';
import MasteredColumn from './MasteredColumn';

interface DashboardClientProps {
  initialTodos: Todo[];
  initialRevisions: (Revision & { todos: Todo | null })[];
  initialMastered: (MasteredTopic & { todos: Todo | null })[];
  initialDefaults: DefaultTodo[];
}

export default function DashboardClient({
  initialTodos,
  initialRevisions,
  initialMastered,
  initialDefaults,
}: DashboardClientProps) {
  // Client state synced with props
  const todos = initialTodos;
  const revisions = initialRevisions;
  const mastered = initialMastered;
  const defaults = initialDefaults;

  // UI state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDefaultsOpen, setIsDefaultsOpen] = useState(false);
  const [isSRPOpen, setIsSRPOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [reviseTodayCollapsed, setReviseTodayCollapsed] = useState(false);
  const [whatYouKnowCollapsed, setWhatYouKnowCollapsed] = useState(false);

  // New Default Task inputs
  const [newDefaultTitle, setNewDefaultTitle] = useState('');
  const [newDefaultDesc, setNewDefaultDesc] = useState('');

  // Transition state for database mutations
  const [isPending, startTransition] = useTransition();
  const [actionId, setActionId] = useState<string | null>(null);

  // Auto-apply daily defaults once per day
  useEffect(() => {
    const today = new Date().toDateString(); // e.g. "Thu Jul 16 2026"
    const lastApplied = localStorage.getItem('rewise_defaults_applied_date');

    if (lastApplied !== today && defaults.length > 0) {
      startTransition(async () => {
        const res = await applyDefaultTodosAction();
        if (res.success && res.count && res.count > 0) {
          localStorage.setItem('rewise_defaults_applied_date', today);
        }
      });
    }
  }, [defaults]);

  const handleAddTodo = async (
    title: string,
    description: string,
    type: 'learning' | 'daily'
  ): Promise<string | void> => {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await addTodoAction(title, description, type);
        if (res.error) {
          resolve(res.error);
        } else {
          setIsFormOpen(false);
          resolve();
        }
      });
    });
  };

  const handleToggleTodo = (id: string, completed: boolean, type: 'learning' | 'daily') => {
    setActionId(id);
    startTransition(async () => {
      await toggleTodoAction(id, completed, type);
      setActionId(null);
    });
  };

  const handleToggleRevision = (id: string, todoId: string, revisionNumber: number) => {
    setActionId(id);
    startTransition(async () => {
      await toggleRevisionAction(id, todoId, revisionNumber);
      setActionId(null);
    });
  };

  const handleDeleteTodo = (id: string) => {
    setActionId(id);
    startTransition(async () => {
      await deleteTodoAction(id);
      setActionId(null);
    });
  };

  // Manage defaults CRUD
  const handleAddDefault = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDefaultTitle.trim()) return;

    startTransition(async () => {
      const res = await addDefaultTodoAction(newDefaultTitle, newDefaultDesc);
      if (!res.error) {
        setNewDefaultTitle('');
        setNewDefaultDesc('');
      }
    });
  };

  const handleDeleteDefault = (id: string) => {
    startTransition(async () => {
      await deleteDefaultTodoAction(id);
    });
  };

  // Determine grid template based on column collapse states
  const gridColsClass =
    (reviseTodayCollapsed && whatYouKnowCollapsed) ? 'grid-cols-1 lg:grid-cols-[1fr_60px_60px]' :
      reviseTodayCollapsed ? 'grid-cols-1 lg:grid-cols-[1fr_60px_1fr]' :
        whatYouKnowCollapsed ? 'grid-cols-1 lg:grid-cols-[1fr_1fr_60px]' :
          'grid-cols-1 lg:grid-cols-3';

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 flex flex-col min-h-screen">
      {/* Header Banner */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-border-subtle pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-widest text-brand-cyan flex items-center gap-2">
            REWISE 
          </h1>
          <p className="text-xs text-text-gray tracking-wider mt-1 font-sans">
            SPACED REPETITION TASK MANAGER
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs font-sans text-text-gray">
          <Link
            href="/blogs"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle bg-card-dark hover:border-brand-cyan hover:text-brand-cyan transition-all text-xs glow-btn font-semibold"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Blog
          </Link>
          <Link
            href="/clock"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle bg-card-dark hover:border-brand-cyan hover:text-brand-cyan transition-all text-xs glow-btn font-semibold">
            <Clock className="w-3.5 h-3.5" />
            Clock
          </Link>
          <Link
            href="/time-spent"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle bg-card-dark hover:border-brand-cyan hover:text-brand-cyan transition-all text-xs glow-btn font-semibold"
          >
            <Activity className="w-3.5 h-3.5" />
            Time Spent
          </Link>
          <span className="hidden sm:inline h-4 w-px bg-border-subtle"></span>
          <span>{todos.length} active todos</span>
          <span className="h-4 w-px bg-border-subtle"></span>
          <span>{revisions.length} revisions pending</span>
          <span className="h-4 w-px bg-border-subtle"></span>
          <span className="text-brand-green">{mastered.length} mastered</span>
        </div>
      </header>

      {/* Columns Grid */}
      <div className={`grid gap-6 flex-1 items-stretch ${gridColsClass}`}>

        {/* Column 1: Todos */}
        <TodoColumn
          todos={todos}
          isFormOpen={isFormOpen}
          setIsFormOpen={setIsFormOpen}
          onAddTodo={handleAddTodo}
          onToggleTodo={handleToggleTodo}
          onDeleteTodo={handleDeleteTodo}
          onOpenDefaults={() => setIsDefaultsOpen(true)}
          onOpenSRP={() => setIsSRPOpen(true)}
          isPending={isPending}
          actionId={actionId}
        />

        {/* Column 2: Revise Today */}
        <RevisionColumn
          revisions={revisions}
          isCollapsed={reviseTodayCollapsed}
          onToggleCollapse={() => setReviseTodayCollapsed(!reviseTodayCollapsed)}
          onToggleRevision={handleToggleRevision}
          isPending={isPending}
          actionId={actionId}
        />

        {/* Column 3: What You Know (Mastered Topics) */}
        <MasteredColumn
          mastered={mastered}
          isCollapsed={whatYouKnowCollapsed}
          onToggleCollapse={() => setWhatYouKnowCollapsed(!whatYouKnowCollapsed)}
        />

      </div>

      {/* Default Tasks Modal */}
      {isDefaultsOpen && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-fadeIn backdrop-blur-sm">
          <div className="bg-card-dark border border-border-glow rounded-xl p-6 max-w-lg w-full max-h-[85vh] flex flex-col font-doto text-text-white">
            <div className="flex justify-between items-center mb-4 border-b border-border-subtle pb-3">
              <h3 className="text-md font-bold tracking-wider text-brand-green flex items-center gap-1.5">
                Manage Default Daily Tasks
              </h3>
              <button
                onClick={() => setIsDefaultsOpen(false)}
                className="text-text-dim hover:text-white text-xs font-sans font-bold border border-border-subtle rounded px-2 py-1 bg-bg-dark/50"
              >
                ESC / CLOSE
              </button>
            </div>

            <p className="text-xs text-text-gray font-sans mb-4 leading-relaxed">
              Tasks listed here are automatically generated in your Daily Tasks list every day when you open the app.
            </p>

            {/* Create New Default Form */}
            <form onSubmit={handleAddDefault} className="p-3 bg-bg-dark/50 border border-border-subtle rounded-lg mb-4 space-y-3">
              <div className="text-xs font-bold text-brand-cyan tracking-wider">NEW DEFAULT TEMPLATE</div>
              <input
                type="text"
                placeholder="Task title..."
                value={newDefaultTitle}
                onChange={e => setNewDefaultTitle(e.target.value)}
                className="w-full bg-bg-dark border border-border-subtle rounded px-3 py-1.5 text-xs text-text-white placeholder:text-text-dim focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
                required
              />
              <textarea
                placeholder="Description/notes (optional)..."
                value={newDefaultDesc}
                onChange={e => setNewDefaultDesc(e.target.value)}
                className="w-full bg-bg-dark border border-border-subtle rounded px-3 py-1.5 text-xs text-text-white placeholder:text-text-dim h-12 resize-none focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-3 py-1.5 rounded bg-brand-green text-bg-dark font-bold hover:bg-emerald-400 text-xs flex items-center gap-1"
                >
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Add Default'}
                </button>
              </div>
            </form>

            {/* List of Defaults */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <div className="text-xs font-bold text-text-gray tracking-wider uppercase border-b border-border-subtle pb-1 mb-2">
                Active Default Templates ({defaults.length})
              </div>
              {defaults.length === 0 ? (
                <p className="text-xs text-text-dim font-sans py-4 text-center">No default tasks created yet.</p>
              ) : (
                <ul className="space-y-2">
                  {defaults.map(item => (
                    <li key={item.id} className="flex justify-between items-start p-3 bg-bg-dark/20 border border-border-subtle rounded-lg group">
                      <div className="min-w-0 flex-1 pr-3">
                        <h4 className="text-xs font-bold text-text-white truncate">{item.title}</h4>
                        {item.description && (
                          <p className="text-[10px] text-text-gray mt-1 truncate">{item.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteDefault(item.id)}
                        disabled={isPending}
                        className="px-2 py-1 rounded border border-border-subtle hover:border-red-400 hover:text-red-400 text-text-dim text-[10px] font-sans transition-colors"
                        title="Delete default task"
                      >
                        {isPending ? '...' : 'Delete'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SRP Explanation Modal */}
      {isSRPOpen && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-fadeIn backdrop-blur-sm">
          <div className="bg-card-dark border border-border-glow rounded-xl p-6 max-w-lg w-full max-h-[85vh] flex flex-col font-doto text-text-white shadow-2xl relative">
            <div className="flex justify-between items-center mb-4 border-b border-border-subtle pb-3">
              <h3 className="text-md font-bold tracking-wider text-brand-cyan flex items-center gap-1.5">
                Spaced Repetition (SRP)
              </h3>
              <button
                onClick={() => setIsSRPOpen(false)}
                className="text-text-dim hover:text-white text-xs font-sans font-bold border border-border-subtle rounded px-2 py-1 bg-bg-dark/50 hover:border-brand-cyan transition-all"
              >
                ESC / CLOSE
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs font-sans leading-relaxed text-text-gray">
              <div>
                <p className="font-bold text-text-white mb-1">What is Spaced Repetition?</p>
                <p>
                  It is a highly effective learning technique that prompts you to review concepts at increasing time intervals. By spacing out reviews, you reinforce your brain's memory paths just as they are beginning to fade, converting short-term tasks into long-term knowledge.
                </p>
              </div>

              <div className="bg-bg-dark/40 border border-border-subtle p-3 rounded-lg">
                <p className="font-bold text-brand-purple mb-2 tracking-wider font-doto text-[11px]">THE REWISE LEARNING CYCLE</p>
                <div className="flex items-center justify-between gap-1 text-center font-doto text-[9px] text-text-dim">
                  <div className="flex-1 bg-border-subtle/30 p-1.5 rounded border border-border-subtle">
                    {/* <span className="block text-text-white font-bold font-sans">Todo</span> */}
                    <span className='text-text-white text-lg'>Start</span>
                  </div>
                  <span className="text-brand-cyan">&rarr;</span>
                  <div className="flex-1 bg-border-subtle/30 p-1.5 rounded border border-border-subtle">
                    {/* <span className="block text-brand-cyan font-bold font-sans">R1</span> */}
                    <span className='text-text-white  text-lg'>1d</span>
                  </div>
                  <span className="text-brand-cyan">&rarr;</span>
                  <div className="flex-1 bg-border-subtle/30 p-1.5 rounded border border-border-subtle">
                    {/* <span className="block text-brand-purple font-bold font-sans">R2</span> */}
                    <span className='text-text-white text-lg'>3d</span>
                  </div>
                  <span className="text-brand-cyan">&rarr;</span>
                  <div className="flex-1 bg-border-subtle/30 p-1.5 rounded border border-border-subtle">
                    {/* <span className="block text-brand-green font-bold font-sans">R3-5</span> */}
                    <span className='text-text-white text-lg'>7-30d</span>
                  </div>
                  <span className="text-brand-cyan">&rarr;</span>
                  <div className="flex-1 bg-brand-green/10 p-1.5 rounded border border-brand-green/30 text-brand-green">
                    <span className="block font-bold font-sans">Mastery</span>
                    <span>Saved</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="font-bold text-text-white mb-1">How Rewise automates this:</p>
                <ul className="list-decimal pl-4 space-y-2">
                  <li>
                    Create a task and select <strong className="text-brand-cyan font-sans">SRP-Learning</strong> as the type.
                  </li>
                  <li>
                    When you check it off, it automatically schedules your <strong className="text-text-white font-sans">Revision 1</strong> for the next day.
                  </li>
                  <li>
                    Every morning, the algorithm checks what reviews are due and places them in your <strong className="text-brand-cyan font-sans">Revise Today</strong> column.
                  </li>
                  <li>
                    Each completed revision multiplies the spacing interval (<strong className="text-text-white font-sans">1 &rarr; 3 &rarr; 7 &rarr; 15 &rarr; 30 days</strong>).
                  </li>
                  <li>
                    After completing the 5th revision, the concept is permanently archived in <strong className="text-brand-green font-sans">What You Know</strong> as mastered!
                  </li>
                </ul>
              </div>

              <div className="border-t border-border-subtle pt-3 flex justify-between items-center text-[10px] font-sans">
                <span>Want to dive deeper into the science?</span>
                <Link
                  href="/blogs/spaced-repetition"
                  onClick={() => setIsSRPOpen(false)}
                  className="text-brand-cyan hover:underline font-bold"
                >
                  Read our full article &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
