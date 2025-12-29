import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task, Column, Board, Label, Priority, TeamMember, DEFAULT_LABELS } from '@/types/task';

interface TaskState {
  boards: Board[];
  tasks: Record<string, Task>;
  currentBoardId: string | null;
  availableLabels: Label[];
  
  // Board actions
      createBoard: (title: string, description?: string, isPublic?: boolean, ownerId?: string, ownerEmail?: string, ownerName?: string) => string;
  updateBoard: (boardId: string, updates: Partial<Board>) => void;
  deleteBoard: (boardId: string) => void;
  setCurrentBoard: (boardId: string) => void;
  
  // Column actions
  addColumn: (boardId: string, title: string) => void;
  updateColumn: (boardId: string, columnId: string, title: string) => void;
  deleteColumn: (boardId: string, columnId: string) => void;
  
  // Task actions
  createTask: (columnId: string, task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'position'>) => string;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  moveTask: (taskId: string, sourceColumnId: string, destColumnId: string, destIndex: number) => void;
  
      // Team actions
      addMember: (boardId: string, member: TeamMember) => void;
      removeMember: (boardId: string, memberId: string) => void;
      updateMemberRole: (boardId: string, memberId: string, role: 'admin' | 'member') => void;
  
  // Helper
  getCurrentBoard: () => Board | null;
  getColumnTasks: (columnId: string) => Task[];
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      boards: [],
      tasks: {},
      currentBoardId: null,
      availableLabels: DEFAULT_LABELS,

      createBoard: (title, description = '', isPublic = false, ownerId = '', ownerEmail = '', ownerName = '') => {
        const id = generateId();
        // Automatically add the owner as a member with admin role
        const members: TeamMember[] = [];
        if (ownerId) {
          members.push({
            id: ownerId,
            name: ownerName || 'Owner',
            email: ownerEmail || '',
            role: 'admin',
          });
        }
        
        const newBoard: Board = {
          id,
          title,
          description,
          columns: [
            { id: generateId(), title: 'To Do', taskIds: [], position: 0 },
            { id: generateId(), title: 'In Progress', taskIds: [], position: 1 },
            { id: generateId(), title: 'Done', taskIds: [], position: 2 },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isShared: false,
          isPublic: isPublic ?? false,
          ownerId: ownerId || '',
          members: members,
        };
        
        set((state) => ({
          boards: [...state.boards, newBoard],
          currentBoardId: id,
        }));
        
        return id;
      },

      updateBoard: (boardId, updates) => {
        set((state) => ({
          boards: state.boards.map((board) =>
            board.id === boardId
              ? { ...board, ...updates, updatedAt: new Date().toISOString() }
              : board
          ),
        }));
      },

      deleteBoard: (boardId) => {
        set((state) => {
          const board = state.boards.find((b) => b.id === boardId);
          const taskIdsToRemove = board?.columns.flatMap((c) => c.taskIds) || [];
          const newTasks = { ...state.tasks };
          taskIdsToRemove.forEach((id) => delete newTasks[id]);
          
          return {
            boards: state.boards.filter((b) => b.id !== boardId),
            tasks: newTasks,
            currentBoardId: state.currentBoardId === boardId ? null : state.currentBoardId,
          };
        });
      },

      setCurrentBoard: (boardId) => {
        set({ currentBoardId: boardId });
      },

      addColumn: (boardId, title) => {
        set((state) => ({
          boards: state.boards.map((board) =>
            board.id === boardId
              ? {
                  ...board,
                  columns: [
                    ...board.columns,
                    { id: generateId(), title, taskIds: [], position: board.columns.length },
                  ],
                  updatedAt: new Date().toISOString(),
                }
              : board
          ),
        }));
      },

      updateColumn: (boardId, columnId, title) => {
        set((state) => ({
          boards: state.boards.map((board) =>
            board.id === boardId
              ? {
                  ...board,
                  columns: board.columns.map((col) =>
                    col.id === columnId ? { ...col, title } : col
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : board
          ),
        }));
      },

      deleteColumn: (boardId, columnId) => {
        set((state) => {
          const board = state.boards.find((b) => b.id === boardId);
          const column = board?.columns.find((c) => c.id === columnId);
          const newTasks = { ...state.tasks };
          column?.taskIds.forEach((id) => delete newTasks[id]);
          
          return {
            boards: state.boards.map((b) =>
              b.id === boardId
                ? {
                    ...b,
                    columns: b.columns.filter((c) => c.id !== columnId),
                    updatedAt: new Date().toISOString(),
                  }
                : b
            ),
            tasks: newTasks,
          };
        });
      },

      createTask: (columnId, taskData) => {
        const id = generateId();
        const { currentBoardId, boards, tasks } = get();
        const board = boards.find((b) => b.id === currentBoardId);
        const column = board?.columns.find((c) => c.id === columnId);
        
        const newTask: Task = {
          ...taskData,
          id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          position: column?.taskIds.length || 0,
        };

        set((state) => ({
          tasks: { ...state.tasks, [id]: newTask },
          boards: state.boards.map((b) =>
            b.id === currentBoardId
              ? {
                  ...b,
                  columns: b.columns.map((c) =>
                    c.id === columnId ? { ...c, taskIds: [...c.taskIds, id] } : c
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : b
          ),
        }));

        return id;
      },

      updateTask: (taskId, updates) => {
        set((state) => ({
          tasks: {
            ...state.tasks,
            [taskId]: {
              ...state.tasks[taskId],
              ...updates,
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      deleteTask: (taskId) => {
        const { tasks, currentBoardId } = get();
        const task = tasks[taskId];
        
        set((state) => {
          const newTasks = { ...state.tasks };
          delete newTasks[taskId];
          
          return {
            tasks: newTasks,
            boards: state.boards.map((b) =>
              b.id === currentBoardId
                ? {
                    ...b,
                    columns: b.columns.map((c) =>
                      c.id === task.columnId
                        ? { ...c, taskIds: c.taskIds.filter((id) => id !== taskId) }
                        : c
                    ),
                    updatedAt: new Date().toISOString(),
                  }
                : b
            ),
          };
        });
      },

      moveTask: (taskId, sourceColumnId, destColumnId, destIndex) => {
        const { currentBoardId } = get();
        
        set((state) => ({
          tasks: {
            ...state.tasks,
            [taskId]: {
              ...state.tasks[taskId],
              columnId: destColumnId,
              updatedAt: new Date().toISOString(),
            },
          },
          boards: state.boards.map((b) => {
            if (b.id !== currentBoardId) return b;
            
            return {
              ...b,
              columns: b.columns.map((col) => {
                if (col.id === sourceColumnId && col.id === destColumnId) {
                  // Same column reorder
                  const newTaskIds = col.taskIds.filter((id) => id !== taskId);
                  newTaskIds.splice(destIndex, 0, taskId);
                  return { ...col, taskIds: newTaskIds };
                }
                if (col.id === sourceColumnId) {
                  return { ...col, taskIds: col.taskIds.filter((id) => id !== taskId) };
                }
                if (col.id === destColumnId) {
                  const newTaskIds = [...col.taskIds];
                  newTaskIds.splice(destIndex, 0, taskId);
                  return { ...col, taskIds: newTaskIds };
                }
                return col;
              }),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      addMember: (boardId, member) => {
        set((state) => ({
          boards: state.boards.map((b) =>
            b.id === boardId
              ? { ...b, members: [...b.members, member], isShared: true }
              : b
          ),
        }));
      },

      removeMember: (boardId, memberId) => {
        set((state) => ({
          boards: state.boards.map((b) =>
            b.id === boardId
              ? {
                  ...b,
                  members: b.members.filter((m) => m.id !== memberId),
                  isShared: b.members.length > 1,
                }
              : b
          ),
        }));
      },

      updateMemberRole: (boardId, memberId, role) => {
        set((state) => ({
          boards: state.boards.map((b) =>
            b.id === boardId
              ? {
                  ...b,
                  members: b.members.map((m) =>
                    m.id === memberId ? { ...m, role } : m
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : b
          ),
        }));
      },

      getCurrentBoard: () => {
        const { boards, currentBoardId } = get();
        return boards.find((b) => b.id === currentBoardId) || null;
      },

      getColumnTasks: (columnId) => {
        try {
          const { tasks, boards, currentBoardId } = get();
          if (!boards || !Array.isArray(boards) || !currentBoardId) return [];
          if (!tasks || typeof tasks !== 'object') return [];
          
          const board = boards.find((b) => b && b.id === currentBoardId);
          if (!board || !board.columns || !Array.isArray(board.columns)) return [];
          
          const column = board.columns.find((c) => c && c.id === columnId);
          if (!column || !column.taskIds || !Array.isArray(column.taskIds)) return [];
          
          return column.taskIds
            .map((id) => tasks[id])
            .filter((task) => task && typeof task === 'object');
        } catch (error) {
          console.error('Error getting column tasks:', error);
          return [];
        }
      },
    }),
    {
      name: 'task-store',
      partialize: (state) => state,
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Error rehydrating store:', error);
          // Clear corrupted data
          localStorage.removeItem('task-store');
          return;
        }
        try {
          if (state?.boards) {
            // Validate and migrate existing boards
            if (!Array.isArray(state.boards)) {
              console.warn('Invalid boards data, resetting');
              state.boards = [];
              return;
            }
            
            state.boards = state.boards
              .filter((board: any) => board && board.id && board.columns && Array.isArray(board.columns))
              .map((board: any) => ({
                ...board,
                id: board.id || Math.random().toString(36).substr(2, 9),
                title: board.title || 'Untitled Board',
                columns: Array.isArray(board.columns) 
                  ? board.columns.filter((col: any) => col && col.id).map((col: any) => ({
                      ...col,
                      taskIds: Array.isArray(col.taskIds) ? col.taskIds : [],
                    }))
                  : [],
                isPublic: board.isPublic ?? false,
                ownerId: board.ownerId || '',
                members: Array.isArray(board.members) 
                  ? (board.members || []).map((member: any) => ({
                      ...member,
                      role: member.role || 'member',
                    }))
                  : [],
              }));
          }
          
          // Validate tasks
          if (state?.tasks && typeof state.tasks !== 'object') {
            console.warn('Invalid tasks data, resetting');
            state.tasks = {};
          }
        } catch (migrationError) {
          console.error('Error migrating store data:', migrationError);
          // Reset to default state on migration error
          state.boards = [];
          state.tasks = {};
          state.currentBoardId = null;
        }
      },
    }
  )
);
