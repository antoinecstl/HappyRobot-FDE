"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const COLORS: Record<string, string> = {
  positive: "#10b981",
  neutral: "#64748b",
  negative: "#ef4444",
};

interface SentimentChartProps {
  data: Record<string, number>;
}

export function SentimentChart({ data }: SentimentChartProps) {
  const chartData = Object.entries(data).map(([name, value]) => ({
    name,
    value,
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
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(217.2, 32.6%, 17.5%)" />
        <XAxis
          dataKey="name"
          stroke="hsl(215, 20.2%, 65.1%)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          className="capitalize"
        />
        <YAxis
          stroke="hsl(215, 20.2%, 65.1%)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(222.2, 84%, 4.9%)",
            border: "1px solid hsl(217.2, 32.6%, 17.5%)",
            borderRadius: "8px",
            color: "hsl(210, 40%, 98%)",
            textTransform: "capitalize",
          }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {chartData.map((entry) => (
            <Cell
              key={entry.name}
              fill={COLORS[entry.name] || "#64748b"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
