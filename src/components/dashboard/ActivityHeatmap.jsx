import React from "react";

// Sample heatmap data - 7 days x 24 hours
const generateHeatmapData = () => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const data = [];
  
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      data.push({
        day: days[day],
        hour: `${hour}:00`,
        value: Math.floor(Math.random() * 100),
        dayNum: day,
        hourNum: hour
      });
    }
  }
  
  return data;
};

const getHeatColor = (value) => {
  if (value < 20) return "bg-slate-800";
  if (value < 40) return "bg-blue-900";
  if (value < 60) return "bg-blue-600";
  if (value < 80) return "bg-blue-400";
  return "bg-blue-300";
};

export function ActivityHeatmap() {
  const data = generateHeatmapData();
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Activity Heatmap</h3>
        <p className="text-sm text-muted-foreground">Weekly player activity by hour</p>
      </div>
      
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Hour labels */}
          <div className="flex gap-1 mb-1">
            <div className="w-12" />
            {hours.map((hour, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 w-6 text-center text-xs text-muted-foreground"
              >
                {idx % 6 === 0 ? hour : ""}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          {days.map((day, dayIdx) => (
            <div key={day} className="flex gap-1 mb-1">
              <div className="w-12 flex items-center text-xs font-medium text-foreground">
                {day}
              </div>
              {hours.map((hour, hourIdx) => {
                const cellData = data.find(
                  (d) => d.dayNum === dayIdx && d.hourNum === hourIdx
                );
                return (
                  <div
                    key={`${day}-${hour}`}
                    className={`flex-shrink-0 w-6 h-6 rounded-sm ${getHeatColor(
                      cellData?.value || 0
                    )} hover:opacity-80 transition-opacity cursor-pointer`}
                    title={`${day} ${hour}: ${cellData?.value || 0} activities`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center gap-4">
        <span className="text-xs text-muted-foreground">Activity:</span>
        <div className="flex gap-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-slate-800 rounded-sm" />
            <span className="text-xs text-muted-foreground">Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-600 rounded-sm" />
            <span className="text-xs text-muted-foreground">Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-300 rounded-sm" />
            <span className="text-xs text-muted-foreground">High</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActivityHeatmap;
