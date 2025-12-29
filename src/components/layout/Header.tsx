import { useState, useEffect } from 'react';
import { Plus, Users, Moon, Sun } from 'lucide-react';
import { Board, Task } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  board: Board | null;
  onInvite?: () => void;
  tasks?: Task[];
  onBoardClick?: () => void;
}

export function Header({ board, onInvite, tasks = [], onBoardClick }: HeaderProps) {
  const { user } = useAuth();
  const [fullName, setFullName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [isDark, setIsDark] = useState<boolean>(() => {
    // Check if dark mode is set in localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (user) {
      // Load profile from localStorage
      const savedFullName = localStorage.getItem(`profile_fullName_${user.id}`);
      if (savedFullName) {
        setFullName(savedFullName);
      }

      // Load avatar from localStorage
      const savedAvatar = localStorage.getItem(`profile_avatar_${user.id}`);
      if (savedAvatar) {
        setAvatarUrl(savedAvatar);
      }

      // Listen for user updates
      const handleUserUpdate = () => {
        const updatedFullName = localStorage.getItem(`profile_fullName_${user.id}`);
        const updatedAvatar = localStorage.getItem(`profile_avatar_${user.id}`);
        if (updatedFullName) setFullName(updatedFullName);
        if (updatedAvatar) setAvatarUrl(updatedAvatar);
        else setAvatarUrl('');
      };

      window.addEventListener('userUpdated', handleUserUpdate);
      return () => window.removeEventListener('userUpdated', handleUserUpdate);
    }
  }, [user]);

  // Apply theme on mount and when it changes
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };
  
  // Get user initials
  const getInitials = () => {
    if (fullName) {
      return fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <header className="h-16 glass border-b border-border/50 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        {board ? (
          <div className="flex items-center gap-3">
            <h2 
              className="text-lg font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
              onClick={onBoardClick}
            >
              {board.title}
            </h2>
            {board.isShared && (
              <Badge variant="outline" className="text-accent border-accent/30 bg-accent/10">
                <Users className="h-3 w-3 mr-1" />
                Shared
              </Badge>
            )}
          </div>
        ) : (
          <h2 className="text-lg font-semibold text-muted-foreground">
            Select or create a board
          </h2>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={toggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        {/* Invite */}
        {board && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={onInvite}
          >
            <Plus className="h-4 w-4" />
            Invite
          </Button>
        )}

        {/* Notifications */}
        <NotificationBell tasks={tasks} />

        {/* Avatar */}
        <Avatar className="h-8 w-8">
          <AvatarImage src={avatarUrl} alt={fullName || user?.email} />
          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-sm font-medium">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
