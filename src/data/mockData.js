export const studentProfile = {
  name: "Alex Rivera",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256",
  major: "B.S. Computer Science",
  university: "State Tech University",
  term: "Fall 2026 • Junior Year",
  gpa: "3.84",
  streakDays: 6,
  studyHoursThisWeek: 18.5,
  weeklyTargetHours: 25,
};

export const initialTasks = [
  {
    id: "task-1",
    title: "Implement Dijkstra's Algorithm in Python",
    course: "CS 301 - Algorithms",
    courseCode: "CS 301",
    color: "blue",
    dueDate: "Today, 11:59 PM",
    dueTime: "23:59",
    priority: "High",
    completed: false,
    estimatedMinutes: 90,
  },
  {
    id: "task-2",
    title: "Review Multivariable Calculus Lecture 8 Notes",
    course: "MATH 240 - Calculus III",
    courseCode: "MATH 240",
    color: "purple",
    dueDate: "Today, 5:00 PM",
    dueTime: "17:00",
    priority: "Medium",
    completed: true,
    estimatedMinutes: 45,
  },
  {
    id: "task-3",
    title: "Draft Outline for AI Ethics Term Paper",
    course: "PHIL 210 - Tech Ethics",
    courseCode: "PHIL 210",
    color: "amber",
    dueDate: "Tomorrow, 2:00 PM",
    dueTime: "14:00",
    priority: "High",
    completed: false,
    estimatedMinutes: 60,
  },
  {
    id: "task-4",
    title: "Complete Database Schema Normalization Quiz",
    course: "CS 340 - Database Systems",
    courseCode: "CS 340",
    color: "indigo",
    dueDate: "Oct 23, 11:59 PM",
    dueTime: "23:59",
    priority: "Low",
    completed: false,
    estimatedMinutes: 30,
  },
  {
    id: "task-5",
    title: "Solve Problem Set 4: Vector Fields",
    course: "MATH 240 - Calculus III",
    courseCode: "MATH 240",
    color: "purple",
    dueDate: "Oct 24, 9:00 AM",
    dueTime: "09:00",
    priority: "Medium",
    completed: false,
    estimatedMinutes: 120,
  },
];

export const upcomingAssignments = [
  {
    id: "assign-1",
    title: "Graph Algorithms Problem Set & Benchmarks",
    course: "CS 301 - Data Structures & Algorithms",
    dueDate: "Tomorrow (Oct 21)",
    dueIn: "1 day left",
    urgency: "urgent",
    weight: "15% of final grade",
    submitted: false,
  },
  {
    id: "assign-2",
    title: "Case Study: Algorithmic Bias in Hiring Systems",
    course: "PHIL 210 - Tech Ethics",
    dueDate: "Thursday (Oct 23)",
    dueIn: "3 days left",
    urgency: "moderate",
    weight: "20% of final grade",
    submitted: false,
  },
  {
    id: "assign-3",
    title: "SQL Query Optimization & Indexing Lab",
    course: "CS 340 - Database Systems",
    dueDate: "Sunday (Oct 26)",
    dueIn: "6 days left",
    urgency: "normal",
    weight: "10% of final grade",
    submitted: false,
  },
  {
    id: "assign-4",
    title: "Midterm Exam 2: Triple Integrals & Stokes Theorem",
    course: "MATH 240 - Calculus III",
    dueDate: "Oct 28",
    dueIn: "8 days left",
    urgency: "normal",
    weight: "25% of final grade",
    submitted: false,
  },
];

export const weeklyTimetable = [
  {
    id: "tt-1",
    day: "Monday",
    classes: [
      { time: "09:00 - 10:15 AM", course: "CS 301: Algorithms", room: "Turing Hall 204", professor: "Dr. Vasquez", color: "blue" },
      { time: "11:00 - 12:15 PM", course: "MATH 240: Calculus III", room: "Euler Center 110", professor: "Prof. Klein", color: "purple" },
      { time: "02:00 - 03:30 PM", course: "CS 340: Database Systems Lab", room: "Engineering Lab B", professor: "Dr. O'Connor", color: "indigo" },
    ],
  },
  {
    id: "tt-2",
    day: "Tuesday",
    classes: [
      { time: "10:30 - 11:45 AM", course: "PHIL 210: Tech Ethics", room: "Humanities 302", professor: "Prof. Alvarez", color: "amber" },
      { time: "01:30 - 03:00 PM", course: "CS 301: Algorithms Recitation", room: "Turing Hall 108", professor: "TA Sarah Chen", color: "blue" },
    ],
  },
  {
    id: "tt-3",
    day: "Wednesday",
    classes: [
      { time: "09:00 - 10:15 AM", course: "CS 301: Algorithms", room: "Turing Hall 204", professor: "Dr. Vasquez", color: "blue" },
      { time: "11:00 - 12:15 PM", course: "MATH 240: Calculus III", room: "Euler Center 110", professor: "Prof. Klein", color: "purple" },
      { time: "04:00 - 05:00 PM", course: "Faculty Office Hours", room: "Virtual / Room 412", professor: "Dr. Vasquez", color: "emerald" },
    ],
  },
  {
    id: "tt-4",
    day: "Thursday",
    classes: [
      { time: "10:30 - 11:45 AM", course: "PHIL 210: Tech Ethics", room: "Humanities 302", professor: "Prof. Alvarez", color: "amber" },
      { time: "02:00 - 03:15 PM", course: "CS 340: Database Systems", room: "Engineering Hall 102", professor: "Dr. O'Connor", color: "indigo" },
    ],
  },
  {
    id: "tt-5",
    day: "Friday",
    classes: [
      { time: "11:00 - 12:15 PM", course: "MATH 240: Calculus III", room: "Euler Center 110", professor: "Prof. Klein", color: "purple" },
      { time: "01:00 - 02:30 PM", course: "Open Lab & Study Group", room: "Student Union 3B", professor: "Peer Tutors", color: "cyan" },
    ],
  },
];

export const initialChatMessages = [
  {
    id: "msg-1",
    sender: "assistant",
    timestamp: "10:02 AM",
    content: "Hi Alex! 👋 I'm your **CampusMate AI** academic copilot. I'm connected with your courses, syllabi, and upcoming deadlines.\n\nYou have **Graph Algorithms Problem Set** due tomorrow in CS 301 and a **Calculus problem session** at 11:00 AM.\n\nHow can I help you conquer today?",
    actions: [
      "Generate study plan for tonight",
      "Explain Dijkstra's shortest path",
      "Check tomorrow's schedule",
    ],
  },
  {
    id: "msg-2",
    sender: "user",
    timestamp: "10:04 AM",
    content: "Can you give me a quick intuitive explanation of Dijkstra's algorithm and why we use a priority queue?",
  },
  {
    id: "msg-3",
    sender: "assistant",
    timestamp: "10:04 AM",
    content: "Great question for your **CS 301** assignment!\n\n### 🧭 Intuition Behind Dijkstra's\nImagine ripples spreading in water from your starting point. Dijkstra's expands outward layer-by-layer, always greedily exploring the closest unvisited node.\n\n### ⚡ Why Use a Min-Priority Queue (Heap)?\n* **Without a heap (Array scan):** Finding the minimum distance vertex takes $O(V)$, leading to $O(V^2)$ total time.\n* **With a min-heap:** Extracting the minimum takes $O(\\log V)$ and updating distances (decrease-key) takes $O(\\log V)$, bringing the total runtime to **$O((V + E) \\log V)$**.\n\n```python\nimport heapq\n\ndef dijkstra(graph, start):\n    distances = {node: float('inf') for node in graph}\n    distances[start] = 0\n    pq = [(0, start)]  # (distance, node)\n    \n    while pq:\n        curr_dist, u = heapq.heappop(pq)\n        if curr_dist > distances[u]:\n            continue\n        for v, weight in graph[u].items():\n            distance = curr_dist + weight\n            if distance < distances[v]:\n                distances[v] = distance\n                heapq.heappush(pq, (distance, v))\n    return distances\n```\n\nWould you like me to add a 45-minute coding block to your **Study Planner** for this implementation?",
    actions: [
      "Add 45m Coding Block to Planner",
      "Explain Bellman-Ford difference",
      "Summarize time complexity",
    ],
  },
];

export const quickPromptSuggestions = [
  {
    title: "Explain a concept",
    prompt: "Explain Dijkstra's algorithm and why a min-heap is used",
    icon: "BookOpen",
    category: "Academic",
  },
  {
    title: "Create study plan",
    prompt: "Draft an optimal 2-hour study plan for my Calculus Midterm",
    icon: "Calendar",
    category: "Planning",
  },
  {
    title: "Review upcoming deadlines",
    prompt: "What are my highest priority assignments due this week?",
    icon: "Clock",
    category: "Organization",
  },
  {
    title: "Draft professor email",
    prompt: "Help me write a concise email to Dr. Vasquez asking for office hours",
    icon: "Mail",
    category: "Communication",
  },
];
