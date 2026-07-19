'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Clock,
  ArrowLeft,
  Calendar,
  BarChart3,
  PieChart,
  Layers,
  Activity,
  ChevronDown,
  ChevronUp,
  Folder,
  CheckCircle,
  Play
} from 'lucide-react';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';

// ==========================================
// Types
// ==========================================
interface Project {
  id: string;
  name: string;
  color: string; // Hex color
  isFavorite?: boolean;
}

interface TimeEntry {
  id: string;
  description: string;
  projectId: string | null;
  startTime: string; // ISO String
  endTime: string; // ISO String
  duration: number; // in seconds
}

export default function TimeSpentPage() {
  // ==========================================
  // States
  // ==========================================
  const [mounted, setMounted] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [periodFilter, setPeriodFilter] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [selectedProjId, setSelectedProjId] = useState<string | 'all'>('all');
  const [isProjFilterDropdownOpen, setIsProjFilterDropdownOpen] = useState(false);

  // ==========================================
  // Data Fetching
  // ==========================================
  useEffect(() => {
    setMounted(true);

    const storedProjects = localStorage.getItem('rewise_projects');
    if (storedProjects) {
      setProjects(JSON.parse(storedProjects));
    }

    const storedEntries = localStorage.getItem('rewise_time_entries');
    if (storedEntries) {
      setTimeEntries(JSON.parse(storedEntries));
    }
  }, []);

  const getProjectDetails = (projId: string | null) => {
    const defaultProj = { name: 'No Project', color: '#64748b' };
    if (!projId) return defaultProj;
    return projects.find(p => p.id === projId) || defaultProj;
  };

  // ==========================================
  // Date Filtering Logic
  // ==========================================
  const filteredEntries = useMemo(() => {
    if (timeEntries.length === 0) return [];

    const now = new Date();
    let startDate = new Date();

    if (periodFilter === 'daily') {
      // Start of today
      startDate.setHours(0, 0, 0, 0);
    } else if (periodFilter === 'weekly') {
      // 7 days ago
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (periodFilter === 'monthly') {
      // 30 days ago
      startDate.setDate(now.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    }

    return timeEntries.filter(entry => {
      const entryTime = new Date(entry.startTime).getTime();
      const inDateRange = entryTime >= startDate.getTime();
      const matchesProject = selectedProjId === 'all' || entry.projectId === selectedProjId;
      return inDateRange && matchesProject;
    });
  }, [timeEntries, periodFilter, selectedProjId]);

  // ==========================================
  // Aggregate Metrics Calculations
  // ==========================================
  const totalDuration = useMemo(() => {
    return filteredEntries.reduce((sum, e) => sum + e.duration, 0);
  }, [filteredEntries]);

  const sessionCount = filteredEntries.length;

  const topProject = useMemo(() => {
    if (filteredEntries.length === 0) return { name: 'None', duration: 0, color: '#64748b' };

    const projectTimes: Record<string, number> = {};
    filteredEntries.forEach(entry => {
      const pId = entry.projectId || 'no-project';
      projectTimes[pId] = (projectTimes[pId] || 0) + entry.duration;
    });

    let topId = 'no-project';
    let maxTime = 0;
    Object.keys(projectTimes).forEach(pId => {
      if (projectTimes[pId] > maxTime) {
        maxTime = projectTimes[pId];
        topId = pId;
      }
    });

    if (maxTime === 0) return { name: 'None', duration: 0, color: '#64748b' };

    const details = getProjectDetails(topId === 'no-project' ? null : topId);
    return {
      name: details.name,
      duration: maxTime,
      color: details.color
    };
  }, [filteredEntries, projects]);

  const topTask = useMemo(() => {
    if (filteredEntries.length === 0) return { description: 'None', duration: 0 };

    const taskTimes: Record<string, number> = {};
    filteredEntries.forEach(entry => {
      const desc = entry.description || 'Add description';
      taskTimes[desc] = (taskTimes[desc] || 0) + entry.duration;
    });

    let topDesc = 'Add description';
    let maxTime = 0;
    Object.keys(taskTimes).forEach(desc => {
      if (taskTimes[desc] > maxTime) {
        maxTime = taskTimes[desc];
        topDesc = desc;
      }
    });

    return {
      description: topDesc,
      duration: maxTime
    };
  }, [filteredEntries]);

  // ==========================================
  // Project Allocation Grouping (Sorted)
  // ==========================================
  const projectBreakdown = useMemo(() => {
    if (filteredEntries.length === 0) return [];

    const projectMap: Record<string, number> = {};
    filteredEntries.forEach(entry => {
      const pId = entry.projectId || 'no-project';
      projectMap[pId] = (projectMap[pId] || 0) + entry.duration;
    });

    return Object.keys(projectMap)
      .map(pId => {
        const details = getProjectDetails(pId === 'no-project' ? null : pId);
        const duration = projectMap[pId];
        const percentage = totalDuration > 0 ? (duration / totalDuration) * 100 : 0;
        return {
          id: pId,
          name: details.name,
          color: details.color,
          duration,
          percentage
        };
      })
      .sort((a, b) => b.duration - a.duration);
  }, [filteredEntries, totalDuration, projects]);

  // ==========================================
  // Tasks breakdown (Sorted)
  // ==========================================
  const taskBreakdown = useMemo(() => {
    if (filteredEntries.length === 0) return [];

    const taskMap: Record<string, {
      description: string;
      projectId: string | null;
      sessions: number;
      duration: number;
    }> = {};

    filteredEntries.forEach(entry => {
      const desc = entry.description || 'Add description';
      const key = `${desc}-${entry.projectId || 'no-project'}`;

      if (!taskMap[key]) {
        taskMap[key] = {
          description: desc,
          projectId: entry.projectId,
          sessions: 0,
          duration: 0
        };
      }

      taskMap[key].sessions += 1;
      taskMap[key].duration += entry.duration;
    });

    return Object.keys(taskMap)
      .map(key => {
        const task = taskMap[key];
        const percentage = totalDuration > 0 ? (task.duration / totalDuration) * 100 : 0;
        return {
          key,
          ...task,
          percentage
        };
      })
      .sort((a, b) => b.duration - a.duration);
  }, [filteredEntries, totalDuration]);

  // ==========================================
  // Daily / Slot Chart Data Calculation
  // ==========================================
  const chartData = useMemo(() => {
    const data: { label: string; duration: number }[] = [];

    if (periodFilter === 'daily') {
      // 4 hourly blocks
      const slots = [
        { label: '00-06', startHour: 0, endHour: 6 },
        { label: '06-12', startHour: 6, endHour: 12 },
        { label: '12-18', startHour: 12, endHour: 18 },
        { label: '18-24', startHour: 18, endHour: 24 }
      ];

      slots.forEach(slot => {
        let durationSum = 0;
        filteredEntries.forEach(entry => {
          const entryHour = new Date(entry.startTime).getHours();
          if (entryHour >= slot.startHour && entryHour < slot.endHour) {
            durationSum += entry.duration;
          }
        });
        data.push({ label: slot.label, duration: durationSum });
      });
    } else if (periodFilter === 'weekly') {
      // Last 7 days
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d);
      }

      days.forEach(dayDate => {
        let durationSum = 0;
        filteredEntries.forEach(entry => {
          const entryDate = new Date(entry.startTime);
          if (entryDate.toDateString() === dayDate.toDateString()) {
            durationSum += entry.duration;
          }
        });

        const dayLabel = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
        data.push({ label: dayLabel, duration: durationSum });
      });
    } else if (periodFilter === 'monthly') {
      // Last 30 days
      const days = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d);
      }

      days.forEach((dayDate, idx) => {
        let durationSum = 0;
        filteredEntries.forEach(entry => {
          const entryDate = new Date(entry.startTime);
          if (entryDate.toDateString() === dayDate.toDateString()) {
            durationSum += entry.duration;
          }
        });

        // Only display labels for every 5th day to avoid mobile overlapping
        const dayLabel = idx % 5 === 0
          ? dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : '';
        data.push({ label: dayLabel, duration: durationSum });
      });
    }

    return data;
  }, [filteredEntries, periodFilter]);

  // Max value in chart to scale SVG heights
  const chartMaxDuration = useMemo(() => {
    const max = Math.max(...chartData.map(d => d.duration));
    return max > 0 ? max : 3600; // default 1 hour scale if 0
  }, [chartData]);

  // ==========================================
  // Helper Formatters
  // ==========================================
  const formatTimeText = (totalSeconds: number) => {
    if (totalSeconds === 0) return '0s';
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const formatDetailedTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const pad = (num: number) => String(num).padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  if (!mounted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-bg-dark text-text-gray font-sans h-screen">
        <Activity className="w-8 h-8 animate-pulse text-brand-cyan mb-2" />
        <span className="text-xs font-bold tracking-widest uppercase">Generating Dashboard...</span>
      </div>
    );
  }

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 flex flex-col min-h-screen">
      {/* Header Banner */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-border-subtle pb-6">
        <div>
          <Link href="/">
            <h1 className="text-3xl font-black tracking-widest text-brand-cyan flex items-center gap-2 hover:opacity-85 transition-opacity font-doto">
              REWISE
            </h1>
          </Link>
          <p className="text-xs text-text-gray tracking-wider mt-1 font-sans">
            SPACED REPETITION TASK MANAGER
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs font-sans">
          <AnimatedThemeToggler className="flex items-center justify-center p-2 rounded-lg border border-border-subtle bg-card-dark hover:border-brand-cyan hover:text-brand-cyan transition-all text-xs glow-btn font-semibold text-text-gray" />
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle bg-card-dark text-text-white hover:border-brand-cyan hover:text-brand-cyan transition-all text-xs glow-btn font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-text-gray" />
            Dashboard
          </Link>
          <Link
            href="/clock"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle bg-card-dark text-text-white hover:border-brand-cyan hover:text-brand-cyan transition-all text-xs glow-btn font-semibold"
          >
            <Clock className="w-3.5 h-3.5 text-text-gray" />
            Clock
          </Link>
        </div>
      </header>

      {/* ==========================================
          PERIOD SELECTOR & FILTERS
          ========================================== */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-8 bg-card-dark border border-border-subtle rounded-xl p-4 glow-card">
        {/* Toggle Period Buttons */}
        <div className="flex rounded-lg overflow-hidden border border-border-subtle p-0.5 bg-bg-dark/50 self-start">
          {(['daily', 'weekly', 'monthly'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriodFilter(p)}
              className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider font-sans transition-all cursor-pointer rounded-md ${periodFilter === p
                  ? 'bg-brand-cyan text-bg-dark font-black shadow-md'
                  : 'text-text-gray   hover:bg-bg-dark/30'
                }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Project Selector Filter */}
        <div className="relative self-start md:self-auto">
          <button
            onClick={() => setIsProjFilterDropdownOpen(!isProjFilterDropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border-subtle bg-bg-dark/40 hover:bg-bg-dark transition-all text-xs text-text-gray cursor-pointer"
          >
            <Folder className="w-3.5 h-3.5 text-brand-cyan" />
            <span className="font-semibold font-mono">Project: </span>
            <span className="text-text-white font-mono text-xs tracking-wider">
              {selectedProjId === 'all' ? 'All Projects' : getProjectDetails(selectedProjId).name}
            </span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </button>

          {isProjFilterDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 z-30 w-52 bg-card-dark border border-border-glow rounded-xl p-2 shadow-2xl animate-fadeIn divide-y divide-border-subtle/30 font-sans">
              <button
                onClick={() => {
                  setSelectedProjId('all');
                  setIsProjFilterDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2 p-2 hover:bg-bg-dark text-left text-xs text-text-gray   cursor-pointer rounded-lg"
              >
                <span className="w-2.5 h-2.5 rounded-full border border-dashed border-border-subtle inline-block" />
                <span>All Projects</span>
              </button>
              {projects.map(proj => (
                <button
                  key={proj.id}
                  onClick={() => {
                    setSelectedProjId(proj.id);
                    setIsProjFilterDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 p-2 hover:bg-bg-dark text-left text-xs text-text-gray cursor-pointer rounded-lg"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: proj.color }}
                  />
                  <span>{proj.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ==========================================
          METRICS CARDS
          ========================================== */}
      {sessionCount === 0 ? (
        <div className="glow-card bg-card-dark border border-border-subtle rounded-xl py-20 px-6 text-center text-text-dim flex-1 flex flex-col items-center justify-center">
          <Clock className="w-16 h-16 stroke-[1] mb-4 text-text-dim animate-pulse" />
          <h3 className="text-base font-bold tracking-widest uppercase">No tracking records found</h3>
          <p className="text-xs font-sans mt-2 text-text-gray max-w-sm leading-relaxed">
            There are no logs matching the filter settings in your local storage. Go to the clock page, track some sessions, and your analytics will automatically build!
          </p>
          <Link
            href="/clock"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-brand-cyan hover:bg-cyan-400 text-bg-dark font-bold font-sans text-xs rounded-lg glow-btn shadow-lg"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Go Track Time
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Metric 1: Total Duration */}
            <div className="bg-card-dark border border-border-subtle p-5 rounded-xl glow-card flex flex-col justify-between">
              <span className="text-[12px] text-text-gray font-bold tracking-widest uppercase font-sans">
                Time Tracked
              </span>
              <div className="mt-2 flex items-baseline">
                <span className="font-mono text-2xl font-black tracking-wider text-brand-cyan">
                  {formatTimeText(totalDuration)}
                </span>
              </div>
              <span className="text-[12px] text-text-dim font-sans mt-1">
                cumulative duration
              </span>
            </div>

            {/* Metric 2: Sessions */}
            <div className="bg-card-dark border border-border-subtle p-5 rounded-xl glow-card flex flex-col justify-between">
              <span className="text-[12px] text-text-gray font-bold tracking-widest uppercase font-sans">
                Tracked Sessions
              </span>
              <div className="mt-2 flex items-baseline">
                <span className="font-mono text-2xl font-black tracking-wider text-brand-green">
                  {sessionCount}
                </span>
                <span className="text-xs text-text-dim ml-1 font-sans">runs</span>
              </div>
              <span className="text-[12px] text-text-dim font-sans mt-1">
                total completed starts
              </span>
            </div>

            {/* Metric 3: Top Project */}
            <div className="bg-card-dark border border-border-subtle p-5 rounded-xl glow-card flex flex-col justify-between">
              <span className="text-[12px] text-text-gray font-bold tracking-widest uppercase font-sans">
                Top Project
              </span>
              <div className="mt-2 flex flex-col min-w-0">
                <span
                  className="font-bold text-sm truncate uppercase tracking-wide"
                  style={{ color: topProject.color }}
                >
                  {topProject.name}
                </span>
                <span className="font-mono text-xs font-light tracking-widest mt-1">
                  {formatTimeText(topProject.duration)}
                </span>
              </div>
              <span className="text-[12px] text-text-dim font-sans mt-1">
                most focused area
              </span>
            </div>

            {/* Metric 4: Top Task */}
            <div className="bg-card-dark border border-border-subtle p-5 rounded-xl glow-card flex flex-col justify-between">
              <span className="text-[12px] text-text-gray font-bold tracking-widest uppercase font-sans">
                Top Focused Task
              </span>
              <div className="mt-2 flex flex-col min-w-0">
                <span className="font-bold text-sm text-text-white truncate font-sans">
                  {topTask.description}
                </span>
                <span className="font-mono text-xs font-light text-brand-cyan tracking-widest mt-1">
                  {formatTimeText(topTask.duration)}
                </span>
              </div>
              <span className="text-[12px] text-text-dim font-sans mt-1">
                most logged description
              </span>
            </div>
          </div>

          {/* ==========================================
              VISUAL CHARTS SECTION
              ========================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Chart 1: Project Allocation Progress List */}
            <div className="bg-card-dark border border-border-subtle rounded-xl p-6 glow-card flex flex-col">
              <div className="flex items-center gap-2 mb-6 border-b border-border-subtle pb-3">
                <PieChart className="w-4 h-4 text-brand-cyan" />
                <h3 className="text-sm font-bold uppercase tracking-widest">
                  Project Allocation
                </h3>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto max-h-60 pr-1">
                {projectBreakdown.map(proj => (
                  <div key={proj.id} className="space-y-1.5 text-xs font-sans">
                    <div className="flex justify-between items-center text-text-gray">
                      <div className="flex items-center gap-2 truncate pr-4">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                          style={{ backgroundColor: proj.color }}
                        />
                        <span className="truncate text-text-white font-semibold">{proj.name}</span>
                      </div>
                      <div className="flex items-center gap-2 font-doto shrink-0">
                        <span className="text-brand-cyan font-mono font-bold">{formatTimeText(proj.duration)}</span>
                        <span className="text-text-dim font-mono">({Math.round(proj.percentage)}%)</span>
                      </div>
                    </div>
                    {/* Progress Bar Container */}
                    <div className="w-full h-2 rounded bg-bg-dark/60 overflow-hidden border border-border-subtle/50">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${proj.percentage}%`,
                          backgroundColor: proj.color,
                          boxShadow: `0 0 8px ${proj.color}40`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2: Daily Activity SVG Bar Graph */}
            <div className="bg-card-dark border border-border-subtle rounded-xl p-6 glow-card flex flex-col">
              <div className="flex items-center gap-2 mb-6 border-b border-border-subtle pb-3">
                <BarChart3 className="w-4 h-4 text-brand-cyan" />
                <h3 className="text-sm font-bold uppercase tracking-widest">
                  Activity Timeline
                </h3>
              </div>

              {/* Bar Graph container */}
              <div className="flex-1 flex flex-col justify-end min-h-[180px] font-sans">
                {/* SVG Graph Drawing */}
                <div className="w-full flex items-end justify-between gap-1.5 h-36 border-b border-border-subtle pb-1">
                  {chartData.map((dataItem, idx) => {
                    const heightPercent = chartMaxDuration > 0
                      ? (dataItem.duration / chartMaxDuration) * 90 // cap at 90% to leave breathing room
                      : 0;

                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center group relative h-full justify-end cursor-help"
                      >
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full font-mono mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-bg-dark border border-border-glow text-[10px] font-bold text-brand-cyan px-2 py-1 rounded shadow-lg pointer-events-none z-10 whitespace-nowrap">
                          {formatTimeText(dataItem.duration)}
                        </div>

                        {/* Bar */}
                        <div
                          className="w-full rounded-t transition-all duration-500 bg-brand-cyan/20 border border-brand-cyan/40 hover:bg-brand-cyan/80 hover:border-brand-cyan"
                          style={{
                            height: `${Math.max(2, heightPercent)}%`,
                            boxShadow: heightPercent > 10 ? '0 0 6px rgba(6, 182, 212, 0.15)' : 'none'
                          }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* X Axis Labels */}
                <div className="flex justify-between items-center pt-2 text-[9px] text-text-dim tracking-wider">
                  {chartData.map((dataItem, idx) => (
                    <span key={idx} className="flex-1 text-center truncate">
                      {dataItem.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ==========================================
              DETAILS GRID & LIST
              ========================================== */}
          <section className="glow-card bg-card-dark rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6 border-b border-border-subtle pb-3">
              <Layers className="w-4 h-4 text-brand-cyan" />
              <h3 className="text-sm font-bold uppercase tracking-widest">
                Detailed Log Analysis
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle text-text-dim font-bold text-[10px] uppercase tracking-wider">
                    <th className="pb-3 pr-4">Task Description</th>
                    <th className="pb-3 pr-4">Project</th>
                    <th className="pb-3 pr-4 text-center">Sessions</th>
                    <th className="pb-3 pr-4 text-right">Average Session</th>
                    <th className="pb-3 text-right">Total Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/30 text-text-gray font-medium">
                  {taskBreakdown.map((taskItem) => {
                    const projDetails = getProjectDetails(taskItem.projectId);
                    const avgDuration = taskItem.duration / taskItem.sessions;

                    return (
                      <tr key={taskItem.key} className="hover:bg-bg-dark/10 transition-colors">
                        <td className="py-3 pr-4 text-text-white font-bold max-w-[200px] truncate">
                          {taskItem.description}
                        </td>
                        <td className="py-3 pr-4 truncate">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full inline-block"
                              style={{ backgroundColor: projDetails.color }}
                            />
                            <span>{projDetails.name}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-center font-mono font-bold text-text-white">
                          {taskItem.sessions}
                        </td>
                        <td className="py-3 pr-4 text-right font-mono text-text-white">
                          {formatDetailedTime(avgDuration)}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-mono font-black text-brand-cyan tracking-wide">
                              {formatDetailedTime(taskItem.duration)}
                            </span>
                            <span className="text-[10px] text-text-dim">
                              {Math.round(taskItem.percentage)}% of total
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
