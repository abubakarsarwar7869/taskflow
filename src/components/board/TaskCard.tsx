import { Draggable } from '@hello-pangea/dnd';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { Calendar, Flag, User, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Task, PRIORITY_CONFIG, LabelColor } from '@/types/task';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  index: number;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const labelColorClasses: Record<LabelColor, string> = {
  red: 'bg-label-red/20 text-label-red border-label-red/30',
  orange: 'bg-label-orange/20 text-label-orange border-label-orange/30',
  yellow: 'bg-label-yellow/20 text-label-yellow border-label-yellow/30',
  green: 'bg-label-green/20 text-label-green border-label-green/30',
  blue: 'bg-label-blue/20 text-label-blue border-label-blue/30',
  purple: 'bg-label-purple/20 text-label-purple border-label-purple/30',
  pink: 'bg-label-pink/20 text-label-pink border-label-pink/30',
  cyan: 'bg-label-cyan/20 text-label-cyan border-label-cyan/30',
};

const getDueDateStatus = (dueDate: string | null) => {
  if (!dueDate) return null;
  const date = new Date(dueDate);
  
  if (isPast(date) && !isToday(date)) {
    return { label: 'Overdue', className: 'text-destructive bg-destructive/10' };
  }
  if (isToday(date)) {
    return { label: 'Today', className: 'text-priority-high bg-priority-high/10' };
  }
  if (isTomorrow(date)) {
    return { label: 'Tomorrow', className: 'text-priority-medium bg-priority-medium/10' };
  }
  return { label: format(date, 'MMM d'), className: 'text-muted-foreground bg-muted' };
};

export function TaskCard({ task, index, onEdit, onDelete }: TaskCardProps) {
  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const dueDateStatus = getDueDateStatus(task.dueDate);

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            'group glass rounded-lg p-4 task-card-glow cursor-grab active:cursor-grabbing',
            snapshot.isDragging && 'glow-primary rotate-2 scale-105'
          )}
        >
          {/* Labels */}
          {task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {task.labels.map((label) => (
                <Badge
                  key={label.id}
                  variant="outline"
                  className={cn('text-xs font-medium border', labelColorClasses[label.color])}
                >
                  {label.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Title & Actions */}
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-foreground leading-tight">{task.title}</h4>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass">
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(task.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Footer: Priority, Due Date, Assignee */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
            <div className="flex items-center gap-2">
              {/* Priority */}
              <Badge variant="outline" className={cn('text-xs border', priorityConfig.className)}>
                <Flag className="h-3 w-3 mr-1" />
                {priorityConfig.label}
              </Badge>

              {/* Due Date */}
              {dueDateStatus && (
                <Badge variant="outline" className={cn('text-xs', dueDateStatus.className)}>
                  <Calendar className="h-3 w-3 mr-1" />
                  {dueDateStatus.label}
                </Badge>
              )}
            </div>

            {/* Assignee */}
            {task.assignee && (
              <div className="flex items-center gap-1.5">
                {task.assignee.avatar ? (
                  <img
                    src={task.assignee.avatar}
                    alt={task.assignee.name}
                    className="h-6 w-6 rounded-full ring-2 ring-border"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-border">
                    <User className="h-3 w-3 text-primary" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
