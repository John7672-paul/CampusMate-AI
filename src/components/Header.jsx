import React from 'react';
import { 
  Menu, 
  Bell, 
  Plus, 
  Sparkles,
  Mic
} from 'lucide-react';

export default function Header({ 
  activeTab, 
  setMobileOpen, 
  onOpenNewTask, 
  onAskAI 
}) {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return { title: 'Academic Dashboard', subtitle: 'Overview of courses, tasks & AI study assistance' };
      case 'ask-ai':
        return { title: 'Ask AI Copilot', subtitle: 'Browser voice assistant • simulated Alexa+ experience' };
      case 'planner':
        return { title: 'Study Planner', subtitle: 'Time blocks, Pomodoro sessions, and exam preparation' };
      case 'tasks':
        return { title: 'Tasks & Deadlines', subtitle: 'Course deliverables, problem sets, and reminders' };
      case 'timetable':
        return { title: 'Weekly Schedule', subtitle: 'Lecture timings, lab locations, and faculty office hours' };
      case 'settings':
        return { title: 'Workspace Settings', subtitle: 'Browser voice preferences, notifications, and profile' };
      default:
        return { title: 'CampusMate AI', subtitle: 'Smart academic assistant' };
    }
  };

  const { title, subtitle } = getTabTitle();

  return (
    <header className="h-16 px-4 sm:px-6 bg-white border-b border-slate-200/80 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
            {title}
          </h1>
          <p className="hidden sm:block text-[11px] text-slate-500 font-medium">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right: Quick actions, notifications, status */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Browser voice indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium">
          <Mic className="w-3.5 h-3.5 text-blue-600" />
          <span>Browser Voice</span>
        </div>

        {/* Ask AI shortcut button */}
        {activeTab !== 'ask-ai' && (
          <button
            onClick={onAskAI}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-semibold border border-purple-200/70 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        )}

        {/* Quick Add Task */}
        <button
          onClick={onOpenNewTask}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs shadow-blue-500/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Task</span>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button 
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white"></span>
          </button>
        </div>
      </div>
    </header>
  );
}
