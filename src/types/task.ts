export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type LabelColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'cyan';

export interface Label {
  id: string;
  name: string;
  color: LabelColor;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  labels: Label[];
  status: 'todo' | 'in-progress' | 'done';
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  columnId: string; // Map to status for UI
  boardId: string;
  assignee?: TeamMember;
  position: number;
  commentsCount?: number;
}

export interface Comment {
  id: string;
  _id?: string;
  taskId: string;
  userId: string;
  userName: string;
  text: string;
  screenshotUrl?: string;
  type: 'comment' | 'completion';
  parentId?: string | null;
  createdAt: string;
}

export interface Column {
  id: string;
  title: string;
  taskIds: string[];
  position: number;
}

export interface Board {
  id: string;
  title: string;
  description: string;
  columns: Column[]; // Virtual columns for UI
  createdAt: string;
  updatedAt: string;
  isShared: boolean;
  isPublic: boolean;
  ownerId: string;
  members: TeamMember[];
  taskCount?: number;
  ownerName?: string;
  ownerAvatar?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'member';
  status: 'active' | 'pending' | 'rejected';
}

export const DEFAULT_LABELS: Label[] = [
  { id: '1', name: 'Bug', color: 'red' },
  { id: '2', name: 'Feature', color: 'blue' },
  { id: '3', name: 'Enhancement', color: 'purple' },
  { id: '4', name: 'Documentation', color: 'cyan' },
  { id: '5', name: 'Design', color: 'pink' },
  { id: '6', name: 'Testing', color: 'yellow' },
  { id: '7', name: 'Urgent', color: 'orange' },
  { id: '8', name: 'Done', color: 'green' },
];

export const PRIORITY_CONFIG: Record<Priority, { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-priority-low/20 text-priority-low border-priority-low/30' },
  medium: { label: 'Medium', className: 'bg-priority-medium/20 text-priority-medium border-priority-medium/30' },
  high: { label: 'High', className: 'bg-priority-high/20 text-priority-high border-priority-high/30' },
  urgent: { label: 'Urgent', className: 'bg-priority-urgent/20 text-priority-urgent border-priority-urgent/30' },
};
