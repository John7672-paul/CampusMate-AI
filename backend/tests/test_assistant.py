import unittest
from unittest.mock import patch

import assistant


def task(task_id, title, completed=False, priority="Medium", due_date="Tomorrow, 5:00 PM"):
    return {
        "id": task_id,
        "title": title,
        "course": "MATH 240 - Calculus III",
        "courseCode": "MATH 240",
        "dueDate": due_date,
        "priority": priority,
        "estimatedMinutes": 45,
        "completed": completed,
    }


class AssistantTaskMatchingTests(unittest.TestCase):
    def setUp(self):
        self.tasks = [
            task(1, "Read calculus notes"),
            task(2, "Read calculus textbook"),
            task(3, "Submit lab report"),
        ]
        self.get_tasks = patch.object(assistant, "get_all_tasks", side_effect=lambda: list(self.tasks))
        self.get_tasks.start()
        self.addCleanup(self.get_tasks.stop)

    def apply_completion(self, task_id, updates):
        target = next(item for item in self.tasks if item["id"] == task_id)
        target.update(updates)
        return target

    def test_exact_task_title_completes_without_fuzzy_confirmation(self):
        with patch.object(assistant, "update_task", side_effect=self.apply_completion) as update:
            result = assistant.process_assistant_message("Complete Read calculus notes")

        self.assertTrue(result["success"])
        self.assertEqual("complete_task", result["action"])
        self.assertTrue(self.tasks[0]["completed"])
        update.assert_called_once_with(1, {"completed": True})

    def test_similar_task_title_requires_explicit_confirmation(self):
        with patch.object(assistant, "update_task") as update:
            prompt = assistant.process_assistant_message("Complete Read calculus note")

        self.assertIn("Did you mean Read calculus notes?", prompt["reply"])
        self.assertFalse(prompt["tasks_changed"])
        update.assert_not_called()

        with patch.object(assistant, "update_task", side_effect=self.apply_completion) as update:
            confirmed = assistant.process_assistant_message("Confirm complete Read calculus notes")

        self.assertTrue(confirmed["success"])
        update.assert_called_once_with(1, {"completed": True})

    def test_ambiguous_candidates_are_not_changed(self):
        self.tasks[1]["title"] = "Review calculus notes"
        with patch.object(assistant, "update_task") as update:
            result = assistant.process_assistant_message("Complete calculus notes")

        self.assertIn("several similar tasks", result["reply"])
        self.assertFalse(result["tasks_changed"])
        update.assert_not_called()
        self.assertFalse(any(item["completed"] for item in self.tasks))

    def test_delete_requires_confirmation_and_fuzzy_delete_requires_exact_title(self):
        with patch.object(assistant, "delete_task") as delete:
            prompt = assistant.process_assistant_message("Delete Submit lab repot")

        self.assertIn("Did you mean Submit lab report?", prompt["reply"])
        self.assertFalse(prompt["tasks_changed"])
        delete.assert_not_called()

        with patch.object(assistant, "delete_task", side_effect=lambda task_id: self.tasks.remove(next(t for t in self.tasks if t["id"] == task_id)) or True) as delete:
            confirmed = assistant.process_assistant_message("Confirm delete Submit lab report")

        self.assertTrue(confirmed["success"])
        self.assertNotIn(3, [item["id"] for item in self.tasks])
        delete.assert_called_once_with(3)

    def test_exact_delete_does_not_mutate_until_confirmed(self):
        with patch.object(assistant, "delete_task") as delete:
            prompt = assistant.process_assistant_message("Delete Submit lab report")

        self.assertEqual("delete_confirmation_prompt", prompt["action"])
        self.assertFalse(prompt["tasks_changed"])
        delete.assert_not_called()

        with patch.object(assistant, "delete_task", return_value=True) as delete:
            confirmed = assistant.process_assistant_message("Confirm delete Submit lab report")

        self.assertTrue(confirmed["success"])
        delete.assert_called_once_with(3)

    def test_no_matching_task_is_reported_without_mutation(self):
        with patch.object(assistant, "update_task") as update, patch.object(assistant, "delete_task") as delete:
            result = assistant.process_assistant_message("Complete quantum mechanics paper")

        self.assertIn("couldn't find an active task", result["reply"])
        self.assertFalse(result["success"])
        self.assertFalse(result["tasks_changed"])
        update.assert_not_called()
        delete.assert_not_called()


class TaskCreationTests(unittest.TestCase):
    def test_duplicate_pending_title_prompts_before_creating_and_allows_confirmation(self):
        existing = [task(1, "Python DSA practice")]
        with patch.object(assistant, "get_all_tasks", return_value=existing), \
                patch.object(assistant, "create_task") as create:
            prompt = assistant.process_assistant_message("Add Python DSA practice to my tasks")

        self.assertEqual("add_confirmation_prompt", prompt["action"])
        self.assertIn("(pending)", prompt["reply"])
        self.assertFalse(prompt["tasks_changed"])
        create.assert_not_called()

        created_task = task(2, "Python DSA practice")
        with patch.object(assistant, "create_task", return_value=created_task) as create, \
                patch.object(assistant, "get_all_tasks", return_value=[*existing, created_task]):
            confirmed = assistant.process_assistant_message("Confirm add Python DSA practice")

        self.assertTrue(confirmed["success"])
        create.assert_called_once()

    def test_matching_completed_title_prompts_without_changing_existing_record(self):
        existing = [task(1, "Python DSA practice", completed=True)]
        with patch.object(assistant, "get_all_tasks", return_value=existing), \
                patch.object(assistant, "create_task") as create:
            result = assistant.process_assistant_message("Add python dsa practice to my tasks")

        self.assertEqual("add_confirmation_prompt", result["action"])
        self.assertIn("(completed)", result["reply"])
        self.assertFalse(result["tasks_changed"])
        self.assertTrue(existing[0]["completed"])
        create.assert_not_called()

    def test_similar_but_distinct_title_is_created_without_duplicate_prompt(self):
        existing = [task(1, "Python DSA practice to my tasks")]
        created_task = task(2, "Python DSA practice")
        with patch.object(assistant, "get_all_tasks", return_value=existing), \
                patch.object(assistant, "create_task", return_value=created_task) as create:
            result = assistant.process_assistant_message("Add Python DSA practice to my tasks")

        self.assertEqual("add_task", result["action"])
        self.assertTrue(result["tasks_changed"])
        create.assert_called_once()

    def test_task_command_phrases_are_removed_but_title_words_are_preserved(self):
        cases = [
            ("Add Python DSA practice to my tasks", "Python DSA practice"),
            ("Create a task called Read the task management chapter", "Read the task management chapter"),
            ("Please insert Review: graphs and trees to the task list", "Review: graphs and trees"),
            ("New Finish calculus practice in my planner", "Finish calculus practice"),
            ("Create task named Design a new task tracker", "Design a new task tracker"),
        ]

        for command, expected_title in cases:
            with self.subTest(command=command):
                with patch.object(assistant, "create_task", side_effect=lambda data: {**data, "id": 10}), \
                        patch.object(assistant, "get_all_tasks", return_value=[]):
                    result = assistant.process_assistant_message(command)

                self.assertEqual("add_task", result["action"])
                self.assertIn(f"**{expected_title}**", result["reply"])

    def test_extracted_task_title_still_matches_task_by_title(self):
        with patch.object(assistant, "create_task", side_effect=lambda data: {**data, "id": 10}), \
                patch.object(assistant, "get_all_tasks", return_value=[]):
            assistant.process_assistant_message("Add Python DSA practice to my tasks")

        matches = assistant.find_matching_tasks("Python DSA practice", [task(10, "Python DSA practice")])
        self.assertEqual([10], [match["id"] for match in matches])

class StudyPlanTests(unittest.TestCase):
    def setUp(self):
        self.tasks = [
            task(1, "Later medium task", priority="Medium", due_date="Oct 25, 5:00 PM"),
            task(2, "Low priority task", priority="Low", due_date="Today, 5:00 PM"),
            task(3, "High later task", priority="High", due_date="Oct 25, 5:00 PM"),
            task(4, "High sooner task", priority="High", due_date="Tomorrow, 5:00 PM"),
            task(5, "Already completed", completed=True, priority="High"),
        ]
        self.get_tasks = patch.object(assistant, "get_all_tasks", side_effect=lambda: list(self.tasks))
        self.get_tasks.start()
        self.addCleanup(self.get_tasks.stop)

    def generate_plan(self):
        return assistant.process_assistant_message("Make a study plan for me")

    def test_plan_count_matches_all_scheduled_pending_tasks(self):
        result = self.generate_plan()

        self.assertIn("4 Pending SQLite Tasks", result["reply"])
        scheduled = [item for item in self.tasks if not item["completed"] and item["title"] in result["reply"]]
        self.assertEqual(4, len(scheduled))
        self.assertEqual("generate_study_plan", result["action"])

    def test_every_pending_task_is_scheduled_and_completed_tasks_are_excluded(self):
        result = self.generate_plan()

        for pending_task in (item for item in self.tasks if not item["completed"]):
            self.assertIn(pending_task["title"], result["reply"])
        self.assertNotIn("Already completed", result["reply"])

    def test_priority_and_due_date_order_are_respected(self):
        result = self.generate_plan()
        reply = result["reply"]

        self.assertLess(reply.index("Low priority task"), reply.index("High sooner task"))
        self.assertLess(reply.index("High sooner task"), reply.index("High later task"))
        self.assertLess(reply.index("High later task"), reply.index("Later medium task"))

    def test_sessions_end_by_midnight_and_overflow_is_explicitly_unscheduled(self):
        self.tasks = [
            task(1, "Fits before midnight", priority="High", due_date="Today, 9:00 PM"),
            task(2, "Does not fit after break", priority="High", due_date="Tomorrow, 9:00 PM"),
        ]
        self.tasks[0]["estimatedMinutes"] = 270
        self.tasks[1]["estimatedMinutes"] = 60

        result = self.generate_plan()

        self.assertIn("2 Pending SQLite Tasks: 1 scheduled, 1 unscheduled", result["reply"])
        self.assertIn("Fits before midnight", result["reply"])
        self.assertIn("Does not fit after break", result["reply"])
        self.assertIn("Not scheduled", result["reply"])
        self.assertIn("11:00 PM", result["reply"])
        self.assertNotIn("12:15 AM", result["reply"])

    def test_task_larger_than_available_window_is_accounted_for(self):
        self.tasks = [task(1, "Too long for tonight", priority="High", due_date="Today, 9:00 PM")]
        self.tasks[0]["estimatedMinutes"] = 331

        result = self.generate_plan()

        self.assertIn("1 Pending SQLite Tasks: 0 scheduled, 1 unscheduled", result["reply"])
        self.assertIn("No sessions fit in the available study window", result["reply"])
        self.assertIn("Too long for tonight", result["reply"])

    def test_empty_pending_task_list_returns_zero_count_and_no_task_blocks(self):
        self.tasks = [task(6, "Done", completed=True)]

        result = self.generate_plan()

        self.assertIn("no pending tasks", result["reply"])
        self.assertNotIn("Based on ", result["reply"])
        self.assertNotIn("**Done**", result["reply"])


if __name__ == "__main__":
    unittest.main()
