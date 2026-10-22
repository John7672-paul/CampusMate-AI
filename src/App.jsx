import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import AskAIView from './components/AskAIView';
import StudyPlannerView from './components/StudyPlannerView';
import TasksView from './components/TasksView';
import TimetableView from './components/TimetableView';
import SettingsView from './components/SettingsView';
import NewTaskModal from './components/NewTaskModal';
import { 
  studentProfile, 
  initialTasks, 
  upcomingAssignments, 
  initialChatMessages, 
  quickPromptSuggestions 
} from './data/mockData';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { 
  fetchTasks, 
  createBackendTask, 
  updateBackendTask, 
  deleteBackendTask,
  sendAssistantMessage
} from './api/tasksApi';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tasks, setTasks] = useState(initialTasks);
  const [isTasksLoading, setIsTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState(null);
  const [backendConnected, setBackendConnected] = useState(false);
  const [chatMessages, setChatMessages] = useState(initialChatMessages);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, isError = false) => {
    setToastMessage({ text: message, isError });
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Load tasks from SQLite backend on initial mount
  useEffect(() => {
    let isMounted = true;
    const loadTasks = async () => {
      try {
        setIsTasksLoading(true);
        const data = await fetchTasks();
        if (isMounted && Array.isArray(data)) {
          setTasks(data);
          setBackendConnected(true);
          setTasksError(null);
        }
      } catch (err) {
        console.warn('Backend unavailable, using initial data:', err.message);
        if (isMounted) {
          setBackendConnected(false);
          setTasksError('Backend offline - using local tasks');
        }
      } finally {
        if (isMounted) {
          setIsTasksLoading(false);
        }
      }
    };

    loadTasks();
    return () => { isMounted = false; };
  }, []);

  // Task management handlers with SQLite persistence
  const handleToggleTask = async (taskId) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;
    const nextState = !targetTask.completed;

    // Optimistic UI update
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return { ...task, completed: nextState };
      }
      return task;
    }));
    showToast(nextState ? `Completed: "${targetTask.title}"` : `Marked incomplete: "${targetTask.title}"`);

    // Backend sync
    try {
      await updateBackendTask(taskId, { completed: nextState });
    } catch (err) {
      console.error('Failed to sync task status with backend:', err);
      // Revert if error
      setTasks(prev => prev.map(task => {
        if (task.id === taskId) {
          return { ...task, completed: !nextState };
        }
        return task;
      }));
      showToast(`Sync error: ${err.message}`, true);
    }
  };

  const handleDeleteTask = async (taskId) => {
    const previousTasks = [...tasks];
    setTasks(prev => prev.filter(t => t.id !== taskId));
    showToast("Task deleted");

    try {
      await deleteBackendTask(taskId);
    } catch (err) {
      console.error('Failed to delete task from backend:', err);
      setTasks(previousTasks);
      showToast(`Delete failed: ${err.message}`, true);
    }
  };

  const handleAddTask = async (newTask) => {
    const tempId = newTask.id || `task-${Date.now()}`;
    const taskToAdd = { ...newTask, id: tempId };
    setTasks(prev => [taskToAdd, ...prev]);
    showToast(`Task added: "${newTask.title}"`);

    try {
      const persisted = await createBackendTask(newTask);
      if (persisted && persisted.id) {
        setTasks(prev => prev.map(t => t.id === tempId ? persisted : t));
      }
    } catch (err) {
      console.error('Failed to persist task in backend:', err);
      showToast(`Saved locally (Backend: ${err.message})`, true);
    }
  };

  // AI Chat Handlers - Connected to Python FastAPI Assistant
  const handleSendMessage = async (userText, courseContext = 'All') => {
    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: userText,
    };

    setChatMessages(prev => [...prev, newMsg]);

    try {
      const response = await sendAssistantMessage(userText, courseContext);

      // Contextual action chips based on assistant response
      let actions = ["Show my pending tasks", "How many tasks do I have?", "Make a study plan for me"];
      if (response.action === 'list_pending') {
        actions = ["Make a study plan for me", "How many tasks do I have?", "Show completed tasks"];
      } else if (response.action === 'generate_study_plan') {
        actions = ["Show my pending tasks", "How many tasks do I have?"];
      } else if (response.action === 'delete_confirmation_prompt') {
        const confirmMatch = response.reply.match(/Confirm delete (.+?)(?:\*\*|$)/);
        if (confirmMatch) {
          actions = [`Confirm delete ${confirmMatch[1].trim()}`];
        }
      }

      const aiMsg = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: response.reply,
        actions,
      };

      setChatMessages(prev => [...prev, aiMsg]);

      // If the assistant modified SQLite tasks (add, complete, delete), update task state immediately
      if (response.tasks_changed) {
        if (response.tasks && Array.isArray(response.tasks)) {
          setTasks(response.tasks);
        } else {
          const freshTasks = await fetchTasks();
          if (Array.isArray(freshTasks)) {
            setTasks(freshTasks);
          }
        }
      }
      return response;
    } catch (err) {
      console.error('Failed to get assistant response:', err);
      const errorMsg = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: `⚠️ **Backend Service Error:** Unable to reach CampusMate assistant API (${err.message}).\n\nPlease ensure the Python FastAPI backend is running at http://127.0.0.1:8000.`,
        actions: ["Show my pending tasks", "How many tasks do I have?"],
      };
      setChatMessages(prev => [...prev, errorMsg]);
      return null;
    }
  };

  const handleClearChat = () => {
    setChatMessages([
      {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: "Chat history cleared. I'm ready for your next question! Ask about your courses, homework, or schedule.",
        actions: ["What's due tomorrow?", "Create study plan for tonight", "Check lecture schedule"],
      }
    ]);
    showToast("Chat reset");
  };

  // When user queries from Dashboard input bar
  const handleDashboardAIQuery = (queryText) => {
    setActiveTab('ask-ai');
    handleSendMessage(queryText);
  };

  // Add task suggested by AI
  const handleAddTaskFromAI = (actionText) => {
    const newTask = {
      id: `task-${Date.now()}`,
      title: actionText.replace(/^Add\s+/i, '').replace(/^Sync\s+/i, ''),
      course: 'CS 301 - Algorithms',
      courseCode: 'CS 301',
      dueDate: 'Today, 8:00 PM',
      dueTime: '20:00',
      priority: 'High',
      completed: false,
      estimatedMinutes: 45,
    };
    handleAddTask(newTask);
  };

  const pendingCount = tasks.filter(t => !t.completed).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <div className="flex-1 flex w-full">
        {/* Responsive Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          tasksCount={pendingCount}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <Header
            activeTab={activeTab}
            setMobileOpen={setMobileOpen}
            onOpenNewTask={() => setIsNewTaskModalOpen(true)}
            onAskAI={() => setActiveTab('ask-ai')}
          />

          {/* View Container */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {activeTab === 'dashboard' && (
              <DashboardView
                studentProfile={studentProfile}
                tasks={tasks}
                onToggleTask={handleToggleTask}
                upcomingAssignments={upcomingAssignments}
                onNavigateTab={setActiveTab}
                onOpenNewTask={() => setIsNewTaskModalOpen(true)}
                onSendAIQuery={handleDashboardAIQuery}
                quickPromptSuggestions={quickPromptSuggestions}
              />
            )}

            {activeTab === 'ask-ai' && (
              <AskAIView
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                onClearChat={handleClearChat}
                onAddTaskFromAI={handleAddTaskFromAI}
                quickPromptSuggestions={quickPromptSuggestions}
              />
            )}

            {activeTab === 'planner' && (
              <StudyPlannerView
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'tasks' && (
              <TasksView
                tasks={tasks}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
                onOpenNewTask={() => setIsNewTaskModalOpen(true)}
                isLoading={isTasksLoading}
                errorMessage={tasksError}
                backendConnected={backendConnected}
              />
            )}

            {activeTab === 'timetable' && (
              <TimetableView
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                studentProfile={studentProfile}
              />
            )}
          </main>
        </div>
      </div>

      {/* Modal for adding new task */}
      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        onAddTask={handleAddTask}
      />

      {/* Subtle Toast notification */}
      {toastMessage && (
        <div className={`fixed bottom-5 right-5 z-50 text-white px-4 py-2.5 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200 ${
          toastMessage.isError ? 'bg-rose-900 border-rose-700/80' : 'bg-slate-900 border-slate-700/80'
        }`}>
          {toastMessage.isError ? (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span>{toastMessage.text || toastMessage}</span>
        </div>
      )}
    </div>
  );
}
