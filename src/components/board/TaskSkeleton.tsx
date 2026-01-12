export function TaskSkeleton() {
    return (
        <div className="glass p-4 rounded-xl border border-border/50 space-y-3 animate-pulse">
            <div className="flex justify-between items-start">
                <div className="h-4 bg-muted/40 rounded w-2/3" />
                <div className="h-4 bg-muted/40 rounded w-1/4" />
            </div>
            <div className="space-y-2">
                <div className="h-3 bg-muted/30 rounded w-full" />
                <div className="h-3 bg-muted/30 rounded w-5/6" />
            </div>
            <div className="flex justify-between items-center pt-2">
                <div className="h-6 w-16 bg-muted/20 rounded-full" />
                <div className="h-6 w-6 bg-muted/20 rounded-full" />
            </div>
        </div>
    );
}

export function KanbanSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-4 px-1">
            {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="h-6 bg-muted/30 rounded w-32 animate-pulse" />
                        <div className="h-6 w-6 bg-muted/30 rounded-full animate-pulse" />
                    </div>
                    <div className="space-y-4">
                        {[1, 2, 3].map((j) => (
                            <TaskSkeleton key={j} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
