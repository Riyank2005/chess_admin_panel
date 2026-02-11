import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  ComposedChart
} from "recharts";
import { TrendingUp, Users, Gamepad2, Activity, RefreshCw, FileText, Calendar, BarChart3, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportsGenerator } from "@/components/analytics/ReportsGenerator";
import { RetentionCohortAnalysis } from "@/components/analytics/RetentionCohortAnalysis";
import { useState } from "react";
import { format, subWeeks, subMonths } from "date-fns";

const dailyData = [
  { date: "Jan 14", users: 1200, games: 4300 },
  { date: "Jan 15", users: 1400, games: 4500 },
  { date: "Jan 16", users: 1300, games: 4600 },
  { date: "Jan 17", users: 1500, games: 4800 },
  { date: "Jan 18", users: 1600, games: 5000 },
  { date: "Jan 19", users: 1700, games: 5200 },
  { date: "Jan 20", users: 1800, games: 5400 },
];

const timeControlData = [
  { name: "Bullet", value: 300 },
  { name: "Blitz", value: 500 },
  { name: "Rapid", value: 200 },
  { name: "Classical", value: 100 },
];

const peakHoursData = [
  { hour: "00", users: 50 },
  { hour: "04", users: 35 },
  { hour: "08", users: 120 },
  { hour: "12", users: 300 },
  { hour: "16", users: 450 },
  { hour: "20", users: 600 },
];

const COLORS = ["#00C6FF", "#0072FF", "#10B981", "#F43F5E"];

export default function Analytics() {
  // Local UI state for controls referenced in the JSX
  const [timeRange, setTimeRange] = useState("7d");
  const handleTimeRangeChange = (value) => setTimeRange(value);

  const [comparisonMode, setComparisonMode] = useState(false);
  const handleComparisonToggle = () => setComparisonMode((v) => !v);

  const [showReportsGenerator, setShowReportsGenerator] = useState(false);
  const [showRetentionAnalysis, setShowRetentionAnalysis] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-1.5 bg-primary rounded-full"></div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Analytics</h1>
              <p className="text-sm font-medium text-muted-foreground mt-1">Platform telemetry and performance metrics</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={handleTimeRangeChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">1 Day</SelectItem>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="90d">90 Days</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={comparisonMode ? "default" : "outline"}
              size="sm"
              onClick={handleComparisonToggle}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Compare
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReportsGenerator(true)}
            >
              <FileText className="w-4 h-4 mr-2" />
              Reports
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRetentionAnalysis(true)}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Retention
            </Button>
            <Button variant="outline" size="icon" className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[2rem] p-6 border border-white/5 bg-white/[0.02] backdrop-blur-md relative overflow-hidden group">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Users</p>
          <div className="flex items-baseline gap-2 mt-4">
            <p className="text-3xl font-bold text-white tracking-tight tabular-nums">3,847</p>
            <span className="text-[10px] font-bold text-emerald-400 uppercase">+12%</span>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-primary w-2/3 shadow-[0_0_10px_rgba(0,198,255,0.4)]"></div>
          </div>
        </div>
        <div className="rounded-[2rem] p-6 border border-white/5 bg-white/[0.02] backdrop-blur-md relative overflow-hidden group">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Games Played</p>
          <div className="flex items-baseline gap-2 mt-4">
            <p className="text-3xl font-bold text-white tracking-tight tabular-nums">8,432</p>
            <span className="text-[10px] font-bold text-emerald-400 uppercase">+8%</span>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-blue-500 w-1/2"></div>
          </div>
        </div>
        <div className="rounded-[2rem] p-6 border border-white/5 bg-white/[0.02] backdrop-blur-md relative overflow-hidden group">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Server Health</p>
          <div className="flex items-baseline gap-2 mt-4">
            <p className="text-3xl font-bold text-white tracking-tight tabular-nums">99.9%</p>
            <span className="text-[10px] font-bold text-emerald-400 uppercase">STABLE</span>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-emerald-500 w-[99.9%]"></div>
          </div>
        </div>
        <div className="rounded-[2rem] p-6 border border-white/5 bg-white/[0.02] backdrop-blur-md relative overflow-hidden group">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Peak Concurrent</p>
          <div className="flex items-baseline gap-2 mt-4">
            <p className="text-3xl font-bold text-white tracking-tight tabular-nums">3,500</p>
            <span className="text-[10px] font-bold text-blue-400 uppercase">MAX</span>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-primary w-[85%]"></div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-[2.5rem] p-8 border border-white/5 bg-white/[0.02] backdrop-blur-md">
          <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-8 flex items-center gap-3">
            <Activity className="h-5 w-5 text-primary" />
            User Growth
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00C6FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00C6FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.1)" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.1)" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }}
                />
                <Area type="monotone" dataKey="users" stroke="#00C6FF" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[2.5rem] p-8 border border-white/5 bg-white/[0.02] backdrop-blur-md">
          <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-8 flex items-center gap-3">
            <Gamepad2 className="h-5 w-5 text-blue-500" />
            Game Formats
          </h3>
          <div className="h-[350px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={timeControlData}
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {timeControlData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
