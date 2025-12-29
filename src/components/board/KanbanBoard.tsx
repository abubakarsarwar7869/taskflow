import { useState } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import { Board, Task } from '@/types/task';
import { useTaskStore } from '@/store/taskStore';
import { BoardColumn } from './BoardColumn';
import { TaskModal } from './TaskModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface KanbanBoardProps {
  board: Board;
  filteredTaskIds?: string[];
}

export function KanbanBoard({ board, filteredTaskIds }: KanbanBoardProps) {
  const { tasks, moveTask, addColumn, updateColumn, deleteColumn, deleteTask } = useTaskStore();
  
  // Validate board structure
  if (!board || !board.columns || !Array.isArray(board.columns)) {
    console.error('Invalid board structure:', board);
    return (
      <div className="text-center text-muted-foreground py-8">
        Invalid board data. Please refresh the page.
      </div>
    );
  }
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  
  const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [columnTitle, setColumnTitle] = useState('');

  const handleDragEnd = (result: DropResult) => {
    try {
      const { source, destination, draggableId } = result;
      
      if (!destination) return;
      if (source.droppableId === destination.droppableId && source.index === destination.index) return;
      
      if (!draggableId || !source.droppableId || !destination.droppableId) {
        console.error('Invalid drag result:', result);
        return;
      }
      
      moveTask(draggableId, source.droppableId, destination.droppableId, destination.index);
      toast.success('Task moved');
    } catch (error) {
      console.error('Error handling drag end:', error);
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

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
    toast.success('Task deleted');
  };

  const handleAddColumn = () => {
    setEditingColumnId(null);
    setColumnTitle('');
    setIsColumnDialogOpen(true);
  };

  const handleEditColumn = (columnId: string, title: string) => {
    setEditingColumnId(columnId);
    setColumnTitle(title);
    setIsColumnDialogOpen(true);
  };

  const handleDeleteColumn = (columnId: string) => {
    deleteColumn(board.id, columnId);
    toast.success('Column deleted');
  };

  const handleSaveColumn = () => {
    if (!columnTitle.trim()) return;
    
    if (editingColumnId) {
      updateColumn(board.id, editingColumnId, columnTitle.trim());
      toast.success('Column renamed');
    } else {
      addColumn(board.id, columnTitle.trim());
      toast.success('Column added');
    }
    
    setIsColumnDialogOpen(false);
    setColumnTitle('');
  };

  const getColumnTasks = (columnId: string): Task[] => {
    try {
      if (!board.columns || !Array.isArray(board.columns)) return [];
      if (!tasks || typeof tasks !== 'object') return [];
      
      const column = board.columns.find((c) => c && c.id === columnId);
      if (!column || !column.taskIds || !Array.isArray(column.taskIds)) return [];
      
      let columnTasks = column.taskIds
        .map((id) => tasks[id])
        .filter((task) => task && typeof task === 'object' && task.id);
      
      // Apply filtering if filteredTaskIds is provided
      if (filteredTaskIds && Array.isArray(filteredTaskIds)) {
        columnTasks = columnTasks.filter((task) => task.id && filteredTaskIds.includes(task.id));
      }
      
      return columnTasks;
    } catch (error) {
      console.error('Error getting column tasks:', error);
      return [];
    }
  };

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-4 px-1">
          {board.columns && Array.isArray(board.columns) && board.columns.map((column) => {
            if (!column || !column.id) return null;
            return (
              <BoardColumn
                key={column.id}
                column={column}
                tasks={getColumnTasks(column.id)}
                onAddTask={handleAddTask}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onEditColumn={handleEditColumn}
                onDeleteColumn={handleDeleteColumn}
              />
            );
          })}
          
          {/* Add Column Button */}
          <div className="w-full">
            <Button
              variant="outline"
              className="w-full h-12 border-dashed border-2 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
              onClick={handleAddColumn}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Column
            </Button>
          </div>
        </div>
      </DragDropContext>

      {/* Task Modal */}
      <TaskModal
        open={isTaskModalOpen}
        onOpenChange={setIsTaskModalOpen}
        task={editingTask}
        columnId={activeColumnId}
      />

      {/* Column Dialog */}
      <Dialog open={isColumnDialogOpen} onOpenChange={setIsColumnDialogOpen}>
        <DialogContent className="glass sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingColumnId ? 'Rename Column' : 'Add Column'}
            </DialogTitle>
          </DialogHeader>
          <Input
            value={columnTitle}
            onChange={(e) => setColumnTitle(e.target.value)}
            placeholder="Column name"
            className="mt-4"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleSaveColumn()}
          />
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsColumnDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveColumn} disabled={!columnTitle.trim()}>
              {editingColumnId ? 'Save' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
