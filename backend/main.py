import os
from datetime import datetime
from typing import List, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from database import init_db, get_all_tasks, get_task_by_id, create_task, update_task, delete_task
from models import TaskCreate, TaskUpdate, TaskResponse, AssistantChatRequest, AssistantChatResponse
from assistant import process_assistant_message


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite table and seed data on startup
    init_db()
    yield


app = FastAPI(
    title="CampusMate AI Academic Assistant API",
    description="FastAPI + SQLite backend for CampusMate AI tasks and student productivity",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
cors_origins_env = os.getenv(
    "CORS_ORIGINS", 
    "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174,https://campus-mate-ai-kappa.vercel.app"
)
origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def parse_task_id(task_id: Any) -> int:
    """Parses task ID, supporting both integers and 'task-<num>' formats."""
    if isinstance(task_id, int):
        return task_id
    raw = str(task_id).strip()
    if raw.startswith("task-"):
        raw = raw.replace("task-", "")
    try:
        return int(raw)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Invalid task ID format: '{task_id}'"
        )


@app.get("/api/health", tags=["Health"])
def health_check():
    """Health check endpoint to verify backend service status."""
    return {
        "status": "ok",
        "service": "CampusMate AI Backend",
        "database": "SQLite",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/tasks", response_model=List[TaskResponse], tags=["Tasks"])
def list_tasks():
    """Fetch all academic tasks stored in the SQLite database."""
    tasks = get_all_tasks()
    return tasks


@app.post("/api/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED, tags=["Tasks"])
def add_task(payload: TaskCreate):
    """Create a new academic task and persist it to SQLite."""
    if not payload.title.strip():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Title cannot be empty")
    
    created = create_task(payload.model_dump())
    return created


@app.patch("/api/tasks/{task_id}", response_model=TaskResponse, tags=["Tasks"])
def modify_task(task_id: str, payload: TaskUpdate):
    """Partially update an existing task (e.g., mark completed, edit priority)."""
    numeric_id = parse_task_id(task_id)
    existing = get_task_by_id(numeric_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Task with ID {task_id} not found")

    updated = update_task(numeric_id, payload.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Task with ID {task_id} not found")
    return updated


@app.delete("/api/tasks/{task_id}", tags=["Tasks"])
def remove_task(task_id: str):
    """Delete a task permanently from the SQLite database."""
    numeric_id = parse_task_id(task_id)
    existing = get_task_by_id(numeric_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Task with ID {task_id} not found")

    success = delete_task(numeric_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Failed to delete task {task_id}")
    
    return {"message": "Task deleted successfully", "id": numeric_id}


@app.post("/api/assistant/chat", response_model=AssistantChatResponse, tags=["Assistant"])
def assistant_chat(payload: AssistantChatRequest):
    """
    Conversational student assistant endpoint operating on SQLite task data.
    Provides a deterministic Simulated Alexa+ experience.
    """
    if not payload.message.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, 
            detail="Message cannot be empty"
        )
    result = process_assistant_message(payload.message, payload.course_context)
    return result


if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host=host, port=port, reload=True)
