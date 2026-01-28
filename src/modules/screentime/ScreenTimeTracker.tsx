import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Plus, Play, Square, Calendar, BarChart3, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useScreenTime } from './useScreenTime';
import { useScreenTimeTracking } from './useScreenTimeTracking';
import { ScreenTimeLogModal } from './ScreenTimeLogModal';
import { formatScreenTime, getWeekRangeString, getCurrentWeekInfo } from './screenTimeService';
import { formatDynamicScreenTime } from './screenTimeSessionService';
import { getYear, format, parseISO } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type AggregationView = 'day' | 'week' | 'year' | 'allTime';

export const ScreenTimeTracker = () => {
  // Manual weekly logging (existing)
  const { entries, currentWeekEntry, isLoading: isLoadingManual, getYearStats, getMonthlyStats } = useScreenTime();
  
  // Session-based tracking (new)
  const { 
    isTracking, 
    elapsedSeconds, 
    aggregates, 
    isLoading: isLoadingSession,
    startTracking, 
    stopTracking,
    getGroupedHistory,
  } = useScreenTimeTracking();
  
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState(getYear(new Date()).toString());
  const [yearlyStats, setYearlyStats] = useState<{ totalMinutes: number; averagePerWeek: number } | null>(null);
  const [monthlyData, setMonthlyData] = useState<{ month: string; minutes: number }[]>([]);
  const [weeklyData, setWeeklyData] = useState<{ week: number; minutes: number; range: string }[]>([]);
  const [aggregationView, setAggregationView] = useState<AggregationView>('day');
  const [sessionHistory, setSessionHistory] = useState<{ date: string; totalSeconds: number }[]>([]);

  // Available years (from entries)
  const availableYears = [...new Set(entries.map(e => e.year))].sort((a, b) => b - a);
  if (!availableYears.includes(getYear(new Date()))) {
    availableYears.unshift(getYear(new Date()));
  }

  // Load session history
  useEffect(() => {
    const loadHistory = async () => {
      const history = await getGroupedHistory(14);
      setSessionHistory(history.map(h => ({ date: h.date, totalSeconds: h.totalSeconds })));
    };
    loadHistory();
  }, [getGroupedHistory, isTracking]);

  useEffect(() => {
    const loadStats = async () => {
      const year = parseInt(selectedYear);
      
      // Load yearly stats
      const stats = await getYearStats(year);
      if (stats) {
        setYearlyStats({
          totalMinutes: stats.totalMinutes,
          averagePerWeek: stats.averagePerWeek,
        });
        
        // Weekly data for line chart
        setWeeklyData(
          stats.entries.map(e => ({
            week: e.weekNumber,
            minutes: e.totalMinutes,
            range: getWeekRangeString(e.weekStartDate, e.weekEndDate),
          })).reverse()
        );
      }
      
      // Load monthly stats
      const monthly = await getMonthlyStats(year);
      if (monthly) {
        setMonthlyData(
          monthly.map(m => ({
            month: MONTHS[m.month],
            minutes: m.totalMinutes,
          }))
        );
      }
    };
    
    loadStats();
  }, [selectedYear, entries, getYearStats, getMonthlyStats]);

  const { weekNumber: currentWeek } = getCurrentWeekInfo();

  // Get the display value based on aggregation view
  const getAggregateDisplay = (): string => {
    if (!aggregates) return '--';
    
    switch (aggregationView) {
      case 'day':
        return formatDynamicScreenTime(aggregates.daily + (isTracking ? elapsedSeconds : 0));
      case 'week':
        return formatDynamicScreenTime(aggregates.weekly + (isTracking ? elapsedSeconds : 0));
      case 'year':
        return formatDynamicScreenTime(aggregates.yearly + (isTracking ? elapsedSeconds : 0));
      case 'allTime':
        return formatDynamicScreenTime(aggregates.allTime + (isTracking ? elapsedSeconds : 0));
    }
  };

  const getAggregateLabel = (): string => {
    switch (aggregationView) {
      case 'day':
        return 'Today';
      case 'week':
        return `This Week (Week ${currentWeek})`;
      case 'year':
        return `This Year (${getYear(new Date())})`;
      case 'allTime':
        return 'Since Install';
    }
  };

  const handleTrackingToggle = async () => {
    if (isTracking) {
      await stopTracking();
    } else {
      await startTracking();
    }
  };

  return (
    <div className="px-4 py-6 space-y-6 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Screen Time</h1>
            <p className="text-sm text-muted-foreground">Track your phone usage</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowLogModal(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Manual Log
        </Button>
      </motion.div>

      {/* Live Tracking Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className={`border-2 ${isTracking ? 'border-primary bg-primary/5' : 'border-muted'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">
                  {isTracking ? 'Tracking Active' : 'Start Tracking'}
                </p>
                {isTracking ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <p className="text-3xl font-bold text-foreground font-mono">
                      {formatDynamicScreenTime(elapsedSeconds)}
                    </p>
                  </div>
                ) : (
                  <p className="text-base text-muted-foreground">
                    Tap Start to begin tracking your screen time
                  </p>
                )}
              </div>
              <Button
                size="lg"
                variant={isTracking ? 'destructive' : 'default'}
                onClick={handleTrackingToggle}
                className="min-w-24"
              >
                {isTracking ? (
                  <>
                    <Square className="w-4 h-4 mr-2" />
                    Stop
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Aggregation View Selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-muted-foreground">View By</p>
              <div className="flex gap-1">
                {(['day', 'week', 'year', 'allTime'] as AggregationView[]).map((view) => (
                  <Button
                    key={view}
                    size="sm"
                    variant={aggregationView === view ? 'default' : 'ghost'}
                    onClick={() => setAggregationView(view)}
                    className="text-xs px-2 py-1 h-7"
                  >
                    {view === 'allTime' ? 'All' : view.charAt(0).toUpperCase() + view.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{getAggregateLabel()}</p>
                <p className="text-2xl font-bold text-foreground">
                  {getAggregateDisplay()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Session History (Recent Days) */}
      {sessionHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="font-semibold text-foreground mb-3">Recent Sessions</h2>
          <div className="space-y-2">
            {sessionHistory.slice(0, 7).map((day) => (
              <Card key={day.date}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      {format(parseISO(day.date), 'EEEE')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(day.date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <p className="font-bold text-primary">
                    {formatDynamicScreenTime(day.totalSeconds)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* Manual Weekly Entry - Current Week */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="font-semibold text-foreground mb-3">Manual Weekly Log</h2>
        <Card className="border-muted">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Week {currentWeek} (Manual Entry)</p>
                {currentWeekEntry ? (
                  <p className="text-xl font-bold text-foreground">
                    {formatScreenTime(currentWeekEntry.totalMinutes)}
                  </p>
                ) : (
                  <p className="text-base text-muted-foreground">Not logged yet</p>
                )}
              </div>
              <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Year Stats for Manual Entries */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground">Manual Entry Stats</h2>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Year Total</p>
              <p className="text-lg font-bold text-foreground">
                {yearlyStats ? formatScreenTime(yearlyStats.totalMinutes) : '--'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Avg / Week</p>
              <p className="text-lg font-bold text-foreground">
                {yearlyStats ? formatScreenTime(yearlyStats.averagePerWeek) : '--'}
              </p>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Charts for Manual Entries */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Tabs defaultValue="monthly" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
          </TabsList>
          
          <TabsContent value="monthly" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Monthly Screen Time ({selectedYear})</CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyData.some(d => d.minutes > 0) ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis 
                          tickFormatter={(value) => `${Math.round(value / 60)}h`}
                          className="text-xs"
                        />
                        <Tooltip 
                          formatter={(value: number) => [formatScreenTime(value), 'Screen Time']}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar 
                          dataKey="minutes" 
                          fill="hsl(var(--primary))" 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No manual entries for {selectedYear}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="weekly" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Weekly Trend ({selectedYear})</CardTitle>
              </CardHeader>
              <CardContent>
                {weeklyData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="week" className="text-xs" />
                        <YAxis 
                          tickFormatter={(value) => `${Math.round(value / 60)}h`}
                          className="text-xs"
                        />
                        <Tooltip 
                          formatter={(value: number) => [formatScreenTime(value), 'Screen Time']}
                          labelFormatter={(label, payload) => {
                            const item = payload?.[0]?.payload;
                            return item ? `Week ${label}: ${item.range}` : `Week ${label}`;
                          }}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Line 
                          type="monotone"
                          dataKey="minutes" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--primary))' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No manual entries for {selectedYear}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Manual Entry History */}
      {entries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <h2 className="font-semibold text-foreground mb-3">Manual Entry History</h2>
          <div className="space-y-2">
            {entries.slice(0, 5).map(entry => (
              <Card key={entry.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      Week {entry.weekNumber}, {entry.year}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getWeekRangeString(entry.weekStartDate, entry.weekEndDate)}
                    </p>
                  </div>
                  <p className="font-bold text-primary">
                    {formatScreenTime(entry.totalMinutes)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      <ScreenTimeLogModal open={showLogModal} onOpenChange={setShowLogModal} />
    </div>
  );
};
