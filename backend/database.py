import sqlite3
import os
from pathlib import Path
from datetime import datetime
from typing import List, Optional, Dict, Any

DATABASE_PATH = os.getenv("DATABASE_PATH", str(Path(__file__).parent / "campusmate.db"))


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Initializes the SQLite database and seeds default tasks if empty."""
    os.makedirs(os.path.dirname(os.path.abspath(DATABASE_PATH)), exist_ok=True)
    
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                course TEXT NOT NULL,
                due_date TEXT NOT NULL,
                priority TEXT NOT NULL DEFAULT 'Medium',
                completed INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                course_code TEXT,
                estimated_minutes INTEGER DEFAULT 45
            )
        """)
        conn.commit()

        # Seed initial tasks if table is empty
        cursor.execute("SELECT COUNT(*) FROM tasks")
        count = cursor.fetchone()[0]
        if count == 0:
            initial_tasks = [
                (
                    "Implement Dijkstra's Algorithm in Python",
                    "CS 301 - Algorithms",
                    "Today, 11:59 PM",
                    "High",
                    0,
                    datetime.now().isoformat(),
                    "CS 301",
                    90
                ),
                (
                    "Review Multivariable Calculus Lecture 8 Notes",
                    "MATH 240 - Calculus III",
                    "Today, 5:00 PM",
                    "Medium",
                    1,
                    datetime.now().isoformat(),
                    "MATH 240",
                    45
                ),
                (
                    "Draft Outline for AI Ethics Term Paper",
                    "PHIL 210 - Tech Ethics",
                    "Tomorrow, 2:00 PM",
                    "High",
                    0,
                    datetime.now().isoformat(),
                    "PHIL 210",
                    60
                ),
                (
                    "Complete Database Schema Normalization Quiz",
                    "CS 340 - Database Systems",
                    "Oct 23, 11:59 PM",
                    "Low",
                    0,
                    datetime.now().isoformat(),
                    "CS 340",
                    30
                ),
                (
                    "Solve Problem Set 4: Vector Fields",
                    "MATH 240 - Calculus III",
                    "Oct 24, 9:00 AM",
                    "Medium",
                    0,
                    datetime.now().isoformat(),
                    "MATH 240",
                    120
                ),
            ]
            cursor.executemany("""
                INSERT INTO tasks (title, course, due_date, priority, completed, created_at, course_code, estimated_minutes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, initial_tasks)
            conn.commit()


def row_to_task_dict(row: sqlite3.Row) -> Dict[str, Any]:
    row_dict = dict(row)
    course = row_dict.get("course", "")
    course_code = row_dict.get("course_code")
    if not course_code:
        course_code = course.split(" - ")[0].split(":")[0].strip()

    due_date = row_dict.get("due_date", "")
    return {
        "id": row_dict["id"],
        "title": row_dict["title"],
        "course": course,
        "courseCode": course_code,
        "due_date": due_date,
        "dueDate": due_date,
        "priority": row_dict.get("priority", "Medium"),
        "completed": bool(row_dict.get("completed", 0)),
        "estimatedMinutes": row_dict.get("estimated_minutes") or 45,
        "created_at": row_dict.get("created_at", ""),
    }


def get_all_tasks() -> List[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tasks ORDER BY id ASC")
        rows = cursor.fetchall()
        return [row_to_task_dict(row) for row in rows]


def get_task_by_id(task_id: int) -> Optional[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        row = cursor.fetchone()
        return row_to_task_dict(row) if row else None


def create_task(task_data: Dict[str, Any]) -> Dict[str, Any]:
    now = datetime.now().isoformat()
    course = task_data["course"]
    course_code = task_data.get("courseCode") or course.split(" - ")[0].split(":")[0].strip()
    due_date = task_data.get("due_date") or task_data.get("dueDate") or "Today, 11:59 PM"
    priority = task_data.get("priority", "Medium")
    completed = 1 if task_data.get("completed") else 0
    estimated_minutes = task_data.get("estimatedMinutes", 45)

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO tasks (title, course, due_date, priority, completed, created_at, course_code, estimated_minutes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (task_data["title"], course, due_date, priority, completed, now, course_code, estimated_minutes))
        conn.commit()
        new_id = cursor.lastrowid

        cursor.execute("SELECT * FROM tasks WHERE id = ?", (new_id,))
        row = cursor.fetchone()
        return row_to_task_dict(row)


def update_task(task_id: int, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    existing = get_task_by_id(task_id)
    if not existing:
        return None

    fields = []
    values = []

    if "title" in updates and updates["title"] is not None:
        fields.append("title = ?")
        values.append(updates["title"])
    if "course" in updates and updates["course"] is not None:
        fields.append("course = ?")
        values.append(updates["course"])
    if "due_date" in updates and updates["due_date"] is not None:
        fields.append("due_date = ?")
        values.append(updates["due_date"])
    elif "dueDate" in updates and updates["dueDate"] is not None:
        fields.append("due_date = ?")
        values.append(updates["dueDate"])
    if "priority" in updates and updates["priority"] is not None:
        fields.append("priority = ?")
        values.append(updates["priority"])
    if "completed" in updates and updates["completed"] is not None:
        fields.append("completed = ?")
        values.append(1 if updates["completed"] else 0)
    if "courseCode" in updates and updates["courseCode"] is not None:
        fields.append("course_code = ?")
        values.append(updates["courseCode"])
    if "estimatedMinutes" in updates and updates["estimatedMinutes"] is not None:
        fields.append("estimated_minutes = ?")
        values.append(updates["estimatedMinutes"])

    if not fields:
        return existing

    values.append(task_id)
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(f"UPDATE tasks SET {', '.join(fields)} WHERE id = ?", values)
        conn.commit()

        cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        row = cursor.fetchone()
        return row_to_task_dict(row) if row else None


def delete_task(task_id: int) -> bool:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        conn.commit()
        return cursor.rowcount > 0
