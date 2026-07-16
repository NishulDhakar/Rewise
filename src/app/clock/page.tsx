'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  Play,
  Square,
  Plus,
  Trash2,
  FolderPlus,
  Calendar,
  Edit2,
  Clock,
  ArrowLeft,
  Tag,
  ChevronDown,
  ChevronRight,
  Check,
  MoreVertical,
  X,
  Search,
  Star,
  BookOpen
} from 'lucide-react';

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

interface TimerState {
  startTime: string | null;
  description: string;
  projectId: string | null;
  isRunning: boolean;
}

// ==========================================
// Default Setup Data
// ==========================================
const DEFAULT_PROJECTS: Project[] = [];

const PRESET_COLORS = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#f97316', // Orange
  '#a16207', // Amber/Brown
  '#10b981', // Green
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#6366f1', // Indigo
  '#f43f5e'  // Rose
];

export default function ClockPage() {
  // ==========================================
  // Component States
  // ==========================================
  const [mounted, setMounted] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [timer, setTimer] = useState<TimerState>({
    startTime: null,
    description: '',
    projectId: null,
    isRunning: false
  });

  // Current inputs for running timer
  const [descriptionInput, setDescriptionInput] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [tickerSeconds, setTickerSeconds] = useState(0);

  // Dropdowns / Modals UI state
  const [isProjDropdownOpen, setIsProjDropdownOpen] = useState(false);
  const [projSearchQuery, setProjSearchQuery] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjColor, setNewProjColor] = useState(PRESET_COLORS[0]);

  // Options menu for individual rows
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Expanded state for grouped entries
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Editing Entry modal state
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editProjId, setEditProjId] = useState<string | null>(null);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editProjDropdownOpen, setEditProjDropdownOpen] = useState(false);

  // Ref to close menus when clicking outside
  const projDropdownRef = useRef<HTMLDivElement>(null);
  const rowMenuRef = useRef<HTMLDivElement>(null);

  // ==========================================
  // Client Loading (Hydration mismatch prevention)
  // ==========================================
  useEffect(() => {
    setMounted(true);

    // Get Projects
    const storedProjects = localStorage.getItem('rewise_projects');
    if (storedProjects) {
      setProjects(JSON.parse(storedProjects));
    } else {
      setProjects(DEFAULT_PROJECTS);
      localStorage.setItem('rewise_projects', JSON.stringify(DEFAULT_PROJECTS));
    }

    // Get Time Entries
    const storedEntries = localStorage.getItem('rewise_time_entries');
    if (storedEntries) {
      setTimeEntries(JSON.parse(storedEntries));
    }

    // Get Active Timer
    const storedTimer = localStorage.getItem('rewise_active_timer');
    if (storedTimer) {
      const parsedTimer: TimerState = JSON.parse(storedTimer);
      setTimer(parsedTimer);
      if (parsedTimer.isRunning && parsedTimer.startTime) {
        setDescriptionInput(parsedTimer.description);
        setSelectedProjectId(parsedTimer.projectId);
      }
    }
  }, []);

  // Sync projects to local storage
  const saveProjects = (updatedProjects: Project[]) => {
    setProjects(updatedProjects);
    localStorage.setItem('rewise_projects', JSON.stringify(updatedProjects));
  };

  // Sync entries to local storage
  const saveTimeEntries = (updatedEntries: TimeEntry[]) => {
    setTimeEntries(updatedEntries);
    localStorage.setItem('rewise_time_entries', JSON.stringify(updatedEntries));
  };

  // Sync active timer to local storage
  const saveActiveTimer = (updatedTimer: TimerState) => {
    setTimer(updatedTimer);
    localStorage.setItem('rewise_active_timer', JSON.stringify(updatedTimer));
  };

  // ==========================================
  // Click outside handling
  // ==========================================
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (projDropdownRef.current && !projDropdownRef.current.contains(event.target as Node)) {
        setIsProjDropdownOpen(false);
      }
      if (rowMenuRef.current && !rowMenuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ==========================================
  // Timer Live Counter (Ticker)
  // ==========================================
  useEffect(() => {
    let intervalId: any = null;
    if (timer.isRunning && timer.startTime) {
      const updateTicker = () => {
        const elapsed = Math.floor((Date.now() - new Date(timer.startTime!).getTime()) / 1000);
        setTickerSeconds(elapsed >= 0 ? elapsed : 0);
      };
      updateTicker();
      intervalId = setInterval(updateTicker, 1000);
    } else {
      setTickerSeconds(0);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [timer.isRunning, timer.startTime]);

  // ==========================================
  // Handlers - Clock Timer
  // ==========================================
  const handleStartTimer = () => {
    const newTimer: TimerState = {
      startTime: new Date().toISOString(),
      description: descriptionInput.trim(),
      projectId: selectedProjectId,
      isRunning: true
    };
    saveActiveTimer(newTimer);
  };

  const handleStopTimer = () => {
    if (!timer.startTime) return;

    const endTime = new Date().toISOString();
    const duration = Math.max(
      1,
      Math.floor((new Date(endTime).getTime() - new Date(timer.startTime).getTime()) / 1000)
    );

    const newEntry: TimeEntry = {
      id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      description: descriptionInput.trim() || 'Add description',
      projectId: selectedProjectId,
      startTime: timer.startTime,
      endTime: endTime,
      duration: duration
    };

    const updated = [newEntry, ...timeEntries];
    saveTimeEntries(updated);

    // Reset active timer state
    const resetTimer: TimerState = {
      startTime: null,
      description: '',
      projectId: null,
      isRunning: false
    };
    saveActiveTimer(resetTimer);
    setDescriptionInput('');
    setSelectedProjectId(null);
  };

  const handleRestartEntry = (desc: string, projId: string | null) => {
    // If timer is already running, stop it first to save current progress
    if (timer.isRunning) {
      handleStopTimer();
    }

    const newTimer: TimerState = {
      startTime: new Date().toISOString(),
      description: desc === 'Add description' ? '' : desc,
      projectId: projId,
      isRunning: true
    };
    setDescriptionInput(newTimer.description);
    setSelectedProjectId(newTimer.projectId);
    saveActiveTimer(newTimer);
  };

  // ==========================================
  // Handlers - Projects Management
  // ==========================================
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;

    const newProj: Project = {
      id: `proj-${Date.now()}`,
      name: newProjName.trim(),
      color: newProjColor,
      isFavorite: false
    };

    const updated = [...projects, newProj];
    saveProjects(updated);

    // Auto-select the newly created project
    setSelectedProjectId(newProj.id);
    setNewProjName('');
    setIsCreatingProject(false);
    setIsProjDropdownOpen(false);
  };

  const toggleFavoriteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid selecting the project
    const updated = projects.map(p => {
      if (p.id === id) {
        return { ...p, isFavorite: !p.isFavorite };
      }
      return p;
    });
    saveProjects(updated);
  };

  // Filtered projects list based on search query
  const filteredProjects = useMemo(() => {
    const query = projSearchQuery.toLowerCase().trim();
    let list = projects;
    if (query) {
      list = projects.filter(p => p.name.toLowerCase().includes(query));
    }
    // Sort: favorites first, then alphabetically
    return [...list].sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [projects, projSearchQuery]);

  // ==========================================
  // Handlers - Entries Actions
  // ==========================================
  const handleDeleteEntry = (id: string) => {
    const updated = timeEntries.filter(e => e.id !== id);
    saveTimeEntries(updated);
    setActiveMenuId(null);
  };

  const handleDeleteGroup = (key: string, dateLabel: string) => {
    // Delete all occurrences matching description and project on that day
    const updated = timeEntries.filter(entry => {
      const label = getDayLabel(entry.startTime);
      if (label !== dateLabel) return true;
      const entryKey = `${entry.description || 'Add description'}-${entry.projectId || 'no-project'}`;
      return entryKey !== key;
    });
    saveTimeEntries(updated);
    setActiveMenuId(null);
  };

  // ==========================================
  // Handlers - Edit Modal
  // ==========================================
  const openEditModal = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setEditDesc(entry.description === 'Add description' ? '' : entry.description);
    setEditProjId(entry.projectId);
    
    // Format ISO string to datetime-local format (YYYY-MM-DDTHH:MM)
    const localStart = new Date(entry.startTime);
    const tzOffset = localStart.getTimezoneOffset() * 60000; // offset in milliseconds
    const formattedStart = new Date(localStart.getTime() - tzOffset).toISOString().slice(0, 16);
    
    const localEnd = new Date(entry.endTime);
    const formattedEnd = new Date(localEnd.getTime() - tzOffset).toISOString().slice(0, 16);

    setEditStartTime(formattedStart);
    setEditEndTime(formattedEnd);
    setActiveMenuId(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    const start = new Date(editStartTime);
    const end = new Date(editEndTime);

    if (end.getTime() < start.getTime()) {
      alert('End time cannot be earlier than start time.');
      return;
    }

    const duration = Math.max(1, Math.floor((end.getTime() - start.getTime()) / 1000));

    const updatedEntries = timeEntries.map(entry => {
      if (entry.id === editingEntry.id) {
        return {
          ...entry,
          description: editDesc.trim() || 'Add description',
          projectId: editProjId,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          duration: duration
        };
      }
      return entry;
    });

    saveTimeEntries(updatedEntries);
    setEditingEntry(null);
  };

  // ==========================================
  // Helper Utilities
  // ==========================================
  const formatDuration = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const pad = (num: number) => String(num).padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  const formatTimeRange = (startISO: string, endISO: string) => {
    try {
      const start = new Date(startISO);
      const end = new Date(endISO);
      const pad = (num: number) => String(num).padStart(2, '0');
      return `${pad(start.getHours())}:${pad(start.getMinutes())} - ${pad(end.getHours())}:${pad(end.getMinutes())}`;
    } catch {
      return '';
    }
  };

  const getDayLabel = (dateStr: string) => {
    try {
      const entryDate = new Date(dateStr);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      if (entryDate.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (entryDate.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      } else {
        const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
        return entryDate.toLocaleDateString('en-US', options);
      }
    } catch {
      return 'Unknown Date';
    }
  };

  const getProjectDetails = (projId: string | null) => {
    const defaultProj = { name: 'No Project', color: '#64748b' };
    if (!projId) return defaultProj;
    return projects.find(p => p.id === projId) || defaultProj;
  };

  // ==========================================
  // Grouping Logic
  // ==========================================
  // Groups are created by Date Label.
  // Within each Date Label, identical description + project rows are grouped together.
  const groupedData = useMemo(() => {
    // 1. Group by Date Label
    const dateGroups: Record<string, TimeEntry[]> = {};
    timeEntries.forEach(entry => {
      const label = getDayLabel(entry.startTime);
      if (!dateGroups[label]) {
        dateGroups[label] = [];
      }
      dateGroups[label].push(entry);
    });

    // 2. For each day, group identical entries
    const result: {
      dateLabel: string;
      totalDuration: number;
      groups: {
        key: string;
        description: string;
        projectId: string | null;
        totalDuration: number;
        entries: TimeEntry[];
      }[];
    }[] = [];

    Object.keys(dateGroups).forEach(dateLabel => {
      const dayEntries = dateGroups[dateLabel];
      const dayTotalDuration = dayEntries.reduce((sum, e) => sum + e.duration, 0);

      const itemsMap: Record<string, TimeEntry[]> = {};
      dayEntries.forEach(entry => {
        const key = `${entry.description || 'Add description'}-${entry.projectId || 'no-project'}`;
        if (!itemsMap[key]) {
          itemsMap[key] = [];
        }
        itemsMap[key].push(entry);
      });

      const dayGroups = Object.keys(itemsMap).map(key => {
        const list = itemsMap[key];
        // Sort entries within group: newest first
        const sortedList = [...list].sort(
          (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );
        return {
          key,
          description: sortedList[0].description,
          projectId: sortedList[0].projectId,
          totalDuration: sortedList.reduce((sum, e) => sum + e.duration, 0),
          entries: sortedList
        };
      });

      // Sort dayGroups so the newest entries group are on top
      dayGroups.sort((a, b) => {
        const aTime = new Date(a.entries[0].startTime).getTime();
        const bTime = new Date(b.entries[0].startTime).getTime();
        return bTime - aTime;
      });

      result.push({
        dateLabel,
        totalDuration: dayTotalDuration,
        groups: dayGroups
      });
    });

    // Sort dates descending (Today, Yesterday, then descending calendar dates)
    const dateOrderScore = (label: string) => {
      if (label === 'Today') return 3;
      if (label === 'Yesterday') return 2;
      // Try to parse day description (e.g. "Sat, Jul 11")
      try {
        const d = new Date(label + `, ${new Date().getFullYear()}`);
        return isNaN(d.getTime()) ? 0 : d.getTime() / 1000000;
      } catch {
        return 0;
      }
    };

    result.sort((a, b) => dateOrderScore(b.dateLabel) - dateOrderScore(a.dateLabel));

    return result;
  }, [timeEntries]);

  // Overall total tracked time
  const totalTrackedTime = useMemo(() => {
    return timeEntries.reduce((sum, e) => sum + e.duration, 0);
  }, [timeEntries]);

  // Toggle group expanded state
  const toggleGroupExpand = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Render project dot or tag selector helper
  const selectedProj = getProjectDetails(selectedProjectId);

  if (!mounted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-bg-dark text-text-gray font-sans h-screen">
        <Clock className="w-8 h-8 animate-pulse text-brand-cyan mb-2" />
        <span className="text-xs font-bold tracking-widest uppercase">Initializing Time Tracker...</span>
      </div>
    );
  }

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 flex flex-col min-h-screen">
      {/* Header Banner */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-border-subtle pb-6">
        <div>
          <Link href="/">
            <h1 className="text-3xl font-black tracking-widest text-brand-cyan flex items-center gap-2 hover:opacity-85 transition-opacity">
              REWISE
            </h1>
          </Link>
          <p className="text-xs text-text-gray tracking-wider mt-1 font-sans">
            SPACED REPETITION TASK MANAGER
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs font-sans text-text-gray">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle bg-card-dark hover:border-brand-cyan hover:text-brand-cyan transition-all text-xs glow-btn font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </Link>
          <Link
            href="/time-spent"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle bg-card-dark hover:border-brand-cyan hover:text-brand-cyan transition-all text-xs glow-btn font-semibold"
          >
            <Clock className="w-3.5 h-3.5" />
            Time Spent
          </Link>
        </div>
      </header>

      {/* ==========================================
          TIMER BAR (Top Panel)
          ========================================== */}
      <div className="glow-card bg-card-dark border border-border-subtle rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 mb-8 relative">
        {/* Left: Description Input */}
        <div className="flex-1 w-full flex items-center gap-2 min-w-0">
          <input
            type="text"
            placeholder="What are you working on?"
            value={descriptionInput}
            onChange={e => setDescriptionInput(e.target.value)}
            className="w-full bg-transparent border-0 placeholder:text-text-dim text-sm focus:outline-none focus:ring-0 text-text-white font-sans"
          />
        </div>

        {/* Right: Controls (Project, Time, Action Button) */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-4 w-full md:w-auto">
          
          {/* Project Picker Trigger */}
          <div className="relative" ref={projDropdownRef}>
            <button
              onClick={() => setIsProjDropdownOpen(!isProjDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-subtle hover:border-border-glow bg-bg-dark/40 hover:bg-bg-dark transition-all text-xs text-text-gray max-w-[180px] truncate cursor-pointer"
            >
              {selectedProjectId ? (
                <>
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                    style={{ backgroundColor: selectedProj.color }}
                  />
                  <span className="truncate text-text-white font-semibold">{selectedProj.name}</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 text-brand-cyan shrink-0" />
                  <span className="font-semibold text-brand-cyan">Project</span>
                </>
              )}
              <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
            </button>

            {/* Project Picker Dropdown */}
            {isProjDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 z-30 w-72 bg-card-dark border border-border-glow rounded-xl p-4 shadow-2xl animate-fadeIn text-text-white font-sans">
                {!isCreatingProject ? (
                  <>
                    {/* Search Field */}
                    <div className="relative mb-3">
                      <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-text-dim" />
                      <input
                        type="text"
                        placeholder="Search Project or Client"
                        value={projSearchQuery}
                        onChange={e => setProjSearchQuery(e.target.value)}
                        className="w-full bg-bg-dark border border-border-subtle rounded-lg pl-8 pr-3 py-2 text-xs placeholder:text-text-dim text-text-white focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
                      />
                    </div>

                    {/* Project List */}
                    <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                      <div className="text-[10px] text-text-dim font-bold tracking-widest uppercase mb-1">
                        Projects
                      </div>
                      
                      {filteredProjects.length === 0 ? (
                        <div className="text-xs text-text-dim py-3 text-center">No projects found</div>
                      ) : (
                        filteredProjects.map(proj => (
                          <button
                            key={proj.id}
                            onClick={() => {
                              setSelectedProjectId(proj.id);
                              setIsProjDropdownOpen(false);
                            }}
                            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-bg-dark text-left text-xs text-text-gray hover:text-white transition-all group cursor-pointer"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: proj.color }}
                              />
                              <span className="truncate">{proj.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {selectedProjectId === proj.id && (
                                <Check className="w-3.5 h-3.5 text-brand-green" />
                              )}
                              <button
                                type="button"
                                onClick={(e) => toggleFavoriteProject(proj.id, e)}
                                className={`opacity-0 group-hover:opacity-100 hover:scale-110 transition-all cursor-pointer ${
                                  proj.isFavorite ? 'opacity-100 text-amber-400' : 'text-text-dim hover:text-amber-400'
                                }`}
                              >
                                <Star className="w-3.5 h-3.5 fill-current" />
                              </button>
                            </div>
                          </button>
                        ))
                      )}
                    </div>

                    {/* Create Action */}
                    <div className="border-t border-border-subtle mt-3 pt-3">
                      <button
                        onClick={() => setIsCreatingProject(true)}
                        className="w-full flex items-center justify-center gap-1.5 p-2 rounded-lg border border-dashed border-border-subtle hover:border-brand-cyan text-brand-cyan hover:bg-brand-cyan/5 text-xs font-bold transition-all cursor-pointer"
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                        Create new Project
                      </button>
                    </div>
                  </>
                ) : (
                  /* Create Project Sub-form */
                  <form onSubmit={handleCreateProject} className="space-y-3">
                    <div className="text-xs font-bold text-brand-cyan uppercase tracking-wider">
                      Create new Project
                    </div>
                    <input
                      type="text"
                      placeholder="Project name..."
                      value={newProjName}
                      onChange={e => setNewProjName(e.target.value)}
                      className="w-full bg-bg-dark border border-border-subtle rounded-lg px-3 py-1.5 text-xs text-text-white placeholder:text-text-dim focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
                      required
                      autoFocus
                    />
                    
                    {/* Colors swatches */}
                    <div>
                      <div className="text-[10px] text-text-dim mb-1 uppercase tracking-wider">Select Color</div>
                      <div className="grid grid-cols-5 gap-2">
                        {PRESET_COLORS.map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setNewProjColor(color)}
                            className="w-5 h-5 rounded-full relative flex items-center justify-center hover:scale-110 transition-all cursor-pointer"
                            style={{ backgroundColor: color }}
                          >
                            {newProjColor === color && (
                              <Check className="w-3 h-3 text-white drop-shadow-md" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end border-t border-border-subtle pt-3">
                      <button
                        type="button"
                        onClick={() => setIsCreatingProject(false)}
                        className="px-2.5 py-1.5 rounded-lg border border-border-subtle hover:bg-bg-dark text-[10px] font-bold text-text-gray cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-2.5 py-1.5 rounded-lg bg-brand-cyan text-bg-dark hover:bg-cyan-400 text-[10px] font-bold cursor-pointer"
                      >
                        Create
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          <span className="hidden md:inline h-4 w-px bg-border-subtle" />

          {/* Running Clock Duration Display */}
          <div className="font-doto text-xl font-bold tracking-widest text-text-white min-w-[90px] text-right">
            {formatDuration(timer.isRunning ? tickerSeconds : 0)}
          </div>

          {/* Action Button: START / STOP */}
          {timer.isRunning ? (
            <button
              onClick={handleStopTimer}
              className="glow-btn px-6 py-2 rounded-lg bg-red-500 hover:bg-red-400 text-white text-xs font-bold font-sans tracking-widest flex items-center gap-1.5 transition-all cursor-pointer">
              <Square className="w-3.5 h-3.5 fill-current" />
              STOP
            </button>
          ) : (
            <button
              onClick={handleStartTimer}
              className="glow-btn px-6 py-2 rounded-lg bg-brand-cyan hover:bg-cyan-400 text-bg-dark text-xs font-bold font-sans tracking-widest flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              START
            </button>
          )}

        </div>
      </div>

      {/* ==========================================
          TRACKED LIST SECTION
          ========================================== */}
      <section className="glow-card bg-card-dark rounded-xl p-6 flex flex-col flex-1">
        {/* List Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6 border-b border-border-subtle pb-4">
          <h2 className="text-lg font-bold tracking-wider">
            Time Entries
          </h2>
          <div className="flex items-center gap-2 text-xs text-text-gray font-sans">
            <span>Total Tracked:</span>
            <span className="font-doto font-bold text-brand-green tracking-wider text-sm">
              {formatDuration(totalTrackedTime)}
            </span>
          </div>
        </div>

        {/* Entries Loop */}
        {groupedData.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-text-dim">
            <Clock className="w-12 h-12 stroke-[1] mb-3 text-text-dim animate-pulse" />
            <h3 className="text-sm font-bold tracking-widest uppercase">No time tracked yet</h3>
            <p className="text-xs font-sans mt-1 text-text-gray/60 max-w-[280px]">
              Use the bar above to describe your task and start clocking your progress!
            </p>
          </div>
        ) : (
          <div className="space-y-8 overflow-y-auto max-h-[60vh] pr-1">
            {groupedData.map(day => (
              <div key={day.dateLabel} className="space-y-3">
                {/* Day Header Row */}
                <div className="flex justify-between items-center bg-bg-dark/40 border border-border-subtle/50 px-4 py-2.5 rounded-lg font-sans text-xs">
                  <span className="font-bold text-text-white tracking-wider">{day.dateLabel}</span>
                  <div className="flex items-center gap-1.5 font-bold text-text-gray">
                    <span>Total:</span>
                    <span className="font-doto tracking-wider text-text-white">
                      {formatDuration(day.totalDuration)}
                    </span>
                  </div>
                </div>

                {/* Day Groups List */}
                <div className="space-y-2">
                  {day.groups.map(group => {
                    const isGrouped = group.entries.length > 1;
                    const groupKey = `${day.dateLabel}-${group.key}`;
                    const isExpanded = !!expandedGroups[groupKey];
                    const projDetails = getProjectDetails(group.projectId);

                    return (
                      <div
                        key={groupKey}
                        className={`border border-border-subtle rounded-lg bg-bg-dark/20 overflow-hidden transition-all ${
                          isExpanded ? 'border-border-glow' : ''
                        }`}
                      >
                        {/* Main Group Header Row */}
                        <div
                          onClick={() => isGrouped && toggleGroupExpand(groupKey)}
                          className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 gap-3 transition-colors ${
                            isGrouped ? 'cursor-pointer hover:bg-bg-dark/40' : ''
                          }`}
                        >
                          {/* Left Details */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {/* Occurrences count badge (Toggl Style) */}
                            {isGrouped ? (
                              <div
                                className="w-6 h-6 rounded border flex items-center justify-center font-doto text-[10px] font-bold select-none shrink-0"
                                style={{
                                  backgroundColor: `${projDetails.color}15`,
                                  color: projDetails.color,
                                  borderColor: `${projDetails.color}35`
                                }}
                              >
                                {group.entries.length}
                              </div>
                            ) : (
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: projDetails.color }}
                              />
                            )}

                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-bold text-text-white truncate font-sans">
                                {group.description}
                              </h4>
                              {/* Inline project indicator for grouped */}
                              {isGrouped && (
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-text-gray mt-0.5">
                                  <span
                                    className="w-1.5 h-1.5 rounded-full inline-block"
                                    style={{ backgroundColor: projDetails.color }}
                                  />
                                  {projDetails.name}
                                </span>
                              )}
                              {/* Non-grouped Project display */}
                              {!isGrouped && group.projectId && (
                                <span className="inline-block text-[10px] font-semibold text-text-gray mt-0.5 font-sans">
                                  {projDetails.name}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right Controls */}
                          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto shrink-0 border-t border-border-subtle/30 sm:border-0 pt-2 sm:pt-0">
                            
                            {/* Show details toggler icon (chevron) */}
                            {isGrouped && (
                              <span className="text-[10px] text-text-dim flex items-center gap-1 font-bold font-sans">
                                {isExpanded ? (
                                  <>
                                    Collapse <ChevronDown className="w-3.5 h-3.5" />
                                  </>
                                ) : (
                                  <>
                                    Expand <ChevronRight className="w-3.5 h-3.5" />
                                  </>
                                )}
                              </span>
                            )}

                            {/* Interval Range Display */}
                            <div className="text-[10px] text-text-dim font-sans flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {isGrouped
                                  ? `${group.entries.length} segments`
                                  : formatTimeRange(group.entries[0].startTime, group.entries[0].endTime)}
                              </span>
                            </div>

                            {/* Group Duration */}
                            <div className="font-doto text-xs font-bold text-text-white tracking-widest min-w-[70px] text-right">
                              {formatDuration(group.totalDuration)}
                            </div>

                            {/* Action Buttons for non-grouped, or group operations */}
                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                              
                              {/* PLAY / RESTART TIMER */}
                              <button
                                onClick={() => handleRestartEntry(group.description, group.projectId)}
                                className="p-1.5 rounded-lg border border-border-subtle hover:border-brand-green text-text-dim hover:text-brand-green transition-all cursor-pointer"
                                title="Restart tracking"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                              </button>

                              {/* Ellipsis Options Trigger */}
                              <div className="relative">
                                <button
                                  onClick={() => setActiveMenuId(activeMenuId === groupKey ? null : groupKey)}
                                  className="p-1.5 rounded-lg border border-border-subtle hover:border-brand-cyan text-text-dim hover:text-brand-cyan transition-all cursor-pointer"
                                  title="Actions"
                                >
                                  <MoreVertical className="w-3.5 h-3.5" />
                                </button>

                                {/* Dropdown Option Actions (edit, delete) */}
                                {activeMenuId === groupKey && (
                                  <div
                                    ref={rowMenuRef}
                                    className="absolute right-0 top-full mt-1.5 z-20 w-36 bg-card-dark border border-border-glow rounded-lg py-1 shadow-xl text-xs text-text-gray font-sans"
                                  >
                                    {!isGrouped ? (
                                      <>
                                        <button
                                          onClick={() => openEditModal(group.entries[0])}
                                          className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-bg-dark hover:text-white cursor-pointer"
                                        >
                                          <Edit2 className="w-3.5 h-3.5 text-brand-cyan" />
                                          Edit Entry
                                        </button>
                                        <button
                                          onClick={() => handleDeleteEntry(group.entries[0].id)}
                                          className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-bg-dark hover:text-red-400 border-t border-border-subtle cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                          Delete
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <div className="px-3 py-1 text-[9px] font-bold text-text-dim uppercase tracking-wider">
                                          Group Action
                                        </div>
                                        <button
                                          onClick={() => handleDeleteGroup(group.key, day.dateLabel)}
                                          className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-bg-dark hover:text-red-400 border-t border-border-subtle cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                          Delete All
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>

                            </div>
                          </div>
                        </div>

                        {/* Group occurrences expanded sub-list */}
                        {isGrouped && isExpanded && (
                          <div className="border-t border-border-subtle bg-bg-dark/10 divide-y divide-border-subtle/30 font-sans">
                            {group.entries.map((subEntry) => {
                              return (
                                <div
                                  key={subEntry.id}
                                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 pl-8 gap-3 text-xs"
                                >
                                  {/* Left: Time and description detail */}
                                  <div className="flex items-center gap-3">
                                    <div className="text-[10px] text-text-dim font-sans flex items-center gap-1 bg-bg-dark/30 px-2 py-0.5 rounded border border-border-subtle/50">
                                      <span>{formatTimeRange(subEntry.startTime, subEntry.endTime)}</span>
                                    </div>
                                    <span className="text-[10px] text-text-dim italic">Occurred</span>
                                  </div>

                                  {/* Right: Duration, actions */}
                                  <div className="flex items-center gap-4 ml-auto sm:ml-0 shrink-0">
                                    <div className="font-doto text-[11px] font-semibold text-text-gray tracking-widest">
                                      {formatDuration(subEntry.duration)}
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => openEditModal(subEntry)}
                                        className="p-1.5 rounded hover:bg-bg-dark text-text-dim hover:text-brand-cyan cursor-pointer"
                                        title="Edit segment"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteEntry(subEntry.id)}
                                        className="p-1.5 rounded hover:bg-bg-dark text-text-dim hover:text-red-400 cursor-pointer"
                                        title="Delete segment"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ==========================================
          EDIT ENTRY DIALOG (Modal)
          ========================================== */}
      {editingEntry && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-fadeIn backdrop-blur-sm">
          <div className="bg-card-dark border border-border-glow rounded-xl p-6 max-w-md w-full flex flex-col font-sans text-text-white shadow-2xl relative">
            <div className="flex justify-between items-center mb-5 border-b border-border-subtle pb-3">
              <h3 className="text-sm font-bold tracking-widest text-brand-cyan flex items-center gap-1.5 uppercase">
                <Edit2 className="w-4 h-4" /> Edit Time Entry
              </h3>
              <button
                onClick={() => setEditingEntry(null)}
                className="text-text-dim hover:text-white text-xs border border-border-subtle rounded px-2 py-1 bg-bg-dark/50 cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-[10px] text-text-gray font-bold uppercase tracking-wider">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Describe your work..."
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  className="w-full bg-bg-dark border border-border-subtle rounded-lg px-3 py-2 text-text-white focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
                />
              </div>

              {/* Project Select Custom Dropdown */}
              <div className="space-y-1.5 relative">
                <label className="block text-[10px] text-text-gray font-bold uppercase tracking-wider">
                  Project
                </label>
                <button
                  type="button"
                  onClick={() => setEditProjDropdownOpen(!editProjDropdownOpen)}
                  className="w-full flex items-center justify-between bg-bg-dark border border-border-subtle rounded-lg px-3 py-2 text-left text-text-gray hover:border-border-glow cursor-pointer"
                >
                  <span className="flex items-center gap-2 truncate">
                    {editProjId ? (
                      <>
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                          style={{ backgroundColor: getProjectDetails(editProjId).color }}
                        />
                        <span className="truncate text-text-white font-medium">
                          {getProjectDetails(editProjId).name}
                        </span>
                      </>
                    ) : (
                      <span className="text-text-dim">Select Project (Optional)</span>
                    )}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {editProjDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1.5 z-30 w-full bg-card-dark border border-border-glow rounded-xl p-3 shadow-2xl max-h-40 overflow-y-auto space-y-1 divide-y divide-border-subtle/30">
                    <button
                      type="button"
                      onClick={() => {
                        setEditProjId(null);
                        setEditProjDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 p-2 hover:bg-bg-dark text-left text-text-dim hover:text-white cursor-pointer"
                    >
                      <span className="w-2 h-2 rounded-full bg-slate-500 shrink-0" />
                      <span>No Project</span>
                    </button>
                    {projects.map(proj => (
                      <button
                        key={proj.id}
                        type="button"
                        onClick={() => {
                          setEditProjId(proj.id);
                          setEditProjDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-2 hover:bg-bg-dark text-left hover:text-white transition-all text-text-gray cursor-pointer"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: proj.color }}
                          />
                          <span className="truncate">{proj.name}</span>
                        </span>
                        {editProjId === proj.id && <Check className="w-3.5 h-3.5 text-brand-green" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Start/End Time Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-text-gray font-bold uppercase tracking-wider">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    value={editStartTime}
                    onChange={e => setEditStartTime(e.target.value)}
                    className="w-full bg-bg-dark border border-border-subtle rounded-lg px-3 py-2 text-text-white focus:outline-none focus:border-brand-cyan"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] text-text-gray font-bold uppercase tracking-wider">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    value={editEndTime}
                    onChange={e => setEditEndTime(e.target.value)}
                    className="w-full bg-bg-dark border border-border-subtle rounded-lg px-3 py-2 text-text-white focus:outline-none focus:border-brand-cyan"
                    required
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-2 border-t border-border-subtle pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="px-4 py-2 rounded-lg border border-border-subtle hover:bg-bg-dark text-text-gray font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-brand-cyan text-bg-dark hover:bg-cyan-400 font-bold cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
