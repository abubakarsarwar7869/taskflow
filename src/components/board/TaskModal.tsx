import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, X } from 'lucide-react';
import { Task, Priority, Label, DEFAULT_LABELS, LabelColor } from '@/types/task';
import { useTaskStore } from '@/store/taskStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  columnId: string | null;
}

const labelColorClasses: Record<LabelColor, string> = {
  red: 'bg-label-red/20 text-label-red border-label-red/30 hover:bg-label-red/30',
  orange: 'bg-label-orange/20 text-label-orange border-label-orange/30 hover:bg-label-orange/30',
  yellow: 'bg-label-yellow/20 text-label-yellow border-label-yellow/30 hover:bg-label-yellow/30',
  green: 'bg-label-green/20 text-label-green border-label-green/30 hover:bg-label-green/30',
  blue: 'bg-label-blue/20 text-label-blue border-label-blue/30 hover:bg-label-blue/30',
  purple: 'bg-label-purple/20 text-label-purple border-label-purple/30 hover:bg-label-purple/30',
  pink: 'bg-label-pink/20 text-label-pink border-label-pink/30 hover:bg-label-pink/30',
  cyan: 'bg-label-cyan/20 text-label-cyan border-label-cyan/30 hover:bg-label-cyan/30',
};

export function TaskModal({ open, onOpenChange, task, columnId }: TaskModalProps) {
  const { createTask, updateTask } = useTaskStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [selectedLabels, setSelectedLabels] = useState<Label[]>([]);
  const [dueDate, setDueDate] = useState<Date | undefined>();

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setPriority(task.priority);
      setSelectedLabels(task.labels);
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setSelectedLabels([]);
      setDueDate(undefined);
    }
  }, [task, open]);

  const toggleLabel = (label: Label) => {
    setSelectedLabels((prev) =>
      prev.some((l) => l.id === label.id)
        ? prev.filter((l) => l.id !== label.id)
        : [...prev, label]
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    const { currentBoardId } = useTaskStore.getState();
    if (!currentBoardId) return;

    try {
      if (task) {
        await updateTask(task.id, {
          title: title.trim(),
          description: description.trim(),
          priority,
          labels: selectedLabels,
          dueDate: dueDate?.toISOString() || null,
        });
      } else if (columnId) {
        await createTask({
          title: title.trim(),
          description: description.trim(),
          priority,
          labels: selectedLabels,
          dueDate: dueDate?.toISOString() || null,
          columnId,
          boardId: currentBoardId,
        });
      }
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to save task');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass sm:max-w-lg max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle className="gradient-text text-xl">
              {task ? 'Edit Task' : 'Create Task'}
            </DialogTitle>
            <DialogDescription>
              {task ? 'Update task details and settings' : 'Create a new task for your board'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              className="bg-background/50"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              className="bg-background/50 min-h-[100px] resize-none"
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Priority</label>
            <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
              <SelectTrigger className="bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass">
                <SelectItem value="low">🟢 Low</SelectItem>
                <SelectItem value="medium">🟡 Medium</SelectItem>
                <SelectItem value="high">🟠 High</SelectItem>
                <SelectItem value="urgent">🔴 Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Due Date</label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'flex-1 justify-start text-left font-normal bg-background/50',
                      !dueDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="glass w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {dueDate && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setDueDate(undefined)}
                  className="bg-background/50"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Labels */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Labels</label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_LABELS.map((label) => (
                <Badge
                  key={label.id}
                  variant="outline"
                  className={cn(
                    'cursor-pointer transition-all border',
                    labelColorClasses[label.color],
                    selectedLabels.some((l) => l.id === label.id)
                      ? 'ring-2 ring-offset-2 ring-offset-background ring-primary/50'
                      : 'opacity-60'
                  )}
                  onClick={() => toggleLabel(label)}
                >
                  {label.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 pt-0">
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="glow-primary">
              {task ? 'Save Changes' : 'Create Task'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
