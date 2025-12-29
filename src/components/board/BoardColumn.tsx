import { Droppable } from '@hello-pangea/dnd';
import { Plus, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Column as ColumnType, Task } from '@/types/task';
import { TaskCard } from './TaskCard';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface BoardColumnProps {
  column: ColumnType;
  tasks: Task[];
  onAddTask: (columnId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onEditColumn: (columnId: string, title: string) => void;
  onDeleteColumn: (columnId: string) => void;
}

export function BoardColumn({
  column,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onEditColumn,
  onDeleteColumn,
}: BoardColumnProps) {
  // Validate props
  if (!column || !column.id) {
    console.error('Invalid column:', column);
    return null;
  }
  
  const safeTasks = Array.isArray(tasks) ? tasks.filter(t => t && t.id) : [];
  const columnTitle = column.title || 'Untitled';
  
  return (
    <div className="flex flex-col w-full h-full">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 px-1 shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">{columnTitle}</h3>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {safeTasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => onAddTask(column.id)}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass">
              <DropdownMenuItem onClick={() => onEditColumn(column.id, column.title)}>
                <Pencil className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDeleteColumn(column.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'flex-1 min-h-[200px] p-2 rounded-xl transition-colors duration-200',
              snapshot.isDraggingOver
                ? 'bg-primary/5 border-2 border-dashed border-primary/30'
                : 'bg-muted/30'
            )}
          >
            {safeTasks.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {safeTasks.map((task, index) => {
                  if (!task || !task.id) return null;
                  return (
                    <TaskCard
                      key={task.id}
                      task={task}
                      index={index}
                      onEdit={onEditTask}
                      onDelete={onDeleteTask}
                    />
                  );
                })}
                {provided.placeholder}
              </div>
            ) : (
              <>
                {provided.placeholder}
                {!snapshot.isDraggingOver && (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <p className="text-sm">No tasks yet</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-primary"
                      onClick={() => onAddTask(column.id)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add task
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
