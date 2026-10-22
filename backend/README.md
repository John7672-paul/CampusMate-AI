# CampusMate AI Backend

Functional Python + FastAPI backend with persistent SQLite storage for student academic tasks.

## Setup Instructions

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Start the Backend Server
```bash
python main.py
```
Or directly with uvicorn:
```bash
uvicorn main:app --reload --port 8000
```

The server will start at `http://127.0.0.1:8000`.

### 3. API Endpoints
- **Health Check**: `GET /api/health`
- **List Tasks**: `GET /api/tasks`
- **Create Task**: `POST /api/tasks`
- **Update Task**: `PATCH /api/tasks/{task_id}`
- **Delete Task**: `DELETE /api/tasks/{task_id}`
- **Interactive OpenAPI Docs**: `http://127.0.0.1:8000/docs`
