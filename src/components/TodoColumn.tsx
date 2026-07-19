'use client';

import React from 'react';
import { Plus, Brain, Calendar, Trash2, Loader2 } from 'lucide-react';
import { Todo } from '../types';
import AddTodoForm from './AddTodoForm';

interface TodoColumnProps {
  todos: Todo[];
  isFormOpen: boolean;
  setIsFormOpen: (open: boolean) => void;
  onAddTodo: (title: string, description: string, type: 'learning' | 'daily') => Promise<string | void>;
  onToggleTodo: (id: string, completed: boolean, type: 'learning' | 'daily') => void;
  onDeleteTodo: (id: string) => void;
  onOpenDefaults: () => void;
  onOpenSRP: () => void;
  isPending: boolean;
  actionId: string | null;
}

export default function TodoColumn({
  todos,
  isFormOpen,
  setIsFormOpen,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
  onOpenDefaults,
  onOpenSRP,
  isPending,
  actionId,
}: TodoColumnProps) {
  const learningTodos = todos.filter(t => t.type === 'learning');
  const dailyTodos = todos.filter(t => t.type === 'daily');

  return (
    <section className="glow-card bg-card-dark rounded-xl p-6 flex flex-col h-full min-h-[600px]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold tracking-wider">
          Todo
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSRP}
            className="glow-btn px-3 py-1.5 rounded-lg border border-border-subtle bg-bg-dark text-text-gray hover:border-brand-green  text-xs font-sans font-bold"
            title="What is space repetition?"
          >
            SRP?
          </button>

          <button
            onClick={onOpenDefaults}
            className="glow-btn px-3 py-1.5 rounded-lg border border-border-subtle bg-bg-dark text-text-gray hover:border-brand-green  text-xs font-sans font-bold"
            title="Manage default daily tasks"
          >
            Default
          </button>
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="glow-btn p-2 rounded-lg border border-border-subtle bg-bg-dark text-brand-cyan hover:border-brand-cyan"
            title="Add a new task"
          >
            <Plus className={`w-4 h-4 transform transition-transform ${isFormOpen ? 'rotate-45' : ''}`} />
          </button>
        </div>
      </div>

      {isFormOpen && (
        <AddTodoForm
          onClose={() => setIsFormOpen(false)}
          onSubmit={onAddTodo}
          isPending={isPending}
        />
      )}

      <div className="space-y-6 flex-1 overflow-y-auto pr-1">
        {/* Learning section */}
        <div>
          <h3 className="text-xs font-bold tracking-widest text-brand-purple mb-3 uppercase flex items-center gap-1.5 border-b border-border-subtle pb-1">
            <Brain className="w-3.5 h-3.5" /> Learning Topic
          </h3>
          {learningTodos.length === 0 ? (
            <p className="text-xs text-text-dim font-sans py-2">No learning topics in progress.</p>
          ) : (
            <ul className="space-y-2">
              {learningTodos.map((todo) => (
                <li key={todo.id} className="group relative flex items-start gap-3 p-3 rounded-lg border border-border-subtle hover:border-border-glow bg-bg-dark/20">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    disabled={isPending}
                    onChange={(e) => onToggleTodo(todo.id, e.target.checked, 'learning')}
                    className="mt-1 font-mono accent-brand-cyan rounded cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-text-white truncate">{todo.title}</h4>
                    {todo.description && (
                      <p className="text-xs text-text-gray mt-1 line-clamp-3">{todo.description}</p>
                    )}
                    <span className="inline-block text-[10px] font-sans text-brand-purple bg-brand-purple/10 px-1.5 py-0.5 rounded mt-2 uppercase">
                      Interval cycle
                    </span>
                  </div>
                  <button
                    onClick={() => onDeleteTodo(todo.id)}
                    disabled={isPending}
                    className="opacity-0 group-hover:opacity-100 p-1 text-text-dim hover:text-red-400 transition-opacity"
                    title="Delete task"
                  >
                    {isPending && actionId === todo.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Daily Tasks section */}
        <div>
          <h3 className="text-xs font-bold tracking-widest text-brand-cyan mb-3 uppercase flex items-center gap-1.5 border-b border-border-subtle pb-1">
            <Calendar className="w-3.5 h-3.5" /> Daily task
          </h3>
          {dailyTodos.length === 0 ? (
            <p className="text-xs text-text-dim font-sans py-2">No daily tasks.</p>
          ) : (
            <ul className="space-y-2">
              {dailyTodos.map((todo) => (
                <li key={todo.id} className="group relative flex items-start gap-3 p-3 rounded-lg border border-border-subtle hover:border-border-glow bg-bg-dark/20">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    disabled={isPending}
                    onChange={(e) => onToggleTodo(todo.id, e.target.checked, 'daily')}
                    className="mt-1 accent-brand-cyan rounded cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm text-text-white truncate">{todo.title}</h4>
                    {todo.description && (
                      <p className="text-xs text-text-gray mt-1 line-clamp-3">{todo.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => onDeleteTodo(todo.id)}
                    disabled={isPending}
                    className="opacity-0 group-hover:opacity-100 p-1 text-text-dim hover:text-red-400 transition-opacity"
                    title="Delete task"
                  >
                    {isPending && actionId === todo.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
