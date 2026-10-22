import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Plus, 
  Search, 
  Trash2, 
  CheckSquare
} from 'lucide-react';

export default function TasksView({ 
  tasks, 
  onToggleTask, 
  onDeleteTask, 
  onOpenNewTask,
  isLoading = false,
  errorMessage = null,
  backendConnected = false
}) {
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'completed' | 'high'
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');

  const courses = ['all', ...new Set(tasks.map(t => t.courseCode || t.course))];

  const filteredTasks = tasks.filter(task => {
    // Search filter
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.course.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    let matchesStatus = true;
    if (filter === 'pending') matchesStatus = !task.completed;
    if (filter === 'completed') matchesStatus = task.completed;
    if (filter === 'high') matchesStatus = task.priority === 'High';

    // Course filter
    const courseMatchCode = task.courseCode || task.course;
    const matchesCourse = courseFilter === 'all' || courseMatchCode === courseFilter;

    return matchesSearch && matchesStatus && matchesCourse;
  });

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Controls Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Task Management</h2>
            {backendConnected && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                SQLite Synced
              </span>
            )}
            {errorMessage && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                {errorMessage}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {completedCount} of {tasks.length} tasks completed • Track assignments and exam study items
          </p>
        </div>

        <button
          onClick={onOpenNewTask}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Task</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks by title or course..."
            className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <div className="flex items-center p-1 bg-white rounded-xl border border-slate-200">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filter === 'all' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({tasks.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filter === 'pending' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending ({tasks.filter(t => !t.completed).length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filter === 'completed' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed ({completedCount})
            </button>
            <button
              onClick={() => setFilter('high')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filter === 'high' ? 'bg-rose-50 text-rose-700' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              High Priority
            </button>
          </div>

          {/* Course select */}
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none"
          >
            {courses.map(c => (
              <option key={c} value={c}>{c === 'all' ? 'All Courses' : c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Task Cards List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">Loading academic tasks...</p>
            <p className="text-xs text-slate-400 mt-1">Connecting to SQLite database</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center">
            <CheckSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">No tasks match your filter</p>
            <p className="text-xs text-slate-400 mt-1">Try resetting search filters or create a new task.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors group"
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <button
                    onClick={() => onToggleTask(task.id)}
                    className="mt-0.5 sm:mt-0 text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-blue-600 fill-blue-50" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 hover:text-blue-600" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold truncate ${
                      task.completed ? 'line-through text-slate-400' : 'text-slate-900'
                    }`}>
                      {task.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                        {task.courseCode}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Due {task.dueDate}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Est: {task.estimatedMinutes} mins
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    task.priority === 'High' 
                      ? 'bg-rose-50 text-rose-700 border border-rose-200/70' 
                      : task.priority === 'Medium'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200/70'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {task.priority}
                  </span>

                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
