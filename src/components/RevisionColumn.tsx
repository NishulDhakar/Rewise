'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, Clock } from 'lucide-react';
import { Todo, Revision } from '../types';

interface RevisionColumnProps {
  revisions: (Revision & { todos: Todo | null })[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onToggleRevision: (id: string, todoId: string, revisionNumber: number) => void;
  isPending: boolean;
  actionId: string | null;
}

export default function RevisionColumn({
  revisions,
  isCollapsed,
  onToggleCollapse,
  onToggleRevision,
  isPending,
  actionId,
}: RevisionColumnProps) {
  // Group revisions by revision_number
  const revisionsByStage: Record<number, typeof revisions> = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
  };
  revisions.forEach(rev => {
    if (revisionsByStage[rev.revision_number]) {
      revisionsByStage[rev.revision_number].push(rev);
    }
  });

  const getOrdinalName = (num: number) => {
    switch (num) {
      case 1: return '1st';
      case 2: return '2nd';
      case 3: return '3rd';
      case 4: return '4th';
      case 5: return '5th';
      default: return `${num}th`;
    }
  };

  if (isCollapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className="flex lg:flex-col items-center justify-between lg:justify-center p-4 lg:p-3 rounded-xl border border-border-subtle bg-card-dark hover:border-brand-purple hover:bg-card-dark/80 cursor-pointer transition-all w-full h-auto lg:h-full lg:min-h-[600px]"
        title="Expand Revise Today"
      >
        <div className="flex lg:flex-col items-center gap-2 lg:gap-4 text-brand-purple select-none w-full justify-between lg:justify-center">
          <div className="flex items-center gap-2 lg:flex-col">
            <span className="font-bold tracking-widest text-xs uppercase lg:[writing-mode:vertical-lr] lg:[text-orientation:mixed]">
              Revise today
            </span>
            <span className="text-xs font-sans bg-brand-purple/20 px-2 py-0.5 rounded-full">{revisions.length}</span>
          </div>
          <ChevronRight className="w-5 h-5 animate-pulse transform rotate-90 lg:rotate-0" />
        </div>
      </button>
    );
  }

  return (
    <section className="glow-card bg-card-dark rounded-xl p-6 flex flex-col h-full min-h-[600px]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold tracking-wider">
          Revise today
        </h2>
        <button
          onClick={onToggleCollapse}
          className="p-1 rounded text-text-dim  "
          title="Collapse column"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
        {revisions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 border border-dashed border-border-subtle rounded-lg p-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-brand-green mb-2 opacity-50" />
            <p className="text-xs text-text-gray font-sans">No revisions scheduled for today!</p>
            <p className="text-[10px] text-text-dim mt-1 font-sans">Tasks will appear here based on spacing schedule.</p>
          </div>
        ) : (
          Object.entries(revisionsByStage).map(([stageNum, stageRevs]) => {
            if (stageRevs.length === 0) return null;

            return (
              <div key={stageNum} className="border border-border-subtle rounded-lg p-4 bg-bg-dark/30">
                <h3 className="text-xs font-bold font-sans tracking-wider text-brand-cyan flex items-center justify-between mb-3 border-b border-border-subtle pb-1.5">
                  <span>{getOrdinalName(Number(stageNum))} revise - start on</span>
                  <span className="text-[10px] text-brand-purple font-semibold bg-brand-purple/10 px-1.5 py-0.5 rounded">
                    {stageRevs.length} due
                  </span>
                </h3>

                <ul className="space-y-2">
                  {stageRevs.map((rev) => {
                    const isDueNow = new Date(rev.due_date) <= new Date();
                    return (
                      <li key={rev.id} className="flex items-start gap-3 p-2 bg-bg-dark/50 rounded border border-border-subtle/50">
                        <input
                          type="checkbox"
                          checked={rev.completed}
                          disabled={isPending}
                          onChange={() => onToggleRevision(rev.id, rev.todo_id, rev.revision_number)}
                          className="mt-1 accent-brand-cyan rounded cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-text-white truncate">
                            {rev.todos?.title || 'Unknown Task'}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-sans text-text-gray flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(rev.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            {isDueNow ? (
                              <span className="text-[9px] font-sans font-bold bg-amber-500/20 text-amber-400 px-1 rounded animate-pulse">
                                DUE
                              </span>
                            ) : (
                              <span className="text-[9px] font-sans bg-text-dim/20 text-text-gray px-1 rounded">
                                UPCOMING
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
