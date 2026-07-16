'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, Calendar, BookOpen } from 'lucide-react';
import { Todo, MasteredTopic } from '../types';

interface MasteredColumnProps {
  mastered: (MasteredTopic & { todos: Todo | null })[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function MasteredColumn({
  mastered,
  isCollapsed,
  onToggleCollapse,
}: MasteredColumnProps) {
  if (isCollapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className="flex lg:flex-col items-center justify-between lg:justify-center p-4 lg:p-3 rounded-xl border border-border-subtle bg-card-dark hover:border-brand-green hover:bg-card-dark/80 cursor-pointer transition-all w-full h-auto lg:h-full lg:min-h-[600px]"
        title="Expand What You Know"
      >
        <div className="flex lg:flex-col items-center gap-2 lg:gap-4 text-brand-green select-none w-full justify-between lg:justify-center">
          <div className="flex items-center gap-2 lg:flex-col">
            <span className="font-bold tracking-widest text-xs uppercase lg:[writing-mode:vertical-lr] lg:[text-orientation:mixed]">
              What you know
            </span>
            <span className="text-xs font-sans bg-brand-green/20 px-2 py-0.5 rounded-full">{mastered.length}</span>
          </div>
          <ChevronRight className="w-5 h-5 animate-pulse transform rotate-90 lg:rotate-0" />
        </div>
      </button>
    );
  }

  return (
    <section className="glow-card bg-card-dark rounded-xl p-6 flex flex-col h-full min-h-[600px] border-l-2 border-l-brand-green">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold tracking-wider text-brand-green">
          What you know
        </h2>
        <button
          onClick={onToggleCollapse}
          className="p-1 rounded text-text-dim hover:text-white"
          title="Collapse column"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        <p className="text-[10px] font-sans text-text-gray mb-4">
          Items completed after 5 levels of revision spacing.
        </p>

        {mastered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 border border-dashed border-border-subtle rounded-lg p-4 text-center opacity-60">
            <BookOpen className="w-8 h-8 text-text-dim mb-2" />
            <p className="text-xs text-text-dim font-sans">No topics mastered yet.</p>
            <p className="text-[9px] text-text-dim/80 mt-1 font-sans">Complete all 5 revision steps to lock in knowledge.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {mastered.map((item) => (
              <li key={item.id} className="flex items-start gap-3 p-3 rounded-lg border border-brand-green/30 bg-brand-green/5 text-brand-green">
                <CheckCircle2 className="w-4.5 h-4.5 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold truncate text-brand-green">
                    {item.todos?.title || 'Unknown Task'}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] text-brand-green/75 font-sans flex items-center gap-0.5">
                      <Calendar className="w-3 h-3" />
                      Mastered: {new Date(item.mastered_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
