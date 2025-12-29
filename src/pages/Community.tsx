import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTaskStore } from '@/store/taskStore';
import { useAuth } from '@/contexts/AuthContext';
import { Board } from '@/types/task';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Lock, Globe, Calendar, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { BoardDetailModal } from '@/components/board/BoardDetailModal';

export default function Community() {
  const navigate = useNavigate();
  const { boards, setCurrentBoard } = useTaskStore();
  const { user } = useAuth();
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Get all public boards
  const publicBoards = boards.filter((board) => board.isPublic);

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
          <div className="flex items-center gap-4">
            {user ? (
              <Link to="/dashboard">
                <Button>
                  Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
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

        {publicBoards.length === 0 ? (
          <Card className="glass">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Globe className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No public boards available yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicBoards.map((board) => (
              <BoardCard key={board.id} board={board} onClick={() => handleBoardClick(board)} />
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

function BoardCard({ board, onClick }: { board: Board; onClick: () => void }) {
  const taskCount = board.columns.reduce((sum, col) => sum + col.taskIds.length, 0);
  
  return (
    <Card className="glass hover:glass-hover transition-all cursor-pointer" onClick={onClick}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1">{board.title}</CardTitle>
            <CardDescription className="line-clamp-2">
              {board.description || 'No description'}
            </CardDescription>
          </div>
          <Badge variant="outline" className="ml-2">
            <Globe className="h-3 w-3 mr-1" />
            Public
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{board.members.length} members</span>
            </div>
            <div className="flex items-center gap-1">
              <span>{taskCount} tasks</span>
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

