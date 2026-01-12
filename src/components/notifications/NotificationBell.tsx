import { useState, useEffect, useRef } from 'react';
import { Bell, Layout, ClipboardList, Clock, X, CheckCheck, Globe, Trash2, ArrowRight, AtSign, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import { useTaskStore } from '@/store/taskStore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function NotificationBell() {
  const {
    notifications,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications
  } = useTaskStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const prevNotificationCount = useRef(0);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'board_created':
        return <Layout className="h-4 w-4 text-primary" />;
      case 'task_created':
        return <ClipboardList className="h-4 w-4 text-green-500" />;
      case 'task_deadline':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'board_invite':
        return <Globe className="h-4 w-4 text-blue-500" />;
      case 'task_moved':
        return <ArrowRight className="h-4 w-4 text-blue-400" />;
      case 'task_deleted':
        return <Trash2 className="h-4 w-4 text-red-400" />;
      case 'comment_added':
        return <Bell className="h-4 w-4 text-purple-500" />;
      case 'member_removed':
        return <Trash2 className="h-4 w-4 text-red-500" />;
      case 'member_left':
        return <LogOut className="h-4 w-4 text-orange-400" />;
      case 'mention':
        return <AtSign className="h-4 w-4 text-pink-500" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground flex items-center justify-center ring-2 ring-background">
              {unreadCount > 9 ? '!' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 glass flex flex-col h-[400px]" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h4 className="font-semibold text-foreground">Notifications</h4>
          <div className="flex gap-2">
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
        </div>

        <ScrollArea className="flex-1 min-h-0">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-4 transition-colors group relative hover:bg-muted/30',
                    !notification.read && 'bg-primary/5'
                  )}
                >
                  <div
                    className="flex items-start gap-3 cursor-pointer pr-8"
                    onClick={() => {
                      if (!notification.read) markAsRead(notification.id);
                      if (notification.boardId) {
                        const params: any = { boardId: notification.boardId };
                        if (notification.taskId) {
                          params.taskId = notification.taskId;
                        }
                        setSearchParams(params);
                        setIsOpen(false);
                      }
                    }}
                  >
                    <div className="mt-1">{getIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm leading-tight",
                        !notification.read ? "font-medium text-foreground" : "text-muted-foreground"
                      )}>
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => deleteNotification(notification.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-2 border-t border-border shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllNotifications}
              className="w-full text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3 w-3 mr-2" />
              Clear all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
