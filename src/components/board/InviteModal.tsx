import { useState } from 'react';
import { UserPlus, X, Mail, Loader2 } from 'lucide-react';
import { Board, TeamMember } from '@/types/task';
import { useTaskStore } from '@/store/taskStore';
import { useAuth } from '@/contexts/AuthContext';
import { API_CONFIG } from '@/config/env';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

interface InviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  board: Board | null;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export function InviteModal({ open, onOpenChange, board: initialBoard }: InviteModalProps) {
  const { addMember, removeMember, boards, publicBoards } = useTaskStore();
  const { user } = useAuth();

  // Always get the freshest board data from the store
  const board = initialBoard ? (
    boards.find(b => b.id === initialBoard.id) ||
    publicBoards.find(b => b.id === initialBoard.id) ||
    initialBoard
  ) : null;

  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const isAdmin = user?.role === 'admin';

  const handleInvite = async () => {
    if (!email.trim() || !board) return;

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Check if already an active member
    const existingMember = board.members.find((m) => m.email === email.trim());
    if (existingMember && existingMember.status === 'active') {
      toast.error('This person is already a member');
      return;
    }

    setSending(true);
    try {
      // First try to add as an existing member
      try {
        await addMember(board.id, email.trim());
        toast.success(`Added ${email.trim()} to board`);
        setEmail('');
      } catch (error: any) {
        // Extract error message from Axios response if available
        const errorMsg = error.response?.data?.error || error.message || '';
        console.log('Invite error details:', { errorMsg, status: error.response?.status, isAdmin });

        // If user not found, try to send invitation (backend will verify if allowed)
        if (errorMsg.includes('User not found') || error.response?.status === 404) {
          toast.info(`Sending an email invitation...`);
          const token = localStorage.getItem('taskflow_token');
          const response = await fetch(`${API_CONFIG.URL}/invites`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              email: email.trim(),
              boardName: board.title,
              boardId: board.id,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to send invitation');
          }

          toast.success(`Invitation email sent to ${email.trim()}`);
          setEmail('');
        } else {
          throw new Error(errorMsg || 'Failed to add member');
        }
      }
    } catch (error: any) {
      console.error('Error adding member:', error);
      toast.error(error.message || 'Failed to add member');
    } finally {
      setSending(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!board) return;
    try {
      await removeMember(board.id, memberId);
      toast.success('Member removed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove member');
    }
  };

  if (!board) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Invite Team Members
          </DialogTitle>
          <DialogDescription>
            {isAdmin
              ? `Send email invitations to collaborate on "${board.title}". Invited users will be regular members.`
              : `Add people to collaborate on "${board.title}"`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Invite Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="pl-9 bg-background/50"
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
              />
            </div>
            <Button onClick={handleInvite} disabled={!email.trim() || sending}>
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  {isAdmin ? 'Send Invite' : 'Add Member'}
                </>
              )}
            </Button>
          </div>

          {/* Current Members */}
          {board.members.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                Team Members ({board.members.length})
              </h4>
              <div className="space-y-2">
                {board.members.map((member) => (
                  <div
                    key={member.id || member.email}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/20 text-primary text-xs">
                          {member.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{member.name}</p>
                          {member.status === 'pending' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-500 font-bold uppercase tracking-wider border border-orange-500/20">
                              Pending
                            </span>
                          )}
                          {member.status === 'rejected' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive font-bold uppercase tracking-wider border border-destructive/20">
                              Rejected
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {member.status === 'pending' && !member.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10"
                          onClick={() => {
                            setEmail(member.email);
                            handleInvite();
                          }}
                          title="Resend Invitation"
                        >
                          <Mail className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {(isAdmin || !member.id || member.status === 'pending' || board.ownerId === user?.id) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveMember(member.id || member.email)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {board.members.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <UserPlus className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No team members yet</p>
              <p className="text-xs">Invite people to collaborate</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
