import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Activity, Cpu, HardDrive, Zap } from 'lucide-react';

export function PerformanceMetrics() {
  const [metrics, setMetrics] = useState({
    responseTime: 0,
    serverLoad: 0,
    memoryUsage: 0,
    activeConnections: 0
  });

  useEffect(() => {
    // Simulate real-time metrics updates
    const interval = setInterval(() => {
      setMetrics({
        responseTime: Math.floor(Math.random() * 200) + 50, // 50-250ms
        serverLoad: Math.floor(Math.random() * 80) + 20, // 20-100%
        memoryUsage: Math.floor(Math.random() * 60) + 40, // 40-100%
        activeConnections: Math.floor(Math.random() * 500) + 100 // 100-600
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (value, thresholds) => {
    if (value <= thresholds.low) return 'text-green-400';
    if (value <= thresholds.medium) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getProgressColor = (value, thresholds) => {
    if (value <= thresholds.low) return 'bg-green-500';
    if (value <= thresholds.medium) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Response Time */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-300">Avg Response Time</span>
            </div>
            <span className={`text-sm font-bold ${getStatusColor(metrics.responseTime, { low: 100, medium: 150 })}`}>
              {metrics.responseTime}ms
            </span>
          </div>
          <Progress
            value={(metrics.responseTime / 250) * 100}
            className="h-2"
          />
        </div>

        {/* Server Load */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-300">Server Load</span>
            </div>
            <span className={`text-sm font-bold ${getStatusColor(metrics.serverLoad, { low: 50, medium: 75 })}`}>
              {metrics.serverLoad}%
            </span>
          </div>
          <Progress
            value={metrics.serverLoad}
            className="h-2"
          />
        </div>

        {/* Memory Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-300">Memory Usage</span>
            </div>
            <span className={`text-sm font-bold ${getStatusColor(metrics.memoryUsage, { low: 60, medium: 80 })}`}>
              {metrics.memoryUsage}%
            </span>
          </div>
          <Progress
            value={metrics.memoryUsage}
            className="h-2"
          />
        </div>

        {/* Active Connections */}
        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-300">Active Connections</span>
          </div>
          <span className="text-lg font-bold text-white">
            {metrics.activeConnections.toLocaleString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
