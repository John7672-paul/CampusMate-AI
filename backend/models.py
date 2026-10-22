from pydantic import BaseModel, Field, model_validator
from typing import Optional, Any, List
from datetime import datetime


class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, description="Task title cannot be empty")
    course: str = Field(..., min_length=1, description="Course name or code")
    due_date: Optional[str] = Field(default=None, description="Due date string")
    dueDate: Optional[str] = Field(default=None, description="CamelCase alias for due_date")
    priority: str = Field(default="Medium", description="Priority level: High, Medium, or Low")
    completed: bool = Field(default=False, description="Completion status")
    courseCode: Optional[str] = Field(default=None, description="Short course code")
    estimatedMinutes: Optional[int] = Field(default=45, description="Estimated minutes to complete")


class TaskCreate(TaskBase):
    @model_validator(mode="before")
    @classmethod
    def reconcile_fields(cls, values: Any) -> Any:
        if isinstance(values, dict):
            # Synchronize due_date and dueDate
            if "dueDate" in values and ("due_date" not in values or not values["due_date"]):
                values["due_date"] = values["dueDate"]
            elif "due_date" in values and ("dueDate" not in values or not values["dueDate"]):
                values["dueDate"] = values["due_date"]
            
            # Default due_date if none provided
            if not values.get("due_date"):
                values["due_date"] = "Today, 11:59 PM"
                values["dueDate"] = "Today, 11:59 PM"

            # Derive courseCode if not provided
            if not values.get("courseCode") and values.get("course"):
                course = values["course"]
                values["courseCode"] = course.split(" - ")[0].split(":")[0].strip()
        return values


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1)
    course: Optional[str] = None
    due_date: Optional[str] = None
    dueDate: Optional[str] = None
    priority: Optional[str] = None
    completed: Optional[bool] = None
    courseCode: Optional[str] = None
    estimatedMinutes: Optional[int] = None

    @model_validator(mode="before")
    @classmethod
    def reconcile_fields(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if "dueDate" in values and ("due_date" not in values or not values["due_date"]):
                values["due_date"] = values["dueDate"]
            elif "due_date" in values and ("dueDate" not in values or not values["dueDate"]):
                values["dueDate"] = values["due_date"]
        return values


class TaskResponse(BaseModel):
    id: int
    title: str
    course: str
    courseCode: str
    due_date: str
    dueDate: str
    priority: str
    completed: bool
    estimatedMinutes: int = 45
    created_at: str


class AssistantChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User prompt or voice command")
    course_context: Optional[str] = Field(default="All", description="Selected course context filter")


class AssistantChatResponse(BaseModel):
    reply: str
    success: bool = True
    action: str
    tasks_changed: bool = False
    tasks: Optional[List[TaskResponse]] = None
