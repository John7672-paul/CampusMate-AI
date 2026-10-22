/**
 * CampusMate AI - Tasks API Client
 * Connects frontend React components to Python FastAPI + SQLite backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  || (import.meta.env.PROD ? 'https://campusmate-ai-api.onrender.com/api' : '/api');

/**
 * Helper to perform fetch and keep network and HTTP errors distinguishable.
 */
async function apiFetch(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (err) {
    throw new Error(`Unable to connect to the API at ${API_BASE_URL}: ${err.message}`, { cause: err });
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || `HTTP Error ${response.status}: ${response.statusText}`);
  }
  return await response.json();
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

