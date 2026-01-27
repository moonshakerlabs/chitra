import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Plus, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useScreenTime } from './useScreenTime';
import { ScreenTimeLogModal } from './ScreenTimeLogModal';
import { formatScreenTime, getWeekRangeString, getCurrentWeekInfo } from './screenTimeService';
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

export const ScreenTimeTracker = () => {
  const { entries, currentWeekEntry, isLoading, getYearStats, getMonthlyStats } = useScreenTime();
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState(getYear(new Date()).toString());
  const [yearlyStats, setYearlyStats] = useState<{ totalMinutes: number; averagePerWeek: number } | null>(null);
  const [monthlyData, setMonthlyData] = useState<{ month: string; minutes: number }[]>([]);
  const [weeklyData, setWeeklyData] = useState<{ week: number; minutes: number; range: string }[]>([]);

  // Available years (from entries)
  const availableYears = [...new Set(entries.map(e => e.year))].sort((a, b) => b - a);
  if (!availableYears.includes(getYear(new Date()))) {
    availableYears.unshift(getYear(new Date()));
  }

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

  const { weekNumber: currentWeek, year: currentYear } = getCurrentWeekInfo();

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
            <p className="text-sm text-muted-foreground">Weekly phone usage tracking</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowLogModal(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Log
        </Button>
      </motion.div>

      {/* Current Week Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Week (Week {currentWeek})</p>
                {currentWeekEntry ? (
                  <p className="text-2xl font-bold text-foreground">
                    {formatScreenTime(currentWeekEntry.totalMinutes)}
                  </p>
                ) : (
                  <p className="text-lg font-medium text-muted-foreground">Not logged yet</p>
                )}
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Year Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground">Statistics</h2>
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

      {/* Charts */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
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
                    No data for {selectedYear}
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
                    No data for {selectedYear}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* History */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <h2 className="font-semibold text-foreground mb-3">History</h2>
        <div className="space-y-2">
          {entries.length > 0 ? (
            entries.slice(0, 10).map(entry => (
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
            ))
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-4 text-center text-muted-foreground">
                No entries yet. Start logging your weekly screen time!
              </CardContent>
            </Card>
          )}
        </div>
      </motion.div>

      <ScreenTimeLogModal open={showLogModal} onOpenChange={setShowLogModal} />
    </div>
  );
};
