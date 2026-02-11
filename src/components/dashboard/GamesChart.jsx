import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Corrected data array
const data = [
  { name: "Mon", games: 400, users: 240 },
  { name: "Tue", games: 300, users: 139 },
  { name: "Wed", games: 200, users: 980 },
  { name: "Thu", games: 278, users: 390 },
  { name: "Fri", games: 189, users: 480 },
  { name: "Sat", games: 239, users: 380 },
  { name: "Sun", games: 349, users: 430 },
];

export function GamesChart() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Weekly Overview</h3>
        <p className="text-sm text-muted-foreground">Games and active users this week</p>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorGames" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(43, 100%, 50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(43, 100%, 50%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 22%)" />
            <XAxis
              dataKey="name"
              stroke="hsl(220, 10%, 55%)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(220, 10%, 55%)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value / 1000}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220, 18%, 13%)",
                border: "1px solid hsl(220, 15%, 22%)",
                borderRadius: "8px",
                color: "hsl(40, 20%, 95%)",
              }}
            />
            <Area
              type="monotone"
              dataKey="games"
              stroke="hsl(43, 100%, 50%)"
              fillOpacity={1}
              fill="url(#colorGames)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="users"
              stroke="hsl(199, 89%, 48%)"
              fillOpacity={1}
              fill="url(#colorUsers)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-primary" />
          <span className="text-sm text-muted-foreground">Games Played</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-info" />
          <span className="text-sm text-muted-foreground">Active Users</span>
        </div>
      </div>
    </div>
  );
}
