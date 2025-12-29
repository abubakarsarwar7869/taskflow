import { useState, useEffect } from 'react';
import { Bell, Calendar, Clock, X, CheckCheck } from 'lucide-react';
import { format, isPast, isToday, isTomorrow, differenceInHours } from 'date-fns';
import { Task, PRIORITY_CONFIG } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  task: Task;
  type: 'overdue' | 'due-today' | 'due-soon' | 'reminder';
  read: boolean;
}

interface NotificationBellProps {
  tasks: Task[];
}

export function NotificationBell({ tasks }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Generate notifications based on task due dates
    const now = new Date();
    const newNotifications: Notification[] = [];

    tasks.forEach((task) => {
      if (!task.dueDate) return;
      
      const dueDate = new Date(task.dueDate);
      const hoursUntilDue = differenceInHours(dueDate, now);

      if (isPast(dueDate) && !isToday(dueDate)) {
        newNotifications.push({
          id: `overdue-${task.id}`,
          task,
          type: 'overdue',
          read: false,
        });
      } else if (isToday(dueDate)) {
        newNotifications.push({
          id: `today-${task.id}`,
          task,
          type: 'due-today',
          read: false,
        });
      } else if (isTomorrow(dueDate) || hoursUntilDue <= 48) {
        newNotifications.push({
          id: `soon-${task.id}`,
          task,
          type: 'due-soon',
          read: false,
        });
      }
    });

    setNotifications(newNotifications);
  }, [tasks]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const dismissNotification = (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  const getNotificationStyle = (type: Notification['type']) => {
    switch (type) {
      case 'overdue':
        return 'border-l-destructive bg-destructive/5';
      case 'due-today':
        return 'border-l-priority-high bg-priority-high/5';
      case 'due-soon':
        return 'border-l-priority-medium bg-priority-medium/5';
      default:
        return 'border-l-primary bg-primary/5';
    }
  };

  const getNotificationMessage = (notification: Notification) => {
    switch (notification.type) {
      case 'overdue':
        return 'Task is overdue!';
      case 'due-today':
        return 'Due today';
      case 'due-soon':
        return 'Due soon';
      default:
        return 'Reminder';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 glass" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h4 className="font-semibold text-foreground">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-auto py-1"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications</p>
              <p className="text-xs text-muted-foreground/70">
                You're all caught up!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-4 border-l-4 transition-colors cursor-pointer',
                    getNotificationStyle(notification.type),
                    !notification.read && 'bg-muted/30'
                  )}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {notification.task.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getNotificationMessage(notification)}
                      </p>
                      {notification.task.dueDate && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(notification.task.dueDate), 'MMM d, h:mm a')}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissNotification(notification.id);
                      }}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
