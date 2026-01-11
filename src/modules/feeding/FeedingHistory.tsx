import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, subWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { FeedingLog } from '@/core/types';
import { getFeedingTypeName, getFeedingTypeEmoji } from './feedingService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface FeedingHistoryProps {
  logs: FeedingLog[];
  onEdit: (log: FeedingLog) => void;
  onDelete: (id: string) => Promise<void>;
}

const FeedingHistory = ({ logs, onEdit, onDelete }: FeedingHistoryProps) => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [deleteLogId, setDeleteLogId] = useState<string | null>(null);

  const currentWeek = useMemo(() => {
    const today = new Date();
    const baseDate = subWeeks(today, weekOffset);
    return {
      start: startOfWeek(baseDate, { weekStartsOn: 1 }),
      end: endOfWeek(baseDate, { weekStartsOn: 1 }),
    };
  }, [weekOffset]);

  const days = useMemo(() => {
    return eachDayOfInterval({ start: currentWeek.start, end: currentWeek.end });
  }, [currentWeek]);

  const logsByDay = useMemo(() => {
    const grouped: { [date: string]: FeedingLog[] } = {};
    
    for (const log of logs) {
      if (log.snoozed) continue;
      const date = log.createdAt.split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(log);
    }
    
    // Sort each day's logs by time
    for (const date in grouped) {
      grouped[date].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    
    return grouped;
  }, [logs]);

  const handleDelete = async () => {
    if (deleteLogId) {
      await onDelete(deleteLogId);
      setDeleteLogId(null);
    }
  };

  const formatTime = (dateStr: string) => {
    return format(parseISO(dateStr), 'h:mm a');
  };

  const formatQuantity = (log: FeedingLog) => {
    if (log.durationMinutes) {
      return `${log.durationMinutes} min`;
    }
    if (log.quantity && log.quantityUnit) {
      return `${log.quantity} ${log.quantityUnit}`;
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setWeekOffset(weekOffset + 1)}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <p className="font-medium text-foreground">
          {format(currentWeek.start, 'MMM d')} - {format(currentWeek.end, 'MMM d, yyyy')}
        </p>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setWeekOffset(weekOffset - 1)}
          disabled={weekOffset === 0}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Days List */}
      <div className="space-y-3">
        {days.map((day, index) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayLogs = logsByDay[dateStr] || [];
          const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr;

          return (
            <motion.div
              key={dateStr}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`p-3 ${isToday ? 'border-primary' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{format(day, 'EEE')}</span>
                    <span className={`text-sm ${isToday ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                      {format(day, 'MMM d')}
                    </span>
                    {isToday && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        Today
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {dayLogs.length} feeding{dayLogs.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {dayLogs.length > 0 ? (
                  <div className="space-y-2">
                    {dayLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-2 bg-secondary/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">
                            {getFeedingTypeEmoji(log.feedingType)}
                          </span>
                          <div>
                            <p className="text-sm font-medium">
                              {getFeedingTypeName(log.feedingType)}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{formatTime(log.createdAt)}</span>
                              {formatQuantity(log) && (
                                <>
                                  <span>•</span>
                                  <span>{formatQuantity(log)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onEdit(log)}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => setDeleteLogId(log.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No feedings logged
                  </p>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteLogId} onOpenChange={() => setDeleteLogId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Feeding Log?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this feeding record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FeedingHistory;
