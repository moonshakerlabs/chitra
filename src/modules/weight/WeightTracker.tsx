import { useState } from 'react';
import { motion } from 'framer-motion';
import { Scale, Plus, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useWeights, useLatestWeight, useWeightTrend, useWeightChart } from './useWeight';
import { formatDate } from '@/core/utils/dateUtils';
import { formatWeight } from '@/core/utils/helpers';
import WeightLogModal from './WeightLogModal';
import { getPreferences } from '@/core/storage';
import { useEffect, useState as useLocalState } from 'react';
import type { WeightUnit } from '@/core/types';

const WeightTracker = () => {
  const { weights, loading, reload } = useWeights();
  const { weight: latestWeight, reload: reloadLatest } = useLatestWeight();
  const { trend, reload: reloadTrend } = useWeightTrend(30);
  const { data: chartData, reload: reloadChart } = useWeightChart(30);
  const [showLogModal, setShowLogModal] = useState(false);
  const [unit, setUnit] = useLocalState<WeightUnit>('kg');

  useEffect(() => {
    const loadUnit = async () => {
      const prefs = await getPreferences();
      setUnit(prefs.weightUnit);
    };
    loadUnit();
  }, []);

  const handleLogComplete = () => {
    setShowLogModal(false);
    reload();
    reloadLatest();
    reloadTrend();
    reloadChart();
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.direction === 'increasing') return <TrendingUp className="w-5 h-5" />;
    if (trend.direction === 'decreasing') return <TrendingDown className="w-5 h-5" />;
    return <Minus className="w-5 h-5" />;
  };

  const getTrendColor = () => {
    if (!trend) return 'text-muted-foreground';
    // Neutral colors - not judgmental
    return 'text-muted-foreground';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse-soft text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Weight Journey</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your progress</p>
        </div>
        <Button
          size="icon"
          variant="outline"
          onClick={() => setShowLogModal(true)}
          className="rounded-full w-12 h-12"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Current Weight Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="overflow-hidden">
          <div className="gradient-primary p-6">
            <div className="flex items-center gap-3 text-primary-foreground mb-4">
              <Scale className="w-6 h-6" />
              <span className="font-medium">Current Weight</span>
            </div>
            
            {latestWeight ? (
              <div className="text-primary-foreground">
                <p className="text-4xl font-bold mb-1">
                  {formatWeight(latestWeight.weight, latestWeight.unit)}
                </p>
                <p className="opacity-90 text-sm">
                  Last logged: {formatDate(latestWeight.date, 'MMM d, yyyy')}
                </p>
              </div>
            ) : (
              <div className="text-primary-foreground">
                <p className="text-3xl font-bold mb-1">No Data Yet</p>
                <p className="opacity-90">Start logging your weight</p>
              </div>
            )}
          </div>
          
          <CardContent className="p-4">
            <Button
              onClick={() => setShowLogModal(true)}
              className="w-full h-12 rounded-xl text-base font-medium"
            >
              Log Today's Weight
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Trend Card */}
      {trend && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">30-Day Trend</p>
                <div className="flex items-center gap-2">
                  <span className={getTrendColor()}>
                    {getTrendIcon()}
                  </span>
                  <span className="text-lg font-semibold text-foreground capitalize">
                    {trend.direction}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">
                  {trend.changeAmount > 0 ? '+' : ''}{trend.changeAmount} {unit}
                </p>
                <p className="text-sm text-muted-foreground">
                  {trend.changePercentage > 0 ? '+' : ''}{trend.changePercentage}%
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Chart */}
      {chartData.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Progress Chart</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => formatDate(date, 'MMM d')}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      domain={['auto', 'auto']}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-popover border border-border rounded-lg p-2 shadow-lg">
                              <p className="text-xs text-muted-foreground">
                                {formatDate(payload[0].payload.date, 'MMM d, yyyy')}
                              </p>
                              <p className="text-sm font-semibold text-foreground">
                                {payload[0].value} {unit}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recent Entries */}
      {weights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-lg font-semibold text-foreground mb-3">Recent Entries</h2>
          <div className="space-y-2">
            {weights.slice(0, 5).map((entry) => (
              <Card key={entry.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      {formatWeight(entry.weight, entry.unit)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(entry.date, 'MMM d, yyyy')}
                    </p>
                  </div>
                  {entry.notes && (
                    <p className="text-xs text-muted-foreground max-w-[150px] truncate">
                      {entry.notes}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* Log Modal */}
      <WeightLogModal
        open={showLogModal}
        onClose={() => setShowLogModal(false)}
        onComplete={handleLogComplete}
        defaultUnit={unit}
      />
    </div>
  );
};

export default WeightTracker;
