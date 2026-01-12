import { Droppable } from '@hello-pangea/dnd';
import { Plus, Trash2 } from 'lucide-react';
import { Column as ColumnType, Task } from '@/types/task';
import { TaskCard } from './TaskCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BoardColumnProps {
  column: ColumnType;
  tasks: Task[];
  isAdmin: boolean;
  onAddTask: (columnId: string) => void;
  onEditTask: (task: Task) => void;
  onViewTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onDeleteColumn?: (columnId: string) => void;
}

export function BoardColumn({
  column,
  tasks,
  isAdmin,
  onAddTask,
  onEditTask,
  onViewTask,
  onDeleteTask,
  onDeleteColumn,
}: BoardColumnProps) {
  if (!column || !column.id) return null;

  const safeTasks = Array.isArray(tasks) ? tasks.filter(t => t && t.id) : [];

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex items-center justify-between mb-4 px-1 shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">{column.title}</h3>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {safeTasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => onAddTask(column.id)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
          {isAdmin && onDeleteColumn && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive transition-colors"
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete the column "${column.title}"? All tasks will be lost.`)) {
                  onDeleteColumn(column.id);
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <Droppable droppableId={column.id} isDropDisabled={!isAdmin}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'flex-1 min-h-[200px] p-3 rounded-2xl border border-border/40 space-y-3',
              snapshot.isDraggingOver
                ? 'bg-primary/10 border-primary/40 shadow-glow-primary/20'
                : 'bg-muted/40 backdrop-blur-sm'
            )}
          >
            {safeTasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                isAdmin={isAdmin}
                onEdit={onEditTask}
                onView={onViewTask}
                onDelete={onDeleteTask}
              />
            ))}
            {provided.placeholder}
            {safeTasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground pointer-events-none">
                <p className="text-sm">No tasks yet</p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
