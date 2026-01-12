import { useState, useEffect } from 'react';
import { Plus, Users, Moon, Sun, Menu } from 'lucide-react';
import { Board, Task } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useAuth } from '@/contexts/AuthContext';
import { AnimatedLogo } from './AnimatedLogo';

interface HeaderProps {
  board: Board | null;
  onInvite?: () => void;
  tasks?: Task[];
  onBoardClick?: () => void;
  onMenuClick?: () => void;
}

export function Header({ board, onInvite, tasks = [], onBoardClick, onMenuClick }: HeaderProps) {
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
    <header className="glass border-b border-border/50 px-2 sm:px-4 md:px-6 py-2 md:py-3 flex items-center justify-between sticky top-0 z-30 bg-background/60 backdrop-blur-xl">
      <div className="flex items-center gap-1 sm:gap-2 md:gap-6 flex-1 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-8 w-8 sm:h-9 sm:w-9 shrink-0"
          onClick={onMenuClick}
        >
          <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>

        <div className="scale-75 sm:scale-90 md:scale-100 origin-left shrink-0">
          <AnimatedLogo size="sm" showTagline={false} onClick={() => (window.location.href = '/dashboard')} />
        </div>

        {board && (
          <div className="flex items-center gap-1 sm:gap-2 pl-2 sm:pl-3 md:pl-6 border-l border-border/50 overflow-hidden flex-1 min-w-0">
            <h2
              className="text-xs sm:text-[13px] md:text-lg font-bold text-foreground truncate max-w-[60px] xs:max-w-[100px] sm:max-w-[150px] lg:max-w-none cursor-pointer hover:text-primary transition-colors tracking-tight"
              onClick={onBoardClick}
            >
              {board.title}
            </h2>
            {board.isShared && (
              <Badge variant="outline" className="hidden sm:flex text-[10px] md:text-xs text-accent border-accent/20 bg-accent/5 whitespace-nowrap px-1.5 py-0">
                <Users className="h-3 w-3 mr-1" />
                Shared
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5 md:gap-3 shrink-0">
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
        {board && (() => {
          // Check if user is owner or admin
          const boardOwnerId = typeof board.ownerId === 'object' ? (board.ownerId as any)._id || (board.ownerId as any).id : board.ownerId;
          const isOwner = boardOwnerId === user?.id;
          const userMember = board.members?.find((m) => m.id === user?.id);
          const isAdmin = isOwner || userMember?.role === 'admin';

          return isAdmin ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 px-2 sm:px-3"
              onClick={onInvite}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Invite</span>
            </Button>
          ) : null;
        })()}

        {/* Notifications */}
        <NotificationBell />

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
