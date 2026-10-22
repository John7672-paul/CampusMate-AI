import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CalendarClock, 
  Sparkles
} from 'lucide-react';

export default function StudyPlannerView({ onNavigateTab }) {
  // Pomodoro state
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('focus'); // 'focus' | 'shortBreak' | 'longBreak'

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  const switchMode = (newMode, minutes) => {
    setMode(newMode);
    setIsActive(false);
    setSecondsLeft(minutes * 60);
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
  };

  const plannedBlocks = [
    {
      id: 1,
      time: "02:00 PM - 03:30 PM",
      title: "CS 301: Graph Implementations",
      course: "Algorithms",
      duration: "90 min",
      status: "In Progress",
      type: "Deep Work",
    },
    {
      id: 2,
      time: "04:00 PM - 05:00 PM",
      title: "MATH 240: Stokes' Theorem Practice Problems",
      course: "Calculus III",
      duration: "60 min",
      status: "Scheduled",
      type: "Problem Solving",
    },
    {
      id: 3,
      time: "07:30 PM - 08:30 PM",
      title: "PHIL 210: Read Case Study 4 (AI Ethics)",
      course: "Tech Ethics",
      duration: "60 min",
      status: "Scheduled",
      type: "Reading",
    },
    {
      id: 4,
      time: "09:00 PM - 09:45 PM",
      title: "Active Recall: CS 340 Database Normalization Forms",
      course: "Database Systems",
      duration: "45 min",
      status: "Scheduled",
      type: "Flashcards",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-purple-700 text-xs font-bold uppercase tracking-wider mb-1">
            <CalendarClock className="w-4 h-4" />
            <span>AI-Optimized Study Schedule</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Today's Focus & Study Sessions</h2>
          <p className="text-xs text-slate-500 font-medium">
            CampusMate automatically distributes study blocks around your lecture timetable and upcoming deadlines.
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('ask-ai')}
          className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs border border-purple-200/70 flex items-center gap-2 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <span>Ask AI to Reschedule</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Planned Sessions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Today's Time Blocks</h3>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                4.25 Study Hours Planned
              </span>
            </div>

            <div className="space-y-3">
              {plannedBlocks.map((block) => (
                <div
                  key={block.id}
                  className="p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-colors bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {block.time}
                      </span>
                      <span className="text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                        {block.type}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900">{block.title}</h4>
                    <p className="text-xs text-slate-500">Course: {block.course} • Duration: {block.duration}</p>
                  </div>

                  <div className="flex items-center gap-2 sm:self-center self-start">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      block.status === 'In Progress' 
                        ? 'bg-blue-100 text-blue-700 animate-pulse' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {block.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Pomodoro Focus Timer Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs text-center">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Focus Timer</h3>
            <p className="text-xs text-slate-500 mb-4">Stay in flow with the Pomodoro technique</p>

            {/* Mode switch */}
            <div className="flex items-center justify-center gap-1.5 p-1 bg-slate-100 rounded-xl mb-6">
              <button
                onClick={() => switchMode('focus', 25)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'focus' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Focus (25m)
              </button>
              <button
                onClick={() => switchMode('shortBreak', 5)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'shortBreak' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Break (5m)
              </button>
              <button
                onClick={() => switchMode('longBreak', 15)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'longBreak' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Rest (15m)
              </button>
            </div>

            {/* Timer Display */}
            <div className="my-6">
              <div className="text-5xl font-extrabold tracking-tight text-slate-900 font-mono">
                {formatTime(secondsLeft)}
              </div>
              <p className="text-xs text-slate-400 mt-2 font-medium">
                {isActive ? 'Current session in progress' : 'Ready to start'}
              </p>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsActive(!isActive)}
                className={`px-6 py-2.5 rounded-xl text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-transform active:scale-95 ${
                  isActive ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isActive ? 'Pause' : 'Start Focus'}</span>
              </button>

              <button
                onClick={() => switchMode(mode, mode === 'focus' ? 25 : mode === 'shortBreak' ? 5 : 15)}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                title="Reset timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
