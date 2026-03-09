"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS: Record<string, string> = {
  booked: "#10b981",
  transferred: "#3b82f6",
  price_rejected: "#f97316",
  no_load_found: "#eab308",
  carrier_ineligible: "#ef4444",
  hung_up: "#64748b",
};

interface OutcomeChartProps {
  data: Record<string, number>;
}

export function OutcomeChart({ data }: OutcomeChartProps) {
  const chartData = Object.entries(data).map(([name, value]) => ({
    name: name.replace(/_/g, " "),
    value,
    key: name,
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((entry) => (
            <Cell
              key={entry.key}
              fill={COLORS[entry.key] || "#64748b"}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(222.2, 84%, 4.9%)",
            border: "1px solid hsl(217.2, 32.6%, 17.5%)",
            borderRadius: "8px",
            color: "hsl(210, 40%, 98%)",
            textTransform: "capitalize",
          }}
        />
        <Legend
          formatter={(value: string) => (
            <span className="text-xs text-muted-foreground capitalize">
              {value}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
