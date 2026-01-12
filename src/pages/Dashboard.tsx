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
import { TaskDetailModal } from '@/components/board/TaskDetailModal';
import { BoardDetailModal } from '@/components/board/BoardDetailModal';
import { Task } from '@/types/task';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Menu, X, Kanban, Calendar } from 'lucide-react';
import { JoinBoardModal } from '@/components/board/JoinBoardModal';
import { useSearchParams } from 'react-router-dom';
import { KanbanSkeleton } from '@/components/board/TaskSkeleton';
import { toast } from 'sonner';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const {
    boards,
    publicBoards,
    currentBoardId,
    tasks,
    fetchBoards,
    fetchTasks,
    setCurrentBoard,
    fetchNotifications,
    checkDeadlines,
    loading,
    error: storeError
  } = useTaskStore();

  // Initialize dashboard with parallel data fetching
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // Fetch boards and notifications in parallel for faster initial load
        await Promise.all([
          fetchBoards(),
          fetchNotifications()
        ]);
      } catch (error) {
        console.error('Error initializing dashboard:', error);
      }
    };

    initializeDashboard();
  }, []); // Run once on mount

  // Reactive default board selection
  useEffect(() => {
    if (!currentBoardId && boards && boards.length > 0) {
      setCurrentBoard(boards[0].id);
    }
  }, [currentBoardId, boards, setCurrentBoard]);

  // Fetch tasks when current board changes
  useEffect(() => {
    if (currentBoardId) {
      const state = useTaskStore.getState();
      const currentBoard = state.boards.find(b => b.id === currentBoardId);

      if (currentBoard) {
        // Check if we have actual task data loaded for this board
        // by seeing if any taskIds from the board's columns exist in the tasks store
        const allTaskIds = currentBoard.columns.flatMap(c => c.taskIds || []);
        const hasLoadedTasks = allTaskIds.length === 0 || allTaskIds.some(id => state.tasks[id]);

        // Only fetch if we don't have tasks loaded yet
        if (!hasLoadedTasks) {
          fetchTasks(currentBoardId);
        }
      } else {
        // Board not in state yet, fetch tasks
        fetchTasks(currentBoardId);
      }
    }
  }, [currentBoardId]);

  // Check for deadlines periodically
  useEffect(() => {
    checkDeadlines();
    const interval = setInterval(checkDeadlines, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [checkDeadlines, tasks]);

  // Ensure store data is valid
  const safeBoards = Array.isArray(boards) ? boards : [];
  const safePublicBoards = Array.isArray(publicBoards) ? publicBoards : [];
  const safeTasks = tasks && typeof tasks === 'object' ? tasks : {};

  // Safe access to current board
  const currentBoard = useMemo(() => {
    if (!currentBoardId) return null;
    return safeBoards.find((b) => b.id === currentBoardId) ||
      safePublicBoards.find((b) => b.id === currentBoardId) ||
      null;
  }, [safeBoards, safePublicBoards, currentBoardId]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeView, setActiveView] = useState<'board' | 'calendar'>('board');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isBoardDetailOpen, setIsBoardDetailOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const [inviteBoardId, setInviteBoardId] = useState<string | null>(null);

  // Listen for board detail open event
  useEffect(() => {
    const handleOpenBoardDetail = () => {
      setIsBoardDetailOpen(true);
    };
    window.addEventListener('openBoardDetail', handleOpenBoardDetail);
    return () => window.removeEventListener('openBoardDetail', handleOpenBoardDetail);
  }, []);

  // Check for boardId or invite in URL
  useEffect(() => {
    const boardId = searchParams.get('boardId');
    const isInvite = searchParams.get('invite') === 'true';

    if (isInvite && boardId) {
      setInviteBoardId(boardId);
    } else if (boardId && boardId !== currentBoardId) {
      // If boardId in URL is different from current, switch to it
      setCurrentBoard(boardId);
    }
  }, [searchParams, currentBoardId, setCurrentBoard]);

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

  const handleViewTask = (task: Task) => {
    setViewingTask(task);
    setIsDetailModalOpen(true);
  };

  // Show loading skeleton while initial data loads
  if (loading && boards.length === 0) {
    return (
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar onOpenSettings={() => setIsSettingsOpen(true)} />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header skeleton */}
          <div className="h-16 border-b border-border flex items-center px-6 gap-4">
            <div className="h-8 w-48 rounded-md animate-pulse bg-muted/30" />
            <div className="flex-1" />
            <div className="h-9 w-32 rounded-md animate-pulse bg-muted/30" />
          </div>

          {/* Content skeleton */}
          <main className="flex-1 overflow-auto p-6">
            <div className="space-y-4">
              <div className="h-10 w-64 rounded-md animate-pulse bg-muted/30" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="space-y-3">
                    <div className="h-8 w-32 rounded-md animate-pulse bg-muted/30" />
                    <div className="space-y-2">
                      <div className="h-24 rounded-lg animate-pulse bg-muted/20" />
                      <div className="h-24 rounded-lg animate-pulse bg-muted/20" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <div className="mesh-grid mesh-grid-prominent opacity-15" />
      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden lg:block transition-all duration-300 ease-in-out relative",
        isSidebarCollapsed ? "w-0 overflow-hidden" : "w-72"
      )}>
        <Sidebar onOpenSettings={() => setIsSettingsOpen(true)} />
      </div>

      {/* Sidebar Toggle Button (Desktop) */}
      <div className="hidden lg:block absolute left-4 bottom-4 z-[100]">
        <Button
          variant="outline"
          size="sm"
          className="h-10 w-10 rounded-full bg-background/50 glass hover:bg-primary/20 p-2 shadow-glow-primary/20 backdrop-blur-xl"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        >
          <Kanban className={cn("h-5 w-5 transition-transform", isSidebarCollapsed ? "" : "rotate-180")} />
        </Button>
      </div>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 w-72 border-r-border/50 bg-background">
          <Sidebar onOpenSettings={() => {
            setIsSettingsOpen(true);
            setIsMobileSidebarOpen(false);
          }} />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          board={currentBoard}
          onInvite={() => setIsInviteModalOpen(true)}
          tasks={allBoardTasks}
          onBoardClick={() => setIsBoardDetailOpen(true)}
          onMenuClick={() => setIsMobileSidebarOpen(true)}
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
                loading && allBoardTasks.length === 0 ? (
                  <KanbanSkeleton />
                ) : currentBoard && currentBoard.columns ? (
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
                <CalendarView tasks={filteredTasks} onEditTask={handleEditTask} onViewTask={handleViewTask} />
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

      <TaskDetailModal
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        task={viewingTask}
      />

      <BoardDetailModal
        open={isBoardDetailOpen}
        onOpenChange={setIsBoardDetailOpen}
        board={currentBoard}
      />

      {inviteBoardId && (
        <JoinBoardModal
          boardId={inviteBoardId}
          onJoined={async () => {
            try {
              toast.success(`Welcome to the board!`);

              // 1. Clear URL params first to prevent re-triggering
              const newParams = new URLSearchParams(searchParams);
              newParams.delete('invite');
              newParams.delete('boardId');
              newParams.delete('boardName');
              newParams.delete('email');
              setSearchParams(newParams);
              setInviteBoardId(null);

              // 2. Fetch updated boards to get the new one
              await fetchBoards();

              // 3. Set current board and fetch its tasks
              setCurrentBoard(inviteBoardId);
              await fetchTasks(inviteBoardId);
            } catch (error) {
              console.error('Error during post-join updates:', error);
            }
          }}
          onCancel={() => {
            setInviteBoardId(null);
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('invite');
            newParams.delete('boardId');
            newParams.delete('boardName');
            newParams.delete('email');
            setSearchParams(newParams);
          }}
        />
      )}
    </div>
  );
}
