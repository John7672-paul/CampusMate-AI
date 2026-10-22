/**
 * CampusMate AI - Tasks API Client
 * Connects frontend React components to Python FastAPI + SQLite backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const DIRECT_BACKEND_URL = 'http://127.0.0.1:8000/api';

/**
 * Helper to perform fetch with fallback to direct backend URL if proxy isn't available
 */
async function apiFetch(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Try relative endpoint first (works with Vite proxy or production reverse proxy)
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    if (response.ok) {
      return await response.json();
    }
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || `HTTP Error ${response.status}: ${response.statusText}`);
  } catch (err) {
    // If relative endpoint failed due to network error and wasn't direct, attempt direct backend URL
    if (API_BASE_URL !== DIRECT_BACKEND_URL && !endpoint.startsWith('http')) {
      try {
        const directRes = await fetch(`${DIRECT_BACKEND_URL}${endpoint}`, {
          ...options,
          headers,
        });
        if (directRes.ok) {
          return await directRes.json();
        }
        const errorBody = await directRes.json().catch(() => ({}));
        throw new Error(errorBody.detail || `HTTP Error ${directRes.status}: ${directRes.statusText}`);
      } catch (directErr) {
        throw new Error(directErr.message || 'Unable to connect to backend server');
      }
    }
    throw err;
  }
}

/**
 * Check backend health status
 */
export async function checkBackendHealth() {
  return await apiFetch('/health');
}

/**
 * Fetch all tasks from SQLite backend
 */
export async function fetchTasks() {
  return await apiFetch('/tasks');
}

/**
 * Create a new task in SQLite backend
 */
export async function createBackendTask(task) {
  const payload = {
    title: task.title,
    course: task.course,
    courseCode: task.courseCode,
    dueDate: task.dueDate || task.due_date || 'Today, 11:59 PM',
    priority: task.priority || 'Medium',
    completed: Boolean(task.completed),
    estimatedMinutes: Number(task.estimatedMinutes) || 45,
  };
  return await apiFetch('/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Update an existing task in SQLite backend
 */
export async function updateBackendTask(taskId, updates) {
  return await apiFetch(`/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

/**
 * Delete a task from SQLite backend
 */
export async function deleteBackendTask(taskId) {
  return await apiFetch(`/tasks/${taskId}`, {
    method: 'DELETE',
  });
}

/**
 * Send user query to conversational assistant endpoint
 */
export async function sendAssistantMessage(message, courseContext = 'All') {
  return await apiFetch('/assistant/chat', {
    method: 'POST',
    body: JSON.stringify({
      message,
      course_context: courseContext,
    }),
  });
}

