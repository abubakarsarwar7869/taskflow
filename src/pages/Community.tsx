import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTaskStore } from '@/store/taskStore';
import { useAuth } from '@/contexts/AuthContext';
import { Board } from '@/types/task';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Users, Globe, Calendar, ArrowRight, Moon, Sun, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { BoardDetailModal } from '@/components/board/BoardDetailModal';

export default function Community() {
  const navigate = useNavigate();
  const { publicBoards, fetchPublicBoards, setCurrentBoard, loading } = useTaskStore();
  const { user } = useAuth();
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [fullName, setFullName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [isDark, setIsDark] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    fetchPublicBoards();
    // Removed auto-refresh - boards will only update when manually refreshed or new board created
  }, [fetchPublicBoards]);

  useEffect(() => {
    if (user) {
      // Load profile from localStorage
      const savedFullName = localStorage.getItem(`profile_fullName_${user.id}`);
      if (savedFullName) setFullName(savedFullName);

      const savedAvatar = localStorage.getItem(`profile_avatar_${user.id}`);
      if (savedAvatar) setAvatarUrl(savedAvatar);

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

  // Apply theme
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

  const toggleTheme = () => setIsDark(!isDark);

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

  const handleBoardClick = (board: Board) => {
    setSelectedBoard(board);
    setIsDetailOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-xl bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <h1
            className="text-2xl font-bold gradient-text cursor-pointer"
            onClick={() => navigate('/')}
          >
            TaskFlow
          </h1>
          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={toggleTheme}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {user ? (
              <>
                <Link to="/dashboard">
                  <Button>
                    Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl} alt={fullName || user.email} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-sm font-medium">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link to="/auth">
                  <Button>
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="p-6">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold gradient-text mb-2">Community Boards</h1>
            <p className="text-muted-foreground">
              Discover and explore public boards created by the community
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="glass">
                  <CardHeader>
                    <div className="space-y-2">
                      <div className="h-6 bg-muted rounded animate-pulse" />
                      <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
                      <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : publicBoards.length === 0 ? (
            <Card className="glass">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Globe className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No public boards available yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicBoards.map((board) => (
                <BoardCard key={board.id} board={board} onClick={() => handleBoardClick(board)} isPublic />
              ))}
            </div>
          )}
        </div>
      </div>

      <BoardDetailModal
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        board={selectedBoard}
      />
    </div>
  );
}

function BoardCard({ board, onClick, isPublic = false }: { board: Board; onClick: () => void; isPublic?: boolean }) {
  const taskCount = board.taskCount || 0;

  return (
    <Card className="glass hover:glass-hover transition-all cursor-pointer group" onClick={onClick}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1">{board.title}</CardTitle>
            <CardDescription className="line-clamp-2">
              {board.description || 'No description'}
            </CardDescription>
          </div>
          <Badge variant="outline" className="ml-2">
            {isPublic ? (
              <>
                <Globe className="h-3 w-3 mr-1" />
                Public
              </>
            ) : (
              <>
                <Lock className="h-3 w-3 mr-1" />
                Private
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{board.members.length} members</span>
              </div>
              <div className="flex items-center gap-1">
                <span>{taskCount} tasks</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                {board.ownerAvatar ? (
                  <img
                    src={board.ownerAvatar}
                    alt={board.ownerName || 'Owner'}
                    className="h-5 w-5 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary border border-border">
                    {(board.ownerName || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-semibold text-primary/80">
                  {board.ownerName || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(board.createdAt), 'MMM d, yyyy')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

