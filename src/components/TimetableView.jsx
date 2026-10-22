import React, { useState } from 'react';
import { 
  Clock, 
  MapPin, 
  User, 
  Sparkles
} from 'lucide-react';
import { weeklyTimetable } from '../data/mockData';

export default function TimetableView({ onNavigateTab }) {
  const [selectedDay, setSelectedDay] = useState('Monday');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const currentSchedule = weeklyTimetable.find(d => d.day === selectedDay)?.classes || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Weekly Class Timetable</h2>
          <p className="text-xs text-slate-500 font-medium">
            Fall 2026 Semester Schedule • Integrated with classroom locations & office hours
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('ask-ai')}
          className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs border border-blue-200/60 flex items-center gap-1.5 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Ask AI: "Where is my next class?"</span>
        </button>
      </div>

      {/* Day Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {days.map((day) => {
          const isSelected = selectedDay === day;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Schedule for Selected Day */}
      <div className="space-y-3">
        {currentSchedule.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-400">
            No classes scheduled for {selectedDay}. Enjoy your study block!
          </div>
        ) : (
          currentSchedule.map((cls, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Period</span>
                  <span className="text-base font-extrabold">{idx + 1}</span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">{cls.course}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1 text-slate-700 font-medium">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      {cls.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {cls.room}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {cls.professor}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:self-center self-end">
                <button
                  onClick={() => onNavigateTab('ask-ai')}
                  className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-semibold border border-slate-200 transition-colors"
                >
                  Ask for Syllabus
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
