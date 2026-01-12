import { useState, useEffect } from 'react';
import { Board, TeamMember } from '@/types/task';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskStore } from '@/store/taskStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, Globe, Lock, Calendar, Crown, User, Edit2, Save, X, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface BoardDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  board: Board | null;
}

export function BoardDetailModal({ open, onOpenChange, board: initialBoard }: BoardDetailModalProps) {
  const { user } = useAuth();
  const { updateBoard, updateMemberRole, boards, publicBoards } = useTaskStore();

  // Use latest board data from store to ensure UI sync
  const board = initialBoard ? (
    boards.find(b => b.id === initialBoard.id) ||
    publicBoards.find(b => b.id === initialBoard.id) ||
    initialBoard
  ) : null;
  const [isPublic, setIsPublic] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    if (board) {
      setIsPublic(board.isPublic);
      setEditTitle(board.title);
      setEditDescription(board.description || '');
    }
  }, [board]);

  if (!board) return null;

  const boardOwnerId = typeof board.ownerId === 'object' ? (board.ownerId as any)._id || (board.ownerId as any).id : board.ownerId;
  const isOwner = boardOwnerId === user?.id;
  const userMember = board.members.find((m) => m.id === user?.id);
  // User is admin if: 
  // 1. They are the owner (by ID match)
  // 2. They are a board admin member
  // 3. They are a system admin
  const isAdmin = isOwner ||
    userMember?.role === 'admin' ||
    user?.role === 'admin';

  const handleSaveEdit = () => {
    if (!editTitle.trim()) {
      toast.error('Board title cannot be empty');
      return;
    }
    if (updateBoard) {
      updateBoard(board.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
      });
      setIsEditing(false);
      toast.success('Board updated successfully');
    }
  };

  const handleCancelEdit = () => {
    setEditTitle(board.title);
    setEditDescription(board.description || '');
    setIsEditing(false);
  };

  const handleTogglePublic = (checked: boolean) => {
    if (!isAdmin) {
      toast.error('Only admins can change board visibility');
      return;
    }
    updateBoard(board.id, { isPublic: checked });
    setIsPublic(checked);
    toast.success(checked ? 'Board is now public' : 'Board is now private');
  };

  const handleRoleChange = (memberId: string, role: 'admin' | 'member') => {
    if (!isOwner) {
      toast.error('Only the board owner can change member roles');
      return;
    }
    updateMemberRole(board.id, memberId, role);
    toast.success(`Member role updated to ${role}`);
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      if (memberId === user?.id) {
        toast.error('You cannot remove yourself from the board details here');
        return;
      }
      await useTaskStore.getState().removeMember(board.id, memberId);
      toast.success('Member removed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove member');
    }
  };

  const taskCount = board.columns && Array.isArray(board.columns)
    ? board.columns.reduce((sum, col) => {
      const taskIds = col?.taskIds || [];
      return sum + (Array.isArray(taskIds) ? taskIds.length : 0);
    }, 0)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            {isEditing ? (
              <div className="flex-1 space-y-2">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Board title"
                  className="text-2xl font-semibold"
                />
              </div>
            ) : (
              <DialogTitle className="text-2xl flex items-center gap-2">
                {board.title}
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setIsEditing(true)}
                    title="Edit board"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </DialogTitle>
            )}
            {isEditing && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCancelEdit}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  onClick={handleSaveEdit}
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Description */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Description</Label>
            {isEditing ? (
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Enter board description"
                className="min-h-[100px]"
              />
            ) : (
              <p className="text-muted-foreground">
                {board.description || 'No description provided'}
              </p>
            )}
          </div>
          <DialogDescription>
            {isEditing ? 'Edit board details' : 'View and manage board settings and members'}
          </DialogDescription>

          {/* Board Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Owner</p>
              <div className="flex items-center gap-2">
                {board.ownerAvatar ? (
                  <img
                    src={board.ownerAvatar}
                    alt={board.ownerName || 'Owner'}
                    className="h-8 w-8 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary border border-border">
                    {(board.ownerName || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <p className="text-lg font-bold truncate">{board.ownerName || 'Unknown'}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Tasks</p>
              <p className="text-2xl font-bold">{board.taskCount ?? taskCount}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Members</p>
              <p className="text-2xl font-bold">{(board.members || []).length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="text-sm font-medium">
                {format(new Date(board.createdAt), 'MMM d, yyyy')}
              </p>
            </div>
          </div>

          {/* Visibility Settings */}
          {isAdmin && (
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div className="space-y-0.5">
                <Label htmlFor="public-toggle" className="flex items-center gap-2">
                  {isPublic ? (
                    <>
                      <Globe className="h-4 w-4" />
                      Public Board
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      Private Board
                    </>
                  )}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {isPublic
                    ? 'Anyone can view this board in the community'
                    : 'Only members can view this board'}
                </p>
              </div>
              <Switch
                id="public-toggle"
                checked={isPublic}
                onCheckedChange={handleTogglePublic}
              />
            </div>
          )}

          {/* Members List */}
          <div>
            <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
              <Users className="h-4 w-4" />
              Collaborators ({board.members.length + 1})
            </Label>
            <div className="space-y-2">
              {/* Always show owner at the top */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={board.ownerAvatar} alt={board.ownerName} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {(board.ownerName || 'O').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium flex items-center gap-2">
                      {board.ownerName}
                      <Crown className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      {isOwner && <Badge variant="outline" className="text-[10px] h-4">You</Badge>}
                    </p>
                    <p className="text-xs text-muted-foreground">Workspace Owner</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                  Owner
                </Badge>
              </div>

              {board.members.map((member) => (
                <MemberRow
                  key={member.id || member.email}
                  member={member}
                  isOwner={isOwner}
                  isAdmin={isAdmin}
                  currentUserId={user?.id}
                  onRoleChange={handleRoleChange}
                  onRemove={handleRemoveMember}
                  boardOwnerId={board.ownerId}
                />
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          {isOwner && (
            <div className="pt-6 border-t border-destructive/20">
              <div className="flex items-center justify-between p-4 rounded-xl bg-destructive/5 border border-destructive/10">
                <div className="space-y-0.5">
                  <Label className="text-destructive font-bold flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Danger Zone
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Irreversibly delete this board and all its tasks.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="rounded-lg shadow-lg shadow-destructive/20"
                  onClick={async () => {
                    if (window.confirm('Are you absolutely sure? This action cannot be undone.')) {
                      try {
                        await useTaskStore.getState().deleteBoard(board.id);
                        onOpenChange(false);
                      } catch (e) {
                        toast.error('Failed to delete board');
                      }
                    }
                  }}
                >
                  Delete Board
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MemberRow({
  member,
  isOwner,
  isAdmin,
  currentUserId,
  onRoleChange,
  onRemove,
  boardOwnerId,
}: {
  member: TeamMember;
  isOwner: boolean;
  isAdmin: boolean;
  currentUserId?: string;
  onRoleChange: (memberId: string, role: 'admin' | 'member') => void;
  onRemove: (memberId: string) => void;
  boardOwnerId: string;
}) {
  const isCurrentUser = member.id === currentUserId;
  const isMemberOwner = member.id === boardOwnerId;
  const isMemberAdmin = member.role === 'admin';

  // Permissions:
  // 1. Owner can change roles for ANYONE except themselves
  // 2. Owner can remove ANYONE except themselves
  // 3. Admin can remove Members (not Admins or Owner)

  const canChangeRole = isOwner && !isCurrentUser;
  const canRemove = !isCurrentUser && (isOwner || (isAdmin && !isMemberAdmin && !isMemberOwner));

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={member.avatar} alt={member.name} />
          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xs">
            {member.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium flex items-center gap-2">
            {member.name}
            {isCurrentUser && (
              <Badge variant="outline" className="text-xs">You</Badge>
            )}
          </p>
          <p className="text-xs text-muted-foreground">{member.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {canChangeRole ? (
          <Select
            value={member.role}
            onValueChange={(value) => onRoleChange(member.id, value as 'admin' | 'member')}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member">
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3" />
                  Member
                </div>
              </SelectItem>
              <SelectItem value="admin">
                <div className="flex items-center gap-2">
                  <Crown className="h-3 w-3" />
                  Admin
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Badge variant={member.role === 'admin' ? 'default' : 'outline'}>
            {member.role === 'admin' ? (
              <div className="flex items-center gap-1">
                <Crown className="h-3 w-3" />
                Admin
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                Member
              </div>
            )}
          </Badge>
        )}
        {canRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(member.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}



