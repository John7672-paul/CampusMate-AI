import React, { useState } from 'react';
import { 
  Mic, 
  Server, 
  GraduationCap
} from 'lucide-react';

export default function SettingsView({ studentProfile }) {
  const [dailyBriefingTime, setDailyBriefingTime] = useState('08:00');
  const [voiceReminders, setVoiceReminders] = useState(true);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900">Workspace & Voice Settings</h2>
        <p className="text-xs text-slate-500 font-medium">
          Configure browser voice preferences and student profile
        </p>
      </div>

      {/* 1. Browser voice simulation status */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider">
          <Mic className="w-4 h-4" />
          <span>Simulated Alexa+ Experience</span>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-purple-50/50 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Browser Voice Status</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                No Alexa device connected
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Voice input and playback use browser speech APIs on the Ask AI page. This app is not paired with Alexa.
            </p>
          </div>
        </div>

        {/* Integration status */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-purple-600" />
            <h4 className="text-xs font-bold text-slate-800">Integration Status</h4>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            CampusMate uses its web API for assistant actions. No MCP server or Alexa+ add-on is connected.
          </p>
          <div className="pt-1 flex items-center gap-4 text-[11px] text-slate-600 font-medium">
            <span>• Backend: Python + FastAPI</span>
            <span>• DB: SQLite</span>
            <span>• Alexa+ / MCP: Not connected</span>
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <p className="text-xs font-semibold text-slate-900">Morning Study Briefing Preference</p>
              <p className="text-[11px] text-slate-500">Display preference only; no briefing is scheduled</p>
            </div>
            <input
              type="time"
              value={dailyBriefingTime}
              onChange={(e) => setDailyBriefingTime(e.target.value)}
              className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 bg-white"
            />
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <p className="text-xs font-semibold text-slate-900">Proactive Voice Notifications</p>
              <p className="text-[11px] text-slate-500">Display preference only; no notifications are sent</p>
            </div>
            <input
              type="checkbox"
              checked={voiceReminders}
              onChange={(e) => setVoiceReminders(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
          </div>
        </div>
      </div>

      {/* 2. Academic Profile */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-blue-700 text-xs font-bold uppercase tracking-wider">
          <GraduationCap className="w-4 h-4" />
          <span>Student Profile Details</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-500 font-medium mb-1">Full Name</label>
            <input
              type="text"
              readOnly
              value={studentProfile.name}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">University</label>
            <input
              type="text"
              readOnly
              value={studentProfile.university}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">Degree & Major</label>
            <input
              type="text"
              readOnly
              value={studentProfile.major}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">Academic Term</label>
            <input
              type="text"
              readOnly
              value={studentProfile.term}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
