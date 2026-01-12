import { useState, useEffect } from 'react';
import { Board } from '@/types/task';
import { useTaskStore } from '@/store/taskStore';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Layout, ShieldCheck, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import * as api from '@/api';

interface JoinBoardModalProps {
    boardId: string;
    onJoined: () => void;
    onCancel: () => void;
    showAuthActions?: boolean;
}

export function JoinBoardModal({ boardId, onJoined, onCancel, showAuthActions = false }: JoinBoardModalProps) {
    const { acceptMemberInvitation, rejectMemberInvitation } = useTaskStore();
    const { user, signInWithGoogle } = useAuth();
    const [boardPreview, setBoardPreview] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        const loadPreview = async () => {
            try {
                const response = await api.fetchBoardPreview(boardId);
                setBoardPreview(response.data);
            } catch (error) {
                console.error('Failed to load board preview:', error);
                // Don't close the modal, just show whatever info we have
                // or a generic "Invited Board" message
            } finally {
                setLoading(false);
            }
        };

        if (boardId) {
            loadPreview();
        }
    }, [boardId]);

    const handleJoin = async () => {
        setJoining(true);
        try {
            await acceptMemberInvitation(boardId);
            toast.success(`You have successfully joined ${boardPreview?.name || 'the board'}!`);
            onJoined();
        } catch (error: any) {
            console.error('Join error:', error);
            toast.error(error.message || 'Failed to join board');
        } finally {
            setJoining(false);
        }
    };

    const handleReject = async () => {
        if (!user) {
            onCancel();
            return;
        }
        setJoining(true);
        try {
            await rejectMemberInvitation(boardId);
            toast.info("Invitation declined");
            onCancel();
        } catch (error: any) {
            console.error('Reject error:', error);
            toast.error(error.message || 'Failed to decline invitation');
        } finally {
            setJoining(false);
        }
    };

    if (loading) return null;

    const boardName = boardPreview?.name || 'Team Workspace';
    const ownerName = boardPreview?.owner || 'Workspace Owner';

    return (
        <Dialog open={!!boardId} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent className="glass sm:max-w-[425px] overflow-hidden border-none p-0">
                <div className="bg-gradient-to-br from-primary/20 via-background to-background p-6">
                    <DialogHeader className="mb-4">
                        <div className="mx-auto bg-primary/10 p-3 rounded-2xl w-fit mb-4">
                            <Layout className="h-8 w-8 text-primary" />
                        </div>
                        <DialogTitle className="text-2xl text-center font-bold tracking-tight">
                            You're Invited!
                        </DialogTitle>
                        <DialogDescription className="text-center text-muted-foreground pt-2">
                            You have been invited to collaborate on this workspace.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-background/80 backdrop-blur-md border border-primary/10 rounded-2xl p-6 mb-6 shadow-xl">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-foreground">{boardName}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                    {boardPreview?.description || 'Collaborate with your team members on this board.'}
                                </p>
                            </div>

                            <div className="w-full h-px bg-border/50 my-2" />

                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                                    <AvatarImage src={boardPreview?.ownerAvatar} />
                                    <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                                        {ownerName.slice(0, 1).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="text-left">
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Created By</p>
                                    <p className="text-sm font-semibold">{ownerName}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-muted/30 rounded-xl p-3 flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            <span className="text-xs font-medium">Team Project</span>
                        </div>
                        <div className="bg-muted/30 rounded-xl p-3 flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-primary" />
                            <span className="text-xs font-medium">Full Access</span>
                        </div>
                    </div>

                    <DialogFooter className="flex-col gap-3">
                        {!user && showAuthActions ? (
                            <>
                                <Button
                                    onClick={signInWithGoogle}
                                    className="w-full rounded-xl h-12 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 border-none group"
                                >
                                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Join with Google
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={onCancel}
                                    className="w-full rounded-xl h-12"
                                >
                                    Sign Up with Email
                                </Button>
                            </>
                        ) : (
                            <div className="flex flex-col sm:flex-row gap-3 w-full">
                                <Button
                                    variant="ghost"
                                    onClick={handleReject}
                                    className="flex-1 rounded-xl h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                    Decline
                                </Button>
                                <Button
                                    onClick={handleJoin}
                                    disabled={joining || !user}
                                    className="flex-1 rounded-xl h-12 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 border-none group"
                                >
                                    {joining ? (
                                        'Joining...'
                                    ) : (
                                        <>
                                            Join Board
                                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
