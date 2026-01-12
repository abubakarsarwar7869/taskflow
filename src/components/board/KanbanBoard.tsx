import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Board, Task } from '@/types/task';
import { useTaskStore } from '@/store/taskStore';
import { useAuth } from '@/contexts/AuthContext';
import { BoardColumn } from './BoardColumn';
import { TaskModal } from './TaskModal';
import { TaskDetailModal } from './TaskDetailModal';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

interface KanbanBoardProps {
  board: Board;
  filteredTaskIds?: string[];
  isEditable?: boolean;
}

export function KanbanBoard({ board, filteredTaskIds }: KanbanBoardProps) {
  const { user } = useAuth();
  const { tasks, moveTask, deleteTask, updateBoard } = useTaskStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');

  // Validate board structure
  if (!board || !board.columns || !Array.isArray(board.columns)) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Invalid board data. Please refresh the page.
      </div>
    );
  }

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);

  // Handle opening task from URL (e.g., from notification)
  useEffect(() => {
    const taskId = searchParams.get('taskId');
    if (taskId && tasks[taskId]) {
      setEditingTask(tasks[taskId]);
      setIsDetailModalOpen(true);

      // Clear taskId from URL after opening
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('taskId');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, tasks]);

  // Define isAdmin at component scope so it's available for the render and other handlers
  // Use a more robust check for ownerId since it might be a populated object or a string
  const boardOwnerId = typeof board.ownerId === 'object' ? (board.ownerId as any)._id || (board.ownerId as any).id : board.ownerId;
  const isOwner = boardOwnerId === user?.id;
  const userMember = board.members.find((m) => m.id === user?.id);
  const isAdmin = isOwner || userMember?.role === 'admin' || user?.role === 'admin';

  const handleDragEnd = (result: DropResult) => {
    if (!isAdmin) {
      toast.error('Only board admins can move tasks');
      return;
    }

    try {
      const { source, destination, draggableId } = result;
      if (!destination) return;
      if (source.droppableId === destination.droppableId && source.index === destination.index) return;

      moveTask(draggableId, source.droppableId, destination.droppableId, destination.index);
    } catch (error) {
      toast.error('Failed to move task');
    }
  };

  const handleAddTask = (columnId: string) => {
    setActiveColumnId(columnId);
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setActiveColumnId(task.columnId);
    setIsTaskModalOpen(true);
  };

  const handleViewTask = (task: Task) => {
    setEditingTask(task);
    setIsDetailModalOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
  };

  const handleDeleteColumn = (columnId: string) => {
    const updatedColumns = board.columns.filter(col => col.id !== columnId);
    // Update board with filtered columns
    updateBoard(board.id, { columns: updatedColumns });
    toast.success('Column deleted');
  };

  const getColumnTasks = (columnId: string): Task[] => {
    const column = board.columns.find((c) => c.id === columnId);
    if (!column) return [];

    // Filter tasks from global state that belong to this board and column
    const storeTasks = Object.values(tasks || {}).filter(task =>
      task &&
      task.boardId === board.id &&
      (task.columnId === columnId || task.status === columnId)
    );

    // Map for quick lookup
    const taskMap = new Map(storeTasks.map(t => [t.id, t]));

    // Reconstruct ordered list
    let columnTasks: Task[] = [];
    const processedIds = new Set<string>();

    // 1. Add tasks that are in the prescribed order (preserves drag & drop sorting)
    if (column.taskIds && column.taskIds.length > 0) {
      column.taskIds.forEach(id => {
        const task = taskMap.get(id);
        if (task) {
          columnTasks.push(task);
          processedIds.add(id);
        }
      });
    }

    // 2. Add any tasks that are in the store but NOT in taskIds (e.g. newly created tasks)
    storeTasks.forEach(task => {
      if (!processedIds.has(task.id)) {
        columnTasks.push(task);
      }
    });

    // Apply filtering if active
    if (filteredTaskIds && filteredTaskIds.length > 0) {
      columnTasks = columnTasks.filter((task) => filteredTaskIds.includes(task.id));
    } else if (filteredTaskIds && filteredTaskIds.length === 0) {
      // If filter is active but matches nothing, return empty
      return [];
    }

    return columnTasks;
  };

  const handleAddColumn = async () => {
    if (!newColumnTitle.trim() || !isAdmin) return;

    try {
      const newColumn = {
        id: `col-${Date.now()}`,
        title: newColumnTitle.trim(),
        taskIds: [],
        position: board.columns.length
      };

      await updateBoard(board.id, {
        columns: [...board.columns, newColumn]
      });

      setNewColumnTitle('');
      setIsAddingColumn(false);
      toast.success('Column added');
    } catch (error) {
      toast.error('Failed to add column');
    }
  };

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6 w-full">
          {board.columns.map((column) => (
            <div key={column.id} className="min-w-0 h-full">
              <BoardColumn
                column={column}
                tasks={getColumnTasks(column.id)}
                isAdmin={isAdmin}
                onAddTask={handleAddTask}
                onEditTask={handleEditTask}
                onViewTask={handleViewTask}
                onDeleteTask={handleDeleteTask}
                onDeleteColumn={isAdmin ? handleDeleteColumn : undefined}
              />
            </div>
          ))}

          {/* Add Column Button */}
          {isAdmin && (
            <div className="min-w-0">
              {isAddingColumn ? (
                <div className="bg-muted/30 rounded-xl p-4 border border-border/50 transition-all animate-in fade-in zoom-in-95 duration-200">
                  <input
                    autoFocus
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter column title..."
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddColumn();
                      if (e.key === 'Escape') {
                        setIsAddingColumn(false);
                        setNewColumnTitle('');
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddColumn} className="flex-1">Add Column</Button>
                    <Button size="sm" variant="ghost" onClick={() => {
                      setIsAddingColumn(false);
                      setNewColumnTitle('');
                    }}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  className="h-10 gap-2 hover:bg-primary/10 text-primary transition-all duration-300 rounded-full px-4 border border-primary/20 hover:border-primary/40"
                  onClick={() => setIsAddingColumn(true)}
                >
                  <Plus className="h-4 w-4" />
                  <span className="font-medium text-sm whitespace-nowrap">Add Column</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </DragDropContext>

      <TaskModal
        open={isTaskModalOpen}
        onOpenChange={setIsTaskModalOpen}
        task={editingTask}
        columnId={activeColumnId}
      />

      <TaskDetailModal
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        task={editingTask}
      />
    </>
  );
}
