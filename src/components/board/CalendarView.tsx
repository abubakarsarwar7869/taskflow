import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isSameMonth, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Task, PRIORITY_CONFIG } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CalendarViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onViewTask?: (task: Task) => void;
}

export function CalendarView({ tasks, onEditTask, onViewTask }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Validate tasks prop
  const safeTasks = Array.isArray(tasks) ? tasks.filter(t => t && t.id) : [];

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get start day of week (0 = Sunday)
  const startDayOfWeek = monthStart.getDay();

  // Pad the beginning with empty cells
  const paddingDays = Array(startDayOfWeek).fill(null);

  const getTasksForDay = (date: Date): Task[] => {
    try {
      return safeTasks.filter((task) => {
        if (!task || !task.dueDate) return false;
        try {
          const taskDate = new Date(task.dueDate);
          if (isNaN(taskDate.getTime())) return false;
          return isSameDay(taskDate, date);
        } catch (dateError) {
          console.error('Error parsing task due date:', dateError, task);
          return false;
        }
      });
    } catch (error) {
      console.error('Error getting tasks for day:', error);
      return [];
    }
  };

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="glass rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Calendar View
        </h2>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-medium min-w-[150px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <Button variant="ghost" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Padding cells */}
        {paddingDays.map((_, index) => (
          <div key={`pad-${index}`} className="min-h-[100px] p-2" />
        ))}

        {/* Day cells */}
        {days.map((day) => {
          const dayTasks = getTasksForDay(day);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'min-h-[100px] p-2 rounded-lg border border-border/30 transition-colors',
                isCurrentDay && 'bg-primary/10 border-primary/30',
                !isSameMonth(day, currentMonth) && 'opacity-50'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    'text-sm font-medium',
                    isCurrentDay ? 'text-primary' : 'text-foreground'
                  )}
                >
                  {format(day, 'd')}
                </span>
                {dayTasks.length > 0 && (
                  <Badge variant="secondary" className="text-xs h-5 px-1.5">
                    {dayTasks.length}
                  </Badge>
                )}
              </div>

              <div className="space-y-1">
                {dayTasks.slice(0, 2).map((task) => (
                  <Popover key={task.id}>
                    <PopoverTrigger asChild>
                      <button
                        className={cn(
                          'w-full text-left text-[10px] p-1 rounded truncate transition-colors',
                          'bg-card hover:bg-muted border border-border/50',
                          'focus:outline-none focus:ring-1 focus:ring-primary/50'
                        )}
                      >
                        {task.title}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 glass" align="start">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-foreground text-sm truncate">{task.title}</h4>
                          <Badge
                            variant="outline"
                            className={cn('text-[10px] h-4 px-1', PRIORITY_CONFIG[task.priority].className)}
                          >
                            {PRIORITY_CONFIG[task.priority].label}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-3">
                            {task.description}
                          </p>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-full text-xs h-7"
                          onClick={() => onViewTask ? onViewTask(task) : onEditTask(task)}
                        >
                          View Details
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                ))}

                {dayTasks.length > 2 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-full text-[10px] text-primary hover:underline font-medium mt-1">
                        +{dayTasks.length - 2} more
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 glass p-0" align="start">
                      <div className="p-3 border-b border-border bg-muted/50">
                        <h4 className="font-semibold text-sm">Tasks for {format(day, 'MMM d')}</h4>
                      </div>
                      <ScrollArea className="h-48 p-2">
                        <div className="space-y-1">
                          {dayTasks.map(task => (
                            <button
                              key={task.id}
                              onClick={() => {
                                onViewTask ? onViewTask(task) : onEditTask(task);
                              }}
                              className="w-full text-left text-xs p-2 rounded hover:bg-muted transition-colors border border-transparent hover:border-border"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="truncate font-medium">{task.title}</span>
                                <Badge variant="outline" className={cn('text-[10px] h-4 px-1 flex-shrink-0', PRIORITY_CONFIG[task.priority].className)}>
                                  {task.priority[0].toUpperCase()}
                                </Badge>
                              </div>
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
