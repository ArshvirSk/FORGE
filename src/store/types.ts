export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Project {
  id: string;
  name: string;
  color: string;
  icon: string;
  weeklyTargetHours: number;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  notes: string;
  dueDate: string; // ISO date string (YYYY-MM-DD)
  estimatedMinutes: number;
  status: TaskStatus;
  createdAt: string;
  completedAt: string | null;
}

export interface FocusSession {
  id: string;
  taskId: string;
  projectId: string;
  startTime: string; // ISO datetime
  endTime: string | null;
  durationMinutes: number;
  completed: boolean;
}
