"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { CallsPerDay } from "@/lib/types";

interface CallsChartProps {
  data: CallsPerDay[];
}

export function CallsChart({ data }: CallsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
        No data available
      </div>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    label: d.date.slice(5), // MM-DD
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={formatted}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(217.2, 32.6%, 17.5%)" />
        <XAxis
          dataKey="label"
          stroke="hsl(215, 20.2%, 65.1%)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
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
          }}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke="hsl(217.2, 91.2%, 59.8%)"
          strokeWidth={2}
          dot={{ fill: "hsl(217.2, 91.2%, 59.8%)", r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
