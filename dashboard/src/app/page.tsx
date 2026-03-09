"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import type { Metrics, Call } from "@/lib/types";
import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CardSkeleton, ChartSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { CallsChart } from "@/components/charts/calls-chart";
import { OutcomeChart } from "@/components/charts/outcome-chart";
import { SentimentChart } from "@/components/charts/sentiment-chart";
import { Phone, TrendingUp, MessageSquare, DollarSign } from "lucide-react";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [metricsRes, callsRes] = await Promise.all([
        fetch("/api/metrics"),
        fetch("/api/calls"),
      ]);
      const metricsData = await metricsRes.json();
      const callsData = await callsRes.json();
      setMetrics(metricsData);
      setCalls(Array.isArray(callsData) ? callsData.slice(0, 10) : []);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ChartSkeleton key={i} />
          ))}
        </div>
        <TableSkeleton rows={5} />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Failed to load dashboard data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <span className="text-xs text-muted-foreground">
          Auto-refreshes every 30s
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Total Calls</CardTitle>
              <CardValue>{metrics.total_calls}</CardValue>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <CardTitle>Booking Rate</CardTitle>
              <CardValue>{metrics.booking_rate}%</CardValue>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-500/10 p-2">
              <MessageSquare className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <CardTitle>Avg. Negotiation Rounds</CardTitle>
              <CardValue>{metrics.avg_negotiation_rounds}</CardValue>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <DollarSign className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <CardTitle>Avg. Rate Delta</CardTitle>
              <CardValue>
                {metrics.avg_rate_delta_pct > 0 ? "+" : ""}
                {metrics.avg_rate_delta_pct}%
              </CardValue>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardTitle className="mb-4">Calls Per Day (14 Days)</CardTitle>
          <CallsChart data={metrics.calls_per_day} />
        </Card>
        <Card>
          <CardTitle className="mb-4">Call Outcomes</CardTitle>
          <OutcomeChart data={metrics.outcome_breakdown} />
        </Card>
        <Card>
          <CardTitle className="mb-4">Sentiment Breakdown</CardTitle>
          <SentimentChart data={metrics.sentiment_breakdown} />
        </Card>
      </div>

      {/* Recent Calls Table */}
      <Card>
        <CardTitle className="mb-4">Recent Calls</CardTitle>
        {calls.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No calls recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-3 px-2 font-medium">Call ID</th>
                  <th className="text-left py-3 px-2 font-medium">Carrier</th>
                  <th className="text-left py-3 px-2 font-medium">MC#</th>
                  <th className="text-left py-3 px-2 font-medium">Outcome</th>
                  <th className="text-left py-3 px-2 font-medium">Sentiment</th>
                  <th className="text-right py-3 px-2 font-medium">Rate</th>
                  <th className="text-right py-3 px-2 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {calls.map((call) => (
                  <tr
                    key={call.call_id}
                    className="border-b border-border/50 hover:bg-accent/50 transition-colors"
                  >
                    <td className="py-3 px-2 font-mono text-xs">
                      {call.call_id}
                    </td>
                    <td className="py-3 px-2">{call.carrier_name}</td>
                    <td className="py-3 px-2 font-mono text-xs">
                      {call.mc_number}
                    </td>
                    <td className="py-3 px-2">
                      <Badge variant="outcome" value={call.outcome} />
                    </td>
                    <td className="py-3 px-2">
                      <Badge variant="sentiment" value={call.sentiment} />
                    </td>
                    <td className="py-3 px-2 text-right font-mono">
                      {call.final_agreed_rate
                        ? `$${call.final_agreed_rate.toLocaleString()}`
                        : "—"}
                    </td>
                    <td className="py-3 px-2 text-right text-muted-foreground text-xs">
                      {format(new Date(call.timestamp), "MMM d, h:mm a")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
