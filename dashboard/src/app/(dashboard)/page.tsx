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
import { Phone, TrendingUp, MessageSquare, DollarSign, Clock, MapPin } from "lucide-react";

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
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <div className="flex flex-col items-center justify-center text-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            <CardTitle>Total Calls</CardTitle>
            <CardValue>{metrics.total_calls}</CardValue>
          </div>
        </Card>
        <Card>
          <div className="flex flex-col items-center justify-center text-center gap-2">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
            <CardTitle>Booking Rate</CardTitle>
            <CardValue>
              {metrics.booking_rate}%
              <span className="text-xs font-normal text-muted-foreground ml-1">
                ({metrics.booked_count})
              </span>
            </CardValue>
          </div>
        </Card>
        <Card>
          <div className="flex flex-col items-center justify-center text-center gap-2">
            <div className="rounded-lg bg-orange-500/10 p-2">
              <MessageSquare className="h-5 w-5 text-orange-400" />
            </div>
            <CardTitle>Avg. Negotiation Rounds</CardTitle>
            <CardValue>{metrics.avg_negotiation_rounds}</CardValue>
          </div>
        </Card>
        <Card>
          <div className="flex flex-col items-center justify-center text-center gap-2">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <DollarSign className="h-5 w-5 text-blue-400" />
            </div>
            <CardTitle>Avg. Rate Delta</CardTitle>
            <CardValue>
              {metrics.avg_rate_delta_pct > 0 ? "+" : ""}
              {metrics.avg_rate_delta_pct}%
            </CardValue>
          </div>
        </Card>
        <Card>
          <div className="flex flex-col items-center justify-center text-center gap-2">
            <div className="rounded-lg bg-purple-500/10 p-2">
              <Clock className="h-5 w-5 text-purple-400" />
            </div>
            <CardTitle>Avg. Call Duration</CardTitle>
            <CardValue>
              {metrics.avg_call_duration_seconds
                ? `${Math.floor(metrics.avg_call_duration_seconds / 60)}m ${Math.round(metrics.avg_call_duration_seconds % 60)}s`
                : "—"}
            </CardValue>
          </div>
        </Card>
        <Card>
          <div className="flex flex-col items-center justify-center text-center gap-2">
            <div className="rounded-lg bg-cyan-500/10 p-2">
              <MapPin className="h-5 w-5 text-cyan-400" />
            </div>
            <CardTitle>Top Lane</CardTitle>
            <CardValue className="text-lg">
              {metrics.top_lanes.length > 0
                ? `${metrics.top_lanes[0].origin} → ${metrics.top_lanes[0].destination}`
                : "—"}
            </CardValue>
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

      {/* Top Lanes */}
      {metrics.top_lanes.length > 0 && (
        <Card>
          <CardTitle className="mb-4">Top Lanes</CardTitle>
          <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            {metrics.top_lanes.map((lane, i) => (
              <div
                key={`${lane.origin}-${lane.destination}`}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
                  <span className="text-sm truncate">
                    {lane.origin} → {lane.destination}
                  </span>
                </div>
                <span className="text-xs font-mono text-muted-foreground ml-2 shrink-0">
                  {lane.count} calls
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

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
