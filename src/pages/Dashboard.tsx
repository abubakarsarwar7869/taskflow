import { useState, useMemo, useEffect } from 'react';
import { isPast, isToday, isThisWeek } from 'date-fns';
import { useTaskStore } from '@/store/taskStore';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { KanbanBoard } from '@/components/board/KanbanBoard';
import { CalendarView } from '@/components/board/CalendarView';
import { InviteModal } from '@/components/board/InviteModal';
import { EmptyState } from '@/components/board/EmptyState';
import { SearchFilter, FilterState } from '@/components/board/SearchFilter';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { TaskModal } from '@/components/board/TaskModal';
import { BoardDetailModal } from '@/components/board/BoardDetailModal';
import { Task } from '@/types/task';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Kanban, Calendar } from 'lucide-react';

export default function Dashboard() {
  const { boards, currentBoardId, tasks } = useTaskStore();
  
  // Ensure store data is valid
  const safeBoards = Array.isArray(boards) ? boards : [];
  const safeTasks = tasks && typeof tasks === 'object' ? tasks : {};
  
  // Safe access to current board with error handling
  const currentBoard = useMemo(() => {
    try {
      if (!safeBoards.length || !currentBoardId) return null;
      const board = safeBoards.find((b) => b && b.id === currentBoardId);
      // Validate board structure
      if (board && (!board.columns || !Array.isArray(board.columns))) {
        console.warn('Invalid board structure:', board);
        return null;
      }
      return board || null;
    } catch (error) {
      console.error('Error getting current board:', error);
      return null;
    }
  }, [safeBoards, currentBoardId]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeView, setActiveView] = useState<'board' | 'calendar'>('board');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isBoardDetailOpen, setIsBoardDetailOpen] = useState(false);

  // Listen for board detail open event
  useEffect(() => {
    const handleOpenBoardDetail = () => {
      setIsBoardDetailOpen(true);
    };
    window.addEventListener('openBoardDetail', handleOpenBoardDetail);
    return () => window.removeEventListener('openBoardDetail', handleOpenBoardDetail);
  }, []);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    priority: 'all',
    labels: [],
    dueDate: 'all',
  });

  // Get all tasks for current board with error handling
  const allBoardTasks = useMemo(() => {
    try {
      if (!currentBoard) return [];
      if (!currentBoard.columns || !Array.isArray(currentBoard.columns)) return [];
      if (!safeTasks || typeof safeTasks !== 'object') return [];
      
      return currentBoard.columns.flatMap((col) => {
        if (!col || !col.taskIds || !Array.isArray(col.taskIds)) return [];
        return col.taskIds
          .map((id) => safeTasks[id])
          .filter((task) => task && typeof task === 'object');
      });
    } catch (error) {
      console.error('Error getting board tasks:', error);
      return [];
    }
  }, [currentBoard, safeTasks]);

  // Filter tasks based on filters with error handling
  const filteredTasks = useMemo(() => {
    try {
      if (!Array.isArray(allBoardTasks)) return [];
      
      return allBoardTasks.filter((task) => {
        if (!task || typeof task !== 'object') return false;
        
        try {
          // Search filter
          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const taskTitle = task.title?.toLowerCase() || '';
            const taskDescription = task.description?.toLowerCase() || '';
            const matchesTitle = taskTitle.includes(searchLower);
            const matchesDescription = taskDescription.includes(searchLower);
            if (!matchesTitle && !matchesDescription) return false;
          }

          // Priority filter
          if (filters.priority !== 'all' && task.priority !== filters.priority) {
            return false;
          }

          // Labels filter
          if (filters.labels.length > 0) {
            const taskLabels = task.labels || [];
            if (!Array.isArray(taskLabels)) return false;
            const taskLabelIds = taskLabels.map((l) => l?.id).filter(Boolean);
            const hasMatchingLabel = filters.labels.some((id) => taskLabelIds.includes(id));
            if (!hasMatchingLabel) return false;
          }

          // Due date filter
          if (filters.dueDate !== 'all') {
            if (filters.dueDate === 'none' && task.dueDate) return false;
            if (filters.dueDate !== 'none' && !task.dueDate) return false;
            
            if (task.dueDate) {
              try {
                const dueDate = new Date(task.dueDate);
                if (isNaN(dueDate.getTime())) return false;
                
                switch (filters.dueDate) {
                  case 'overdue':
                    if (!isPast(dueDate) || isToday(dueDate)) return false;
                    break;
                  case 'today':
                    if (!isToday(dueDate)) return false;
                    break;
                  case 'week':
                    if (!isThisWeek(dueDate)) return false;
                    break;
                }
              } catch (dateError) {
                console.error('Error parsing due date:', dateError);
                return false;
              }
            }
          }

          return true;
        } catch (filterError) {
          console.error('Error filtering task:', filterError, task);
          return false;
        }
      });
    } catch (error) {
      console.error('Error filtering tasks:', error);
      return [];
    }
  }, [allBoardTasks, filters]);

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar onOpenSettings={() => setIsSettingsOpen(true)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          board={currentBoard}
          onInvite={() => setIsInviteModalOpen(true)}
          tasks={allBoardTasks}
          onBoardClick={() => setIsBoardDetailOpen(true)}
        />
        
        <main className="flex-1 overflow-auto p-6">
          {currentBoard ? (
            <div className="space-y-4">
              {/* Search & Filters + View Toggle */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <SearchFilter filters={filters} onFiltersChange={setFilters} />
                
                <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'board' | 'calendar')}>
                  <TabsList>
                    <TabsTrigger value="board" className="gap-2">
                      <Kanban className="h-4 w-4" />
                      Board
                    </TabsTrigger>
                    <TabsTrigger value="calendar" className="gap-2">
                      <Calendar className="h-4 w-4" />
                      Calendar
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Content */}
              {activeView === 'board' ? (
                currentBoard && currentBoard.columns ? (
                  <KanbanBoard 
                    board={currentBoard} 
                    filteredTaskIds={filteredTasks.map(t => t?.id).filter(Boolean)} 
                  />
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    Board data is invalid. Please refresh the page.
                  </div>
                )
              ) : (
                <CalendarView tasks={filteredTasks} onEditTask={handleEditTask} />
              )}
            </div>
          ) : (
            <EmptyState />
          )}
        </main>
      </div>

      <InviteModal
        open={isInviteModalOpen}
        onOpenChange={setIsInviteModalOpen}
        board={currentBoard}
      />

      <SettingsModal
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />

      <TaskModal
        open={isTaskModalOpen}
        onOpenChange={setIsTaskModalOpen}
        task={editingTask}
        columnId={editingTask?.columnId || null}
      />

      <BoardDetailModal
        open={isBoardDetailOpen}
        onOpenChange={setIsBoardDetailOpen}
        board={currentBoard}
      />
    </div>
  );
}
