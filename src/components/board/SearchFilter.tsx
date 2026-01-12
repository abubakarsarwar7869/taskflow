import { useState } from 'react';
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import { Priority, Label, DEFAULT_LABELS } from '@/types/task';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export interface FilterState {
  search: string;
  priority: Priority | 'all';
  labels: string[];
  dueDate: 'all' | 'overdue' | 'today' | 'week' | 'none';
}

interface SearchFilterProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export function SearchFilter({ filters, onFiltersChange }: SearchFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      priority: 'all',
      labels: [],
      dueDate: 'all',
    });
  };

  const activeFiltersCount = 
    (filters.priority !== 'all' ? 1 : 0) +
    (filters.labels.length > 0 ? 1 : 0) +
    (filters.dueDate !== 'all' ? 1 : 0);

  const toggleLabel = (labelId: string) => {
    const newLabels = filters.labels.includes(labelId)
      ? filters.labels.filter((id) => id !== labelId)
      : [...filters.labels, labelId];
    updateFilter('labels', newLabels);
  };

  return (
    <div className="flex items-center gap-3">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="pl-9 bg-background/50 border-border/50"
        />
        {filters.search && (
          <button
            onClick={() => updateFilter('search', '')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Popover */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 glass" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-foreground">Filters</h4>
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-auto py-1 px-2 text-xs"
                >
                  Clear all
                </Button>
              )}
            </div>

            {/* Priority Filter */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Priority</label>
              <Select
                value={filters.priority}
                onValueChange={(value) => updateFilter('priority', value as Priority | 'all')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Due Date Filter */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Due Date</label>
              <Select
                value={filters.dueDate}
                onValueChange={(value) => updateFilter('dueDate', value as FilterState['dueDate'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All dates</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="today">Due today</SelectItem>
                  <SelectItem value="week">Due this week</SelectItem>
                  <SelectItem value="none">No due date</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Labels Filter */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Labels</label>
              <div className="grid grid-cols-2 gap-2">
                {DEFAULT_LABELS.map((label) => (
                  <label
                    key={label.id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={filters.labels.includes(label.id)}
                      onCheckedChange={() => toggleLabel(label.id)}
                    />
                    <span className="text-sm text-foreground">{label.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
