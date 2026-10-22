import re
from difflib import SequenceMatcher
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

from database import get_all_tasks, get_task_by_id, create_task, update_task, delete_task


def _study_plan_due_date_key(task: Dict[str, Any]) -> datetime:
    """Sort recognizable due dates chronologically; unknown dates follow dated tasks."""
    due_date = str(task.get("dueDate") or task.get("due_date") or "").strip()
    now = datetime.now()
    formats = ["%b %d, %I:%M %p", "%B %d, %I:%M %p", "%b %d", "%B %d"]

    if due_date.lower().startswith("today"):
        time_text = due_date.partition(",")[2].strip()
        try:
            return datetime.combine(now.date(), datetime.strptime(time_text, "%I:%M %p").time())
        except ValueError:
            return now.replace(hour=0, minute=0, second=0, microsecond=0)
    if due_date.lower().startswith("tomorrow"):
        time_text = due_date.partition(",")[2].strip()
        try:
            due_time = datetime.strptime(time_text, "%I:%M %p").time()
        except ValueError:
            due_time = datetime.min.time()
        return datetime.combine(now.date() + timedelta(days=1), due_time)

    for date_format in formats:
        try:
            parsed = datetime.strptime(due_date, date_format)
            parsed = parsed.replace(year=now.year)
            if parsed < now:
                parsed = parsed.replace(year=now.year + 1)
            return parsed
        except ValueError:
            continue
    for date_format in ("%Y-%m-%d %H:%M", "%Y-%m-%d"):
        try:
            return datetime.strptime(due_date, date_format)
        except ValueError:
            continue
    return datetime.max


def _build_study_plan_blocks(tasks: List[Dict[str, Any]]) -> tuple[List[str], List[str]]:
    """Schedule tasks that fit before midnight and explicitly account for the rest."""
    priority_rank = {"High": 1, "Medium": 2, "Low": 3}
    ordered_tasks = sorted(
        tasks,
        key=lambda task: (
            _study_plan_due_date_key(task),
            priority_rank.get(str(task.get("priority", "")).title(), 4),
        ),
    )
    start = datetime.now().replace(hour=18, minute=30, second=0, microsecond=0)
    midnight = start.replace(hour=0, minute=0) + timedelta(days=1)
    lines = []
    unscheduled = []
    for task in ordered_tasks:
        duration = task.get("estimatedMinutes") or 60
        try:
            duration = max(1, int(duration))
        except (TypeError, ValueError):
            duration = 60
        end = start + timedelta(minutes=duration)
        if end > midnight:
            unscheduled.append(f"* **{task['title']}** — Not scheduled: its {duration}-minute session will not fit before midnight.")
            continue
        label = "Deep Focus Block" if not lines else "Study Block"
        lines.append(
            f"* **{start.strftime('%I:%M %p')} - {end.strftime('%I:%M %p')}:** "
            f"**{task['title']}** ({task['courseCode']}) — *{label}; {duration} min; "
            f"{task.get('priority', 'Unspecified')} priority; due {task.get('dueDate') or task.get('due_date') or 'date not provided'}*"
        )
        start = end + timedelta(minutes=15)
    return lines, unscheduled


def _extract_task_title(message: str) -> str:
    """Remove task-command language while preserving the user's title words."""
    title = re.sub(
        r'^\s*(?:please\s+)?(?:add|create|insert|new)\s+(?:(?:a|the)\s+)?(?:task\s+)?',
        '', message, flags=re.IGNORECASE,
    )
    title = re.sub(r'^(?:called|named|titled)\s+', '', title, flags=re.IGNORECASE)
    title = re.sub(
        r'\s+(?:(?:to|in)\s+(?:(?:my|the)\s+)?(?:tasks?|task\s+list|planner)|'
        r'(?:please\s+)?to\s+my\s+tasks?)\s*[.!?]*\s*$',
        '', title, flags=re.IGNORECASE,
    )
    title = re.sub(r'\s+(?:please|thanks|thank you)[.!?]*\s*$', '', title, flags=re.IGNORECASE)
    return title.strip(' \t\r\n.!?,;:')


def normalize_text(text: str) -> str:
    """Cleans and standardizes text for case-insensitive matching."""
    return re.sub(r'\s+', ' ', re.sub(r'[^\w\s]', ' ', text.lower())).strip()


def find_matching_tasks(query: str, tasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Return exact titles first, otherwise contiguous whole-word title phrases."""
    norm_query = normalize_text(query)
    if not norm_query:
        return []

    ignored_words = {'the', 'a', 'an', 'task', 'my', 'to', 'for'}
    query_tokens = [t for t in norm_query.split() if t not in ignored_words]

    # 1. Exact match on normalized title
    exact_matches = [t for t in tasks if normalize_text(t["title"]) == norm_query]
    if exact_matches:
        return exact_matches

    # 2. Match a contiguous sequence of whole title words. Keep every candidate
    # so callers can ask for clarification rather than selecting an arbitrary task.
    if not query_tokens:
        return []

    matches = []
    for task in tasks:
        title_tokens = [t for t in normalize_text(task["title"]).split() if t not in ignored_words]
        width = len(query_tokens)
        if any(title_tokens[i:i + width] == query_tokens for i in range(len(title_tokens) - width + 1)):
            matches.append(task)

    return matches


def find_similar_tasks(query: str, tasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Find conservative typo candidates; callers must ask before acting on them."""
    norm_query = normalize_text(query)
    query_tokens = [token for token in norm_query.split() if token not in {'the', 'a', 'an', 'task', 'my', 'to', 'for'}]
    if not norm_query or not query_tokens:
        return []

    min_score = 0.84 if len(query_tokens) == 1 and len(query_tokens[0]) >= 5 else 0.73
    if len(query_tokens) == 1 and len(query_tokens[0]) < 5:
        return []

    scored = []
    for task in tasks:
        title_tokens = normalize_text(task['title']).split()
        if len(query_tokens) == 1:
            score = max((SequenceMatcher(None, query_tokens[0], token).ratio() for token in title_tokens), default=0)
        else:
            score = SequenceMatcher(None, ' '.join(query_tokens), ' '.join(title_tokens)).ratio()
            # Compare against title phrases too, so a clear shortened/typoed title
            # can be suggested without treating unrelated words as a match.
            for width in {max(1, len(query_tokens) - 1), len(query_tokens), len(query_tokens) + 1}:
                for start in range(len(title_tokens) - width + 1):
                    phrase = ' '.join(title_tokens[start:start + width])
                    score = max(score, SequenceMatcher(None, ' '.join(query_tokens), phrase).ratio())
        if score >= min_score:
            scored.append((score, task))

    scored.sort(key=lambda item: item[0], reverse=True)
    if not scored:
        return []
    best_score = scored[0][0]
    return [task for score, task in scored if best_score - score <= 0.08]


def exact_title_matches(query: str, tasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Match normalized full titles only, for explicit confirmation commands."""
    norm_query = normalize_text(query)
    return [task for task in tasks if normalize_text(task['title']) == norm_query]


def similar_match_reply(operation: str, target: str, matches: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Build a clarification response without applying any task change."""
    if len(matches) == 1:
        title = matches[0]['title']
        reply = f"Did you mean {title}? No task was changed. If so, reply 'Confirm {operation} {title}'."
    else:
        options = '\n'.join(f"• {task['title']} ({task['courseCode']})" for task in matches)
        reply = f"I found several similar tasks for '{target}':\n\n{options}\n\nPlease clarify the exact task title. No task was changed."
    return {
        'reply': reply,
        'success': False,
        'action': f'{operation.lower()}_confirmation_prompt' if len(matches) == 1 else f'{operation.lower()}_ambiguous',
        'tasks_changed': False,
    }


def process_assistant_message(message: str, course_context: Optional[str] = "All") -> Dict[str, Any]:
    """
    Deterministic intent handler for CampusMate AI Assistant.
    Operates strictly on real SQLite task data using predefined CRUD functions.
    """
    raw_msg = message.strip()
    norm_msg = normalize_text(raw_msg)

    # ---------------------------------------------------------
    # Intent 1: Count tasks
    # (Check before general list to avoid overlap with 'how many tasks')
    # ---------------------------------------------------------
    if any(p in norm_msg for p in [
        "how many tasks", "count of tasks", "count tasks", "task count",
        "how many pending", "number of tasks", "how many items"
    ]):
        all_tasks = get_all_tasks()
        pending = [t for t in all_tasks if not t["completed"]]
        completed = [t for t in all_tasks if t["completed"]]

        reply = (
            f"You currently have **{len(pending)} pending tasks** and **{len(completed)} completed tasks** "
            f"({len(all_tasks)} total in your SQLite workspace)."
        )
        return {
            "reply": reply,
            "success": True,
            "action": "count_tasks",
            "tasks_changed": False,
            "tasks": all_tasks
        }

    # ---------------------------------------------------------
    # Intent 2: List pending tasks
    # ---------------------------------------------------------
    if any(p in norm_msg for p in [
        "pending task", "what is pending", "whats pending", "show pending", 
        "list pending", "unfinished", "remaining task", "what do i have to do",
        "what is due", "whats due", "due tomorrow", "show my tasks", "show tasks"
    ]) and not any(p in norm_msg for p in ["completed", "finished", "done"]):
        all_tasks = get_all_tasks()
        pending = [t for t in all_tasks if not t["completed"]]

        if not pending:
            reply = "🎉 You have no pending tasks! Everything in your schedule is marked complete."
        else:
            task_lines = []
            for idx, t in enumerate(pending, 1):
                p_badge = "🔴 High" if t["priority"] == "High" else ("🟡 Medium" if t["priority"] == "Medium" else "🟢 Low")
                task_lines.append(f"{idx}. **{t['title']}**\n   • Course: {t['courseCode']} | Due: {t['dueDate']} | Priority: {p_badge}")
            reply = f"Here are your **{len(pending)} pending academic tasks**:\n\n" + "\n\n".join(task_lines)

        return {
            "reply": reply,
            "success": True,
            "action": "list_pending",
            "tasks_changed": False,
            "tasks": all_tasks
        }

    # ---------------------------------------------------------
    # Intent 3: List completed tasks
    # ---------------------------------------------------------
    if any(p in norm_msg for p in [
        "completed task", "finished task", "show completed", "list completed",
        "what is completed", "whats completed", "done task", "tasks done"
    ]):
        all_tasks = get_all_tasks()
        completed = [t for t in all_tasks if t["completed"]]

        if not completed:
            reply = "You haven't completed any tasks yet. Ask me to 'Show my pending tasks' to see what's on your list."
        else:
            task_lines = []
            for idx, t in enumerate(completed, 1):
                task_lines.append(f"{idx}. ~~**{t['title']}**~~ ({t['courseCode']}) — Completed")
            reply = f"Here are your **{len(completed)} completed tasks**:\n\n" + "\n".join(task_lines)

        return {
            "reply": reply,
            "success": True,
            "action": "list_completed",
            "tasks_changed": False,
            "tasks": all_tasks
        }

    # ---------------------------------------------------------
    # Intent 4: List all tasks
    # ---------------------------------------------------------
    if any(p in norm_msg for p in [
        "all task", "show all tasks", "list all tasks", "view all tasks",
        "every task", "full task list"
    ]):
        all_tasks = get_all_tasks()
        if not all_tasks:
            reply = "Your SQLite task database is currently empty."
        else:
            task_lines = []
            for idx, t in enumerate(all_tasks, 1):
                status_icon = "✅" if t["completed"] else "⏳"
                task_lines.append(f"{idx}. {status_icon} **{t['title']}** ({t['courseCode']}) — Due: {t['dueDate']}")
            reply = f"Here are all **{len(all_tasks)} tasks** in your SQLite database:\n\n" + "\n".join(task_lines)

        return {
            "reply": reply,
            "success": True,
            "action": "list_all",
            "tasks_changed": False,
            "tasks": all_tasks
        }

    # ---------------------------------------------------------
    # Intent 5: Add a task
    # ---------------------------------------------------------
    add_confirmation = re.match(r'^\s*(?:please\s+)?confirm\s+add\s+(.+?)\s*[.!?]*\s*$', raw_msg, re.IGNORECASE)
    add_match = re.search(
        r'^(?:please\s+)?(?:add|create|insert|new)\s+(?:task\s+)?(.+?)(?:\s+to\s+(?:my\s+)?(?:tasks|task\s+list|planner))?$', 
        raw_msg, 
        re.IGNORECASE
    )
    if (add_match or add_confirmation) and not any(k in norm_msg for k in ["study plan", "complete", "delete", "remove"]):
        extracted_title = add_confirmation.group(1).strip() if add_confirmation else _extract_task_title(raw_msg)

        if not extracted_title:
            return {
                "reply": "Please specify the task title you would like to add (e.g., 'Add Python DSA practice to my tasks').",
                "success": False,
                "action": "add_task",
                "tasks_changed": False
            }

        if not add_confirmation:
            duplicates = exact_title_matches(extracted_title, get_all_tasks())
            if duplicates:
                statuses = ", ".join(
                    f"'{task['title']}' ({'completed' if task['completed'] else 'pending'})"
                    for task in duplicates
                )
                return {
                    "reply": (
                        f"A task with the same title already exists: {statuses}. "
                        f"Would you like to create another **{extracted_title}**? "
                        f"Reply 'Confirm add {extracted_title}' to create it. No task was changed."
                    ),
                    "success": False,
                    "action": "add_confirmation_prompt",
                    "tasks_changed": False
                }

        # Infer course if specified
        norm_title = extracted_title.lower()
        if "cs 301" in norm_title or "algorithm" in norm_title or "dsa" in norm_title or "python" in norm_title:
            course = "CS 301 - Algorithms"
            course_code = "CS 301"
        elif "math 240" in norm_title or "calculus" in norm_title or "vector" in norm_title:
            course = "MATH 240 - Calculus III"
            course_code = "MATH 240"
        elif "cs 340" in norm_title or "database" in norm_title or "sql" in norm_title:
            course = "CS 340 - Database Systems"
            course_code = "CS 340"
        elif "phil 210" in norm_title or "ethics" in norm_title:
            course = "PHIL 210 - Tech Ethics"
            course_code = "PHIL 210"
        else:
            course = "CS 301 - Algorithms" if course_context in ("All", "All Courses") else course_context
            course_code = course.split(" - ")[0].split(":")[0].strip()

        priority = "High" if ("urgent" in norm_title or "exam" in norm_title or "dsa" in norm_title) else "Medium"
        new_task = create_task({
            "title": extracted_title,
            "course": course,
            "courseCode": course_code,
            "due_date": "Today, 11:59 PM",
            "dueDate": "Today, 11:59 PM",
            "priority": priority,
            "completed": False,
            "estimatedMinutes": 60
        })

        reply = (
            f"✅ **Task added to SQLite:**\n"
            f"• Title: **{new_task['title']}**\n"
            f"• Course: {new_task['course']} ({new_task['courseCode']})\n"
            f"• Due: {new_task['dueDate']} | Priority: {new_task['priority']}"
        )
        return {
            "reply": reply,
            "success": True,
            "action": "add_task",
            "tasks_changed": True,
            "tasks": get_all_tasks()
        }

    # ---------------------------------------------------------
    # Intent 6: Complete a task by title
    # ---------------------------------------------------------
    complete_patterns = [
        r'^(?:please\s+)?confirm\s+(?:complete|finish)\s+(?:task\s+)?(.+)$',
        r'^(?:please\s+)?(?:complete|finish)\s+(?:task\s+)?(.+)$',
        r'^(?:please\s+)?mark\s+(?:task\s+)?(.+?)\s+as\s+(?:complete|completed|done)$',
        r'^(?:please\s+)?mark\s+done\s+(.+)$',
        r'^(?:please\s+)?done\s+with\s+(.+)$',
        r'^(?:please\s+)?mark\s+as\s+(?:complete|completed|done)\s+(.+)$',
    ]
    complete_match = next((match for pattern in complete_patterns if (match := re.match(pattern, raw_msg, re.IGNORECASE))), None)
    if complete_match:
        target = complete_match.group(1).strip()
        is_completion_confirmation = norm_msg.startswith('confirm complete ') or norm_msg.startswith('confirm finish ')

        if not target:
            return {
                "reply": "Which task would you like to complete? Please specify the title (e.g., 'Complete Python DSA practice').",
                "success": False,
                "action": "complete_task",
                "tasks_changed": False
            }

        all_tasks = get_all_tasks()
        pending = [t for t in all_tasks if not t["completed"]]
        exact_matches = exact_title_matches(target, pending)
        if is_completion_confirmation:
            matches = exact_matches
            if not matches:
                similar = find_matching_tasks(target, pending) or find_similar_tasks(target, pending)
                if similar:
                    return similar_match_reply('complete', target, similar)
        elif exact_matches:
            matches = exact_matches
        else:
            matches = find_matching_tasks(target, pending) or find_similar_tasks(target, pending)
            if matches:
                return similar_match_reply('complete', target, matches)

        if len(matches) == 0:
            # Check if task is already completed
            already_done = exact_title_matches(target, [t for t in all_tasks if t["completed"]])
            if already_done:
                reply = f"Task '**{already_done[0]['title']}**' is already marked as completed in your SQLite database."
            else:
                reply = (
                    f"I couldn't find an active task matching '**{target}**' in your database.\n"
                    f"Ask me to 'Show my pending tasks' to verify the exact task name."
                )
            return {
                "reply": reply,
                "success": False,
                "action": "complete_task",
                "tasks_changed": False
            }
        elif len(matches) > 1:
            task_options = [f"• ID {t['id']}: **{t['title']}** ({t['courseCode']})" for t in matches]
            reply = (
                f"I found multiple pending tasks matching '**{target}**':\n\n"
                + "\n".join(task_options)
                + "\n\nPlease clarify by specifying the exact task title. No task was changed."
            )
            return {
                "reply": reply,
                "success": False,
                "action": "complete_task",
                "tasks_changed": False
            }
        else:
            task_to_complete = matches[0]
            updated = update_task(task_to_complete["id"], {"completed": True})
            if not updated:
                return {
                    "reply": f"Database error: Failed to update task '{task_to_complete['title']}'.",
                    "success": False,
                    "action": "complete_task",
                    "tasks_changed": False
                }
            reply = f"🎉 **Task Completed:** Marked '**{task_to_complete['title']}**' ({task_to_complete['courseCode']}) as complete in SQLite!"
            return {
                "reply": reply,
                "success": True,
                "action": "complete_task",
                "tasks_changed": True,
                "tasks": get_all_tasks()
            }

    # ---------------------------------------------------------
    # Intent 7: Delete a task (with explicit confirmation required)
    # ---------------------------------------------------------
    delete_patterns = [
        r'^(?:please\s+)?confirm\s+delete\s+(?:task\s+)?(.+)$',
        r'^(?:please\s+)?yes,?\s+delete\s+(?:task\s+)?(.+)$',
        r'^(?:please\s+)?(?:delete|remove)\s+(?:task\s+)?(.+?)\s+--confirm$',
        r'^(?:please\s+)?(?:delete|remove)\s+(?:task\s+)?(.+)$',
    ]
    delete_match = next((match for pattern in delete_patterns if (match := re.match(pattern, raw_msg, re.IGNORECASE))), None)
    is_explicit_confirmation = bool(delete_match and (
        re.match(r'^(?:please\s+)?(?:confirm\s+delete|yes,?\s+delete)\b', raw_msg, re.IGNORECASE) or
        raw_msg.strip().lower().endswith('--confirm')
    ))

    if delete_match:
        target = delete_match.group(1).strip()

        if not target:
            return {
                "reply": "Which task would you like to delete? Please specify the title (e.g., 'Delete Python DSA practice').",
                "success": False,
                "action": "delete_task",
                "tasks_changed": False
            }

        all_tasks = get_all_tasks()
        exact_matches = exact_title_matches(target, all_tasks)
        if is_explicit_confirmation:
            matches = exact_matches
            if not matches:
                similar = find_matching_tasks(target, all_tasks) or find_similar_tasks(target, all_tasks)
                if similar:
                    return similar_match_reply('delete', target, similar)
        elif exact_matches:
            matches = exact_matches
        else:
            matches = find_matching_tasks(target, all_tasks) or find_similar_tasks(target, all_tasks)
            if matches:
                return similar_match_reply('delete', target, matches)

        if len(matches) == 0:
            return {
                "reply": f"I couldn't find a task matching '**{target}**' to delete in SQLite.",
                "success": False,
                "action": "delete_task",
                "tasks_changed": False
            }
        elif len(matches) > 1:
            task_options = [f"• ID {t['id']}: **{t['title']}** ({t['courseCode']})" for t in matches]
            reply = (
                f"I found multiple tasks matching '**{target}**':\n\n"
                + "\n".join(task_options)
                + "\n\nPlease specify the exact task title to delete. No task was changed."
            )
            return {
                "reply": reply,
                "success": False,
                "action": "delete_task",
                "tasks_changed": False
            }
        else:
            task_to_delete = matches[0]
            if is_explicit_confirmation:
                success = delete_task(task_to_delete["id"])
                if success:
                    reply = f"🗑️ **Task Deleted:** Permanently deleted '**{task_to_delete['title']}**' from your SQLite database."
                    return {
                        "reply": reply,
                        "success": True,
                        "action": "delete_task",
                        "tasks_changed": True,
                        "tasks": get_all_tasks()
                    }
                else:
                    return {
                        "reply": f"Database error: Could not delete task ID {task_to_delete['id']}.",
                        "success": False,
                        "action": "delete_task",
                        "tasks_changed": False
                    }
            else:
                reply = (
                    f"⚠️ **Confirmation Required:** Are you sure you want to delete '**{task_to_delete['title']}**' ({task_to_delete['courseCode']})?\n\n"
                    f"To confirm permanent deletion, please reply:\n"
                    f"**Confirm delete {task_to_delete['title']}**"
                )
                return {
                    "reply": reply,
                    "success": True,
                    "action": "delete_confirmation_prompt",
                    "tasks_changed": False
                }

    # ---------------------------------------------------------
    # Intent 8: Generate study plan from actual pending tasks
    # ---------------------------------------------------------
    if any(p in norm_msg for p in [
        "study plan", "plan my study", "study schedule", "make a study plan",
        "create a study plan", "plan for me", "plan my day", "study blocks"
    ]):
        all_tasks = get_all_tasks()
        pending = [t for t in all_tasks if not t["completed"]]

        if not pending:
            reply = (
                "You have no pending tasks in your SQLite workspace right now! "
                "Add your upcoming assignments first (e.g. 'Add Review Calculus Notes to my tasks'), "
                "and I will generate your Personalized Study Plan."
            )
        else:
            plan_lines, unscheduled_lines = _build_study_plan_blocks(pending)
            reply = (
                f"### 📅 Personalized Study Plan ({len(pending)} Pending SQLite Tasks: "
                f"{len(plan_lines)} scheduled, {len(unscheduled_lines)} unscheduled):\n\n"
                + ("\n".join(plan_lines) if plan_lines else "No sessions fit in the available study window.")
                + ("\n\n### Unscheduled Tasks\n\n" + "\n".join(unscheduled_lines) if unscheduled_lines else "")
                + "\n\n💡 *Sessions are scheduled from 6:30 PM, with 15-minute breaks, and end by midnight.*"
            )

        return {
            "reply": reply,
            "success": True,
            "action": "generate_study_plan",
            "tasks_changed": False,
            "tasks": all_tasks
        }

    # ---------------------------------------------------------
    # Intent 9: Honest fallback for unknown/unsupported requests
    # ---------------------------------------------------------
    reply = (
        f"I couldn't match your request: *\"{raw_msg}\"* to a supported academic action.\n\n"
        f"As your **CampusMate AI Assistant (Simulated Alexa+ Experience)**, I operate directly on your SQLite database. You can ask me:\n"
        f"1. **\"Show my pending tasks\"** — View remaining deliverables\n"
        f"2. **\"How many tasks do I have?\"** — Get exact task counts\n"
        f"3. **\"Show completed tasks\"** — Review finished assignments\n"
        f"4. **\"Add Python DSA practice to my tasks\"** — Insert new task\n"
        f"5. **\"Complete [task name]\"** — Mark deliverable finished\n"
        f"6. **\"Delete [task name]\"** — Remove task (with confirmation)\n"
        f"7. **\"Make a study plan for me\"** — Build a plan from all real pending tasks"
    )
    return {
        "reply": reply,
        "success": False,
        "action": "unknown",
        "tasks_changed": False
    }
