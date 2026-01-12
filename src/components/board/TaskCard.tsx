import { Draggable } from '@hello-pangea/dnd';
import { createPortal } from 'react-dom';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { Calendar, Flag, User, MoreHorizontal, Pencil, Trash2, MessageSquare } from 'lucide-react';
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
  isAdmin: boolean;
  onEdit: (task: Task) => void;
  onView: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const labelColorClasses: Record<LabelColor, string> = {
  red: 'bg-label-red/30 text-label-red border-label-red/40 hover:bg-label-red/40',
  orange: 'bg-label-orange/30 text-label-orange border-label-orange/40 hover:bg-label-orange/40',
  yellow: 'bg-label-yellow/30 text-label-yellow border-label-yellow/40 hover:bg-label-yellow/40',
  green: 'bg-label-green/30 text-label-green border-label-green/40 hover:bg-label-green/40',
  blue: 'bg-label-blue/30 text-label-blue border-label-blue/40 hover:bg-label-blue/40',
  purple: 'bg-label-purple/30 text-label-purple border-label-purple/40 hover:bg-label-purple/40',
  pink: 'bg-label-pink/30 text-label-pink border-label-pink/40 hover:bg-label-pink/40',
  cyan: 'bg-label-cyan/30 text-label-cyan border-label-cyan/40 hover:bg-label-cyan/40',
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

export function TaskCard({ task, index, isAdmin, onEdit, onView, onDelete }: TaskCardProps) {
  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const dueDateStatus = getDueDateStatus(task.dueDate);

  return (
    <Draggable draggableId={task.id} index={index} isDragDisabled={!isAdmin}>
      {(provided, snapshot) => {
        const isDragging = snapshot.isDragging;

        const content = (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={{
              ...provided.draggableProps.style,
              zIndex: isDragging ? 10000 : 1,
            }}
            className={cn(
              'group outline-none select-none',
              isDragging && 'z-[10000]'
            )}
            onClick={() => !isDragging && onView(task)}
          >
            <div
              className={cn(
                'glass rounded-lg p-4 task-card-glow cursor-pointer transition-[box-shadow,background-color,border-color] duration-200',
                !isAdmin && 'cursor-default',
                isDragging
                  ? 'shadow-2xl ring-2 ring-primary/50 opacity-100 scale-[1.05] rotate-[2deg]'
                  : 'hover:ring-1 hover:ring-primary/30',
                (task.commentsCount || 0) > 0 && 'border-l-4 border-l-primary/50'
              )}
            >
              {/* Labels */}
              {task.labels && task.labels.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {task.labels.map((label) => (
                    <Badge
                      key={label.id}
                      variant="outline"
                      className={cn('text-[10px] sm:text-xs font-semibold border px-2 py-0.5 rounded-full transition-colors cursor-pointer', labelColorClasses[label.color])}
                    >
                      {label.name}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Title & Actions */}
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-medium text-foreground leading-tight truncate">{task.title}</h4>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-7 px-2 flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors",
                      (task.commentsCount || 0) > 0 && "text-primary/80 bg-primary/5 hover:bg-primary/10"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(task);
                    }}
                    title="View discussion"
                  >
                    <MessageSquare className="h-4 w-4" />
                    {(task.commentsCount || 0) > 0 && (
                      <span className="text-xs font-bold">{task.commentsCount}</span>
                    )}
                  </Button>

                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onEdit(task);
                        }}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(task.id);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
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
                  <Badge variant="outline" className={cn('text-xs border', priorityConfig.className)}>
                    <Flag className="h-3 w-3 mr-1" />
                    {priorityConfig.label}
                  </Badge>

                  {dueDateStatus && (
                    <Badge variant="outline" className={cn('text-xs', dueDateStatus.className)}>
                      <Calendar className="h-3 w-3 mr-1" />
                      {dueDateStatus.label}
                    </Badge>
                  )}
                </div>

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
          </div>
        );

        if (isDragging) {
          return createPortal(content, document.body);
        }
        return content;
      }}
    </Draggable>
  );
}
