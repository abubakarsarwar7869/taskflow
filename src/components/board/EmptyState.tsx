import { Layout, Plus, Sparkles } from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';
import { Button } from '@/components/ui/button';

export function EmptyState() {
  const { createBoard } = useTaskStore();

  const handleCreateBoard = () => {
    createBoard('My First Board', 'A place to organize your tasks');
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="relative mb-8">
        <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center animate-pulse-glow">
          <Layout className="h-12 w-12 text-primary" />
        </div>
        <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-accent" />
        </div>
      </div>

      <h2 className="text-2xl font-bold gradient-text mb-2">
        Welcome to TaskFlow
      </h2>
      <p className="text-muted-foreground max-w-md mb-8">
        Create your first board to start organizing tasks, collaborating with your team,
        and boosting your productivity.
      </p>

      <Button
        onClick={handleCreateBoard}
        size="lg"
        className="glow-primary gap-2"
      >
        <Plus className="h-5 w-5" />
        Create Your First Board
      </Button>

      <div className="mt-12 grid grid-cols-3 gap-8 text-center max-w-lg">
        <div>
          <div className="text-3xl font-bold text-primary">∞</div>
          <div className="text-xs text-muted-foreground">Unlimited Tasks</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-accent">🎯</div>
          <div className="text-xs text-muted-foreground">Priority Tracking</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-primary">👥</div>
          <div className="text-xs text-muted-foreground">Team Collaboration</div>
        </div>
      </div>
    </div>
  );
}
