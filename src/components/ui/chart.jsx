import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";

// Chart context
const ChartContext = React.createContext(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }
  return context;
}

// Chart container
const ChartContainer = React.forwardRef(
  ({ id, className, children, config = {}, ...props }, ref) => {
    const uniqueId = React.useId();
    const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

    return (
      <ChartContext.Provider value={{ config }}>
        <div
          data-chart={chartId}
          ref={ref}
          className={cn(
            "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]-muted-foreground",
            className
          )}
          {...props}
        >
          <ChartStyle id={chartId} config={config} />
          <RechartsPrimitive.ResponsiveContainer>
            {children}
          </RechartsPrimitive.ResponsiveContainer>
        </div>
      </ChartContext.Provider>
    );
  }
);
ChartContainer.displayName = "ChartContainer";

// Inject custom CSS for chart colors
const ChartStyle = ({ id, config }) => {
  const colorConfig = Object.entries(config).filter(
    ([_, itemConfig]) => itemConfig.theme || itemConfig.color
  );

  if (!colorConfig.length) return null;

  const css = colorConfig
    .map(([key, itemConfig]) => {
      const color = itemConfig.color || "";
      return `  --color-${key}: ${color};`;
    })
    .join("\n");

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `[data-chart=${id}] {\n${css}\n}`,
      }}
    />
  );
};

// Chart tooltip wrapper
const ChartTooltip = RechartsPrimitive.Tooltip;

const ChartTooltipContent = React.forwardRef(
  ({ active, payload, className }, ref) => {
    const { config } = useChart();

    if (!active || !payload?.length) return null;

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
      >
        {payload.map((item) => (
          <div
            key={item.dataKey}
            className="flex items-center gap-2"
            style={{
              color: config[item.dataKey]?.color || item.color,
            }}
          >
            {item.value}
          </div>
        ))}
      </div>
    );
  }
);
ChartTooltipContent.displayName = "ChartTooltipContent";

// Chart legend wrapper
const ChartLegend = RechartsPrimitive.Legend;

const ChartLegendContent = React.forwardRef(
  ({ payload, className, hideIcon = false }, ref) => {
    const { config } = useChart();
    if (!payload?.length) return null;

    return (
      <div ref={ref} className={cn("flex items-center gap-4", className)}>
        {payload.map((item) => {
          const color = config[item.dataKey]?.color || item.color;
          return (
            <div key={item.value} className="flex items-center gap-1.5">
              {!hideIcon && <div className="h-2 w-2 rounded" style={{ backgroundColor: color }} />}
              {item.value}
            </div>
          );
        })}
      </div>
    );
  }
);
ChartLegendContent.displayName = "ChartLegendContent";

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  useChart,
};
