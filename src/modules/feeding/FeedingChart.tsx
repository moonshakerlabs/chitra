import { useMemo } from 'react';
import { format, parseISO, subDays, eachDayOfInterval } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card } from '@/components/ui/card';
import type { FeedingLog, FeedingType } from '@/core/types';
import { getFeedingTypeName } from './feedingService';

interface FeedingChartProps {
  logs: FeedingLog[];
}

const COLORS = {
  breast_milk: 'hsl(330, 81%, 60%)',
  formula: 'hsl(210, 80%, 55%)',
  solid_food: 'hsl(145, 60%, 45%)',
  water: 'hsl(200, 80%, 55%)',
  other: 'hsl(270, 65%, 55%)',
};

const FeedingChart = ({ logs }: FeedingChartProps) => {
  // Bar chart data - feedings per day for last 7 days
  const barChartData = useMemo(() => {
    const today = new Date();
    const days = eachDayOfInterval({
      start: subDays(today, 6),
      end: today,
    });

    return days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayLogs = logs.filter(
        (l) => l.createdAt.startsWith(dateStr) && !l.snoozed
      );

      return {
        date: format(day, 'EEE'),
        fullDate: format(day, 'MMM d'),
        count: dayLogs.length,
      };
    });
  }, [logs]);

  // Pie chart data - feedings by type
  const pieChartData = useMemo(() => {
    const validLogs = logs.filter((l) => !l.snoozed);
    const counts: { [key in FeedingType]?: number } = {};

    for (const log of validLogs) {
      const type = log.feedingType || 'breast_milk';
      counts[type] = (counts[type] || 0) + 1;
    }

    return Object.entries(counts).map(([type, count]) => ({
      name: getFeedingTypeName(type as FeedingType),
      type: type as FeedingType,
      value: count,
    }));
  }, [logs]);

  // Time distribution data - feedings by hour
  const timeDistribution = useMemo(() => {
    const validLogs = logs.filter((l) => !l.snoozed);
    const hourCounts: { [hour: number]: number } = {};

    for (const log of validLogs) {
      const hour = parseISO(log.createdAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }

    // Group into time ranges
    const ranges = [
      { label: 'Night (12AM-6AM)', hours: [0, 1, 2, 3, 4, 5], count: 0 },
      { label: 'Morning (6AM-12PM)', hours: [6, 7, 8, 9, 10, 11], count: 0 },
      { label: 'Afternoon (12PM-6PM)', hours: [12, 13, 14, 15, 16, 17], count: 0 },
      { label: 'Evening (6PM-12AM)', hours: [18, 19, 20, 21, 22, 23], count: 0 },
    ];

    for (const range of ranges) {
      range.count = range.hours.reduce((sum, h) => sum + (hourCounts[h] || 0), 0);
    }

    return ranges;
  }, [logs]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-2 shadow-lg">
          <p className="text-sm font-medium">{payload[0].payload.fullDate || label}</p>
          <p className="text-sm text-primary">
            {payload[0].value} feeding{payload[0].value !== 1 ? 's' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-2 shadow-lg">
          <p className="text-sm font-medium">{payload[0].name}</p>
          <p className="text-sm text-primary">
            {payload[0].value} ({Math.round((payload[0].value / logs.filter(l => !l.snoozed).length) * 100)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (logs.filter(l => !l.snoozed).length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">No feeding data to display</p>
        <p className="text-sm text-muted-foreground mt-1">
          Start logging feedings to see charts
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Daily Feedings Bar Chart */}
      <Card className="p-4">
        <h3 className="text-sm font-medium text-foreground mb-4">
          Feedings This Week
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData}>
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="count" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Feeding Type Distribution */}
      <Card className="p-4">
        <h3 className="text-sm font-medium text-foreground mb-4">
          Feeding Types
        </h3>
        <div className="flex items-center gap-4">
          <div className="h-40 w-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={60}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[entry.type] || COLORS.other}
                    />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            {pieChartData.map((entry) => (
              <div key={entry.type} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[entry.type] || COLORS.other }}
                />
                <span className="text-sm text-foreground flex-1">{entry.name}</span>
                <span className="text-sm text-muted-foreground">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Time Distribution */}
      <Card className="p-4">
        <h3 className="text-sm font-medium text-foreground mb-4">
          Feeding Times
        </h3>
        <div className="space-y-3">
          {timeDistribution.map((range) => {
            const total = logs.filter(l => !l.snoozed).length;
            const percentage = total > 0 ? (range.count / total) * 100 : 0;
            
            return (
              <div key={range.label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{range.label}</span>
                  <span className="text-foreground">{range.count}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default FeedingChart;
