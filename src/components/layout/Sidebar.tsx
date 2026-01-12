import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Settings, Users, Layout, ChevronDown, Globe, MoreVertical, Edit2, Trash2, Kanban } from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SidebarProps {
  onOpenSettings?: () => void;
}

export function Sidebar({ onOpenSettings }: SidebarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { boards, currentBoardId, setCurrentBoard, createBoard, deleteBoard, removeMember } = useTaskStore();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [boardsExpanded, setBoardsExpanded] = useState(true);
  const [boardToDelete, setBoardToDelete] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';

  // Filter boards to show only those the user has access to
  const accessibleBoards = boards.filter((board) => {
    // System admins can see all boards
    if (isAdmin) return true;

    // User is the owner - handle both populated and unpopulated ownerId
    const ownerIdString = typeof board.ownerId === 'string'
      ? board.ownerId
      : (board.ownerId as any)?._id || (board.ownerId as any)?.id;

    if (ownerIdString === user?.id) return true;

    // User is in the members array
    const isMember = board.members.some(
      (member) => member.id === user?.id || member.email === user?.email
    );
    if (isMember) return true;

    return false;
  });

  // Generate a color for each board based on its ID
  const getBoardColor = (boardId: string) => {
    const colors = [
      'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      'bg-green-500/10 text-green-600 dark:text-green-400',
      'bg-orange-500/10 text-orange-600 dark:text-orange-400',
      'bg-pink-500/10 text-pink-600 dark:text-pink-400',
      'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      'bg-teal-500/10 text-teal-600 dark:text-teal-400',
      'bg-red-500/10 text-red-600 dark:text-red-400',
    ];
    // Use board ID to consistently assign a color
    const index = boardId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const handleCreateBoard = async () => {
    if (!newBoardTitle.trim()) return;
    try {
      await createBoard(
        newBoardTitle.trim(),
        newBoardDescription.trim(),
        isPublic
      );
      setNewBoardTitle('');
      setNewBoardDescription('');
      setIsPublic(false);
      setIsCreateDialogOpen(false);
      toast.success('Board created');
    } catch (error) {
      toast.error('Failed to create board');
    }
  };

  const handleLogoClick = () => {
    // Always navigate to landing page, not dashboard
    window.location.href = '/';
  };

  const handleEditBoard = (boardId: string) => {
    setCurrentBoard(boardId);
    window.dispatchEvent(new CustomEvent('openBoardDetail'));
  };

  const handleDeleteBoard = (boardId: string) => {
    setBoardToDelete(boardId);
  };

  const confirmDeleteBoard = async () => {
    if (boardToDelete) {
      try {
        await deleteBoard(boardToDelete);
        toast.success('Board deleted');
        setBoardToDelete(null);
      } catch (error) {
        toast.error('Failed to delete board');
      }
    }
  };

  return (
    <>
      <aside className="w-72 h-screen glass border-r border-border/50 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-border/50 cursor-pointer" onClick={handleLogoClick}>
          <h1 className="text-xl font-bold gradient-text">TaskFlow</h1>
          <p className="text-xs text-muted-foreground mt-1">Smart Task Management</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {/* Boards Section */}
          <div>
            <button
              onClick={() => setBoardsExpanded(!boardsExpanded)}
              className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              <span className="flex items-center gap-2">
                <Layout className="h-4 w-4" />
                Boards
              </span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform',
                  boardsExpanded && 'rotate-180'
                )}
              />
            </button>

            {boardsExpanded && (
              <div className="space-y-1 ml-6">
                {accessibleBoards.map((board) => (
                  <div
                    key={board.id}
                    className="group relative flex items-center gap-2"
                  >
                    <button
                      onClick={() => setCurrentBoard(board.id)}
                      className={cn(
                        'flex-1 text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2',
                        currentBoardId === board.id
                          ? 'bg-primary/20 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                        getBoardColor(board.id)
                      )}
                    >
                      <div className={cn(
                        'p-1.5 rounded-full flex-shrink-0',
                        getBoardColor(board.id)
                      )}>
                        <Kanban className="h-3.5 w-3.5" />
                      </div>
                      <span className="truncate flex-1 max-w-[130px] inline-block" title={board.title}>{board.title}</span>
                      {board.isShared && (
                        <Users className="h-3 w-3 text-accent flex-shrink-0" />
                      )}
                      {board.isPublic && (
                        <Globe className="h-3 w-3 text-primary flex-shrink-0" />
                      )}
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        {(isAdmin || board.ownerId === user?.id || (board.ownerId as any)?._id === user?.id || board.members.find(m => m.id === user?.id)?.role === 'admin') && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditBoard(board.id);
                            }}
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit Board
                          </DropdownMenuItem>
                        )}
                        {(board.ownerId === user?.id || (board.ownerId as any)?._id === user?.id || user?.role === 'admin') ? (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBoard(board.id);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Board
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={async (e) => {
                              e.stopPropagation();
                              // Leave board
                              if (user?.id) {
                                await removeMember(board.id, user.id);
                                toast.success('Left board');
                              }
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Leave Board
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-muted-foreground hover:text-primary"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Board
                </Button>
              </div>
            )}
          </div>

          {/* Community Link */}
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground hover:text-primary"
              onClick={() => navigate('/community')}
            >
              <Globe className="h-4 w-4 mr-2" />
              See All Community
            </Button>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={onOpenSettings}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </aside>

      {/* Create Board Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="glass sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="gradient-text">Create New Board</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="board-title">Board Name</Label>
              <Input
                id="board-title"
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                placeholder="Enter board name"
                className="bg-background/50"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreateBoard()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="board-description">Description (Optional)</Label>
              <Input
                id="board-description"
                value={newBoardDescription}
                onChange={(e) => setNewBoardDescription(e.target.value)}
                placeholder="Enter board description"
                className="bg-background/50"
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="space-y-0.5">
                <Label htmlFor="public-board" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Public Board
                </Label>
                <p className="text-xs text-muted-foreground">
                  Make this board visible to the community
                </p>
              </div>
              <Switch
                id="public-board"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBoard} disabled={!newBoardTitle.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Board Confirmation */}
      <AlertDialog open={!!boardToDelete} onOpenChange={(open) => !open && setBoardToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Board</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this board? This action cannot be undone and will delete all tasks in this board.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteBoard}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
