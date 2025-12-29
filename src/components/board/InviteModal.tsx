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

export function InviteModal({ open, onOpenChange, board }: InviteModalProps) {
  const { addMember, removeMember } = useTaskStore();
  const { user } = useAuth();
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

    // Check if already a member
    if (board.members.some((m) => m.email === email.trim())) {
      toast.error('This person is already a member');
      return;
    }

    // If user is admin, send email invitation
    if (isAdmin) {
      setSending(true);
      try {
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

        // Add member to board locally
        const newMember: TeamMember = {
          id: generateId(),
          name: email.split('@')[0],
          email: email.trim(),
          role: 'member', // Invited members are always regular members, not admin
        };

        addMember(board.id, newMember);
        setEmail('');
        toast.success(`Invitation email sent to ${email.trim()}`);
      } catch (error: any) {
        console.error('Error sending invitation:', error);
        toast.error(error.message || 'Failed to send invitation email');
      } finally {
        setSending(false);
      }
    } else {
      // Non-admin users can still add members locally (for existing users)
      const newMember: TeamMember = {
        id: generateId(),
        name: email.split('@')[0],
        email: email.trim(),
        role: 'member',
      };

      addMember(board.id, newMember);
      setEmail('');
      toast.success(`Added ${email.trim()} to board`);
    }
  };

  const handleRemoveMember = (memberId: string) => {
    if (!board) return;
    removeMember(board.id, memberId);
    toast.success('Member removed');
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
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/20 text-primary text-xs">
                          {member.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
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
