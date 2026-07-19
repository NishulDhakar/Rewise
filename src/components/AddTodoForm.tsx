'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface AddTodoFormProps {
  onClose: () => void;
  onSubmit: (title: string, description: string, type: 'learning' | 'daily') => Promise<string | void>;
  isPending: boolean;
}

export default function AddTodoForm({ onClose, onSubmit, isPending }: AddTodoFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState<'learning' | 'daily'>('learning');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setError('');
    const errMsg = await onSubmit(title, description, taskType);
    if (errMsg) {
      setError(errMsg);
    } else {
      setTitle('');
      setDescription('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-4 rounded-lg border border-border-glow bg-bg-dark/50 space-y-4 animate-fadeIn">
      <div>
        <input
          type="text"
          placeholder="Task title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-bg-dark border border-border-subtle rounded px-3 py-2 text-sm text-text-white placeholder:text-text-dim font-mono focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
          required
        />
      </div>
      <div>
        <textarea
          placeholder="Add details / notes..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-bg-dark border border-border-subtle rounded px-3 py-2 text-sm text-text-white placeholder:text-text-dim font-mono h-20 resize-none focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
        />
      </div>
      <div className="flex gap-4 items-center">
        <span className="text-sm text-text-gray font-sans">Type:</span>
        <label className="flex items-center gap-1.5 cursor-pointer text-xs">
          <input
            type="radio"
            name="type"
            checked={taskType === 'learning'}
            onChange={() => setTaskType('learning')}
            className="accent-brand-cyan"
          />
          <span className='font-mono font-light'>SRP-Learning</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer text-xs">
          <input
            type="radio"
            name="type"
            checked={taskType === 'daily'}
            onChange={() => setTaskType('daily')}
            className="accent-brand-cyan"
          />
          <span className='font-mono font-light'>Daily Task</span>
        </label>
      </div>
      {error && (
        <p className="text-xs text-red-400 font-sans">{error}</p>
      )}
      <div className="flex justify-end gap-2 text-xs">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 font-mono font-light rounded border border-border-subtle hover:bg-card-dark text-text-gray"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-3 py-1.5 font-mono font-light rounded bg-brand-cyan text-bg-dark font-bold hover:bg-cyan-400 flex items-center gap-1"
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Create'}
        </button>
      </div>
    </form>
  );
}
