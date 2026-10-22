import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar, 
  Flame, 
  ArrowRight, 
  Plus, 
  Timer, 
  BrainCircuit,
  ChevronRight
} from 'lucide-react';

export default function DashboardView({ 
  studentProfile, 
  tasks, 
  onToggleTask, 
  upcomingAssignments, 
  onNavigateTab, 
  onOpenNewTask, 
  onSendAIQuery,
  quickPromptSuggestions
}) {
  const [aiInputValue, setAiInputValue] = useState('');

  const handleAiSubmit = (e) => {
    e.preventDefault();
    if (!aiInputValue.trim()) return;
    onSendAIQuery(aiInputValue.trim());
    setAiInputValue('');
  };

  const handleSuggestionClick = (prompt) => {
    onSendAIQuery(prompt);
  };

  // Filter tasks for today
  const todayTasks = tasks.slice(0, 4);
  const completedToday = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedToday / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Welcome Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-2xl p-6 sm:p-8 text-white shadow-sm relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-purple-500/20 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-medium text-blue-100 mb-3 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Simulated Alexa+ Experience</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
              Welcome back, {studentProfile.name.split(' ')[0]}! 🎓
            </h1>
            <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed">
              You have <span className="font-semibold text-white">{tasks.filter(t => !t.completed).length} pending tasks</span> and your <span className="font-semibold text-white">CS 301 Problem Set</span> is due tomorrow. Ask CampusMate to summarize lectures, organize your study session, or clear concepts.
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl px-4 py-3 text-center min-w-[90px]">
              <div className="flex items-center justify-center gap-1 text-amber-300 font-bold text-lg">
                <Flame className="w-5 h-5 fill-amber-300" />
                <span>{studentProfile.streakDays}d</span>
              </div>
              <div className="text-[11px] text-blue-100 font-medium">Study Streak</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl px-4 py-3 text-center min-w-[90px]">
              <div className="text-lg font-bold text-white">
                {studentProfile.gpa}
              </div>
              <div className="text-[11px] text-blue-100 font-medium">Cumulative GPA</div>
            </div>
          </div>
        </div>

        {/* 2. Embedded AI Assistant Input Bar */}
        <div className="mt-6 pt-5 border-t border-white/15">
          <form onSubmit={handleAiSubmit} className="relative flex items-center">
            <div className="absolute left-4 text-purple-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={aiInputValue}
              onChange={(e) => setAiInputValue(e.target.value)}
              placeholder="Ask CampusMate: 'How does Dijkstra work?', 'Plan my evening study schedule', 'Summarize homework'..."
              className="w-full pl-12 pr-28 py-3.5 rounded-xl bg-white/95 text-slate-800 placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-inner"
            />
            <button
              type="submit"
              className="absolute right-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <span>Ask AI</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Prompt chips */}
          <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 text-xs text-blue-100">
            <span className="text-[11px] font-semibold text-blue-200 uppercase tracking-wide shrink-0">
              Suggestions:
            </span>
            {quickPromptSuggestions.slice(0, 3).map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSuggestionClick(item.prompt)}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white border border-white/15 transition-colors truncate max-w-xs"
              >
                {item.prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Quick Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={onOpenNewTask}
          className="bg-white hover:bg-blue-50/50 p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3 transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600">New Task</div>
            <div className="text-[11px] text-slate-500">Add assignment or chore</div>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('planner')}
          className="bg-white hover:bg-purple-50/50 p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3 transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 group-hover:text-purple-600">Study Session</div>
            <div className="text-[11px] text-slate-500">Pomodoro focus block</div>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('ask-ai')}
          className="bg-white hover:bg-indigo-50/50 p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3 transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">Ask AI Copilot</div>
            <div className="text-[11px] text-slate-500">Conversational tutor</div>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('timetable')}
          className="bg-white hover:bg-emerald-50/50 p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3 transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-600">Class Timetable</div>
            <div className="text-[11px] text-slate-500">Schedule & room codes</div>
          </div>
        </button>
      </div>

      {/* 4. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Today's Tasks & Upcoming Assignments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Tasks */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Today's Academic Tasks</h2>
                <p className="text-xs text-slate-500 font-medium">
                  {completedToday} of {totalTasks} tasks completed ({completionRate}%)
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('tasks')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>View all</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Task List */}
            <div className="space-y-2.5">
              {todayTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onToggleTask(task.id)}
                  className={`flex items-start sm:items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                    task.completed 
                      ? 'bg-slate-50/60 border-slate-200/60 opacity-75' 
                      : 'bg-white border-slate-200/90 hover:border-blue-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      className="mt-0.5 sm:mt-0 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-blue-600 fill-blue-50" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 hover:text-blue-600" />
                      )}
                    </button>
                    <div>
                      <p className={`text-sm font-semibold ${
                        task.completed ? 'line-through text-slate-400' : 'text-slate-800'
                      }`}>
                        {task.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {task.courseCode}
                        </span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {task.dueDate}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          • ~{task.estimatedMinutes}m
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 ml-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      task.priority === 'High' 
                        ? 'bg-rose-50 text-rose-700 border border-rose-200/70' 
                        : task.priority === 'Medium'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200/70'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick add prompt within card */}
            <button
              onClick={onOpenNewTask}
              className="mt-4 w-full py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/30 text-xs font-semibold text-slate-600 hover:text-blue-600 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add another task for today</span>
            </button>
          </div>

          {/* Upcoming Assignments & Deliverables */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Upcoming Major Assignments</h2>
                <p className="text-xs text-slate-500 font-medium">Syllabus deadlines & exam milestones</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                {upcomingAssignments.length} Deadlines
              </span>
            </div>

            <div className="space-y-3">
              {upcomingAssignments.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-colors bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {item.course.split(' - ')[0]}
                      </span>
                      <h3 className="text-sm font-semibold text-slate-900">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500">
                      {item.course} • <span className="font-medium text-slate-700">{item.weight}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 sm:self-center self-end">
                    <div className="text-right">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full inline-block ${
                        item.urgency === 'urgent'
                          ? 'bg-rose-100 text-rose-700'
                          : item.urgency === 'moderate'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {item.dueIn}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{item.dueDate}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 col): Study Progress & Course Breakdown */}
        <div className="space-y-6">
          {/* Study Progress Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Study Progress</h2>
              <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200/60">
                This Week
              </span>
            </div>

            {/* Circular / Bar Gauge */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200/60">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-2xl font-extrabold text-slate-900">
                  {studentProfile.studyHoursThisWeek} <span className="text-xs font-normal text-slate-500">hours</span>
                </span>
                <span className="text-xs font-bold text-blue-700">
                  Target: {studentProfile.weeklyTargetHours}h (74%)
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 h-full rounded-full transition-all duration-700"
                  style={{ width: '74%' }}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">
                6.5 hours remaining to hit your weekly target of 25 hours.
              </p>
            </div>

            {/* Subject Distribution */}
            <div className="mt-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Hours by Course
              </h3>
              
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-700">CS 301 - Algorithms</span>
                  <span className="font-semibold text-slate-900">8.0 hrs (43%)</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: '43%' }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-700">MATH 240 - Calculus III</span>
                  <span className="font-semibold text-slate-900">5.5 hrs (30%)</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-600 h-full rounded-full" style={{ width: '30%' }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-700">CS 340 - Database Systems</span>
                  <span className="font-semibold text-slate-900">3.0 hrs (16%)</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: '16%' }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-700">PHIL 210 - Tech Ethics</span>
                  <span className="font-semibold text-slate-900">2.0 hrs (11%)</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '11%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Browser voice feature spotlight */}
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 text-white rounded-2xl p-5 shadow-xs border border-indigo-950">
            <div className="flex items-center gap-2 mb-2 text-purple-300 text-xs font-bold">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Browser Voice Demo</span>
            </div>
            <h3 className="text-sm font-bold mb-1.5 text-white">Voice Academic Queries</h3>
            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              "Alexa, ask CampusMate what assignments I have due tomorrow and when my first lecture starts."
            </p>
            <button
              onClick={() => onNavigateTab('ask-ai')}
              className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/20 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Try Browser Voice Mode</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
