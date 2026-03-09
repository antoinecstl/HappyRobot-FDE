"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import type { Call } from "@/lib/types";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/ui/skeleton";
import { CallDrawer } from "@/components/call-drawer";
import { X, Filter } from "lucide-react";

const OUTCOMES = [
  "booked",
  "no_load_found",
  "price_rejected",
  "carrier_ineligible",
  "hung_up",
  "transferred",
];
const SENTIMENTS = ["positive", "neutral", "negative"];

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);

  // Filters
  const [outcomeFilter, setOutcomeFilter] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchCalls = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (outcomeFilter) params.set("outcome", outcomeFilter);
      if (sentimentFilter) params.set("sentiment", sentimentFilter);
      if (dateFrom) params.set("date_from", new Date(dateFrom).toISOString());
      if (dateTo) params.set("date_to", new Date(dateTo).toISOString());

      const res = await fetch(`/api/calls?${params.toString()}`);
      const data = await res.json();
      setCalls(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch calls:", err);
    } finally {
      setLoading(false);
    }
  }, [outcomeFilter, sentimentFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  const clearFilters = () => {
    setOutcomeFilter("");
    setSentimentFilter("");
    setDateFrom("");
    setDateTo("");
  };

  const hasFilters = outcomeFilter || sentimentFilter || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Calls Log</h1>

      {/* Filters */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="mb-0">Filters</CardTitle>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="">All Outcomes</option>
            {OUTCOMES.map((o) => (
              <option key={o} value={o}>
                {o.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <select
            value={sentimentFilter}
            onChange={(e) => setSentimentFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="">All Sentiments</option>
            {SENTIMENTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder="From"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder="To"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>
      </Card>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={8} />
      ) : calls.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <p className="text-muted-foreground text-sm">No calls found.</p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="mt-2 text-primary text-sm hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground bg-muted/30">
                  <th className="text-left py-3 px-4 font-medium">Call ID</th>
                  <th className="text-left py-3 px-4 font-medium">Carrier</th>
                  <th className="text-left py-3 px-4 font-medium">MC#</th>
                  <th className="text-left py-3 px-4 font-medium">Load</th>
                  <th className="text-left py-3 px-4 font-medium">Outcome</th>
                  <th className="text-left py-3 px-4 font-medium">Sentiment</th>
                  <th className="text-right py-3 px-4 font-medium">Initial</th>
                  <th className="text-right py-3 px-4 font-medium">Final</th>
                  <th className="text-center py-3 px-4 font-medium">Rounds</th>
                  <th className="text-right py-3 px-4 font-medium">Duration</th>
                  <th className="text-right py-3 px-4 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {calls.map((call) => (
                  <tr
                    key={call.call_id}
                    onClick={() => setSelectedCall(call)}
                    className="border-b border-border/50 hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono text-xs">{call.call_id}</td>
                    <td className="py-3 px-4">{call.carrier_name}</td>
                    <td className="py-3 px-4 font-mono text-xs">{call.mc_number}</td>
                    <td className="py-3 px-4 font-mono text-xs">{call.load_id || "—"}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outcome" value={call.outcome} />
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="sentiment" value={call.sentiment} />
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      ${call.initial_rate.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {call.final_agreed_rate
                        ? `$${call.final_agreed_rate.toLocaleString()}`
                        : "—"}
                    </td>
                    <td className="py-3 px-4 text-center">{call.num_negotiations}</td>
                    <td className="py-3 px-4 text-right text-muted-foreground">
                      {Math.floor(call.call_duration_seconds / 60)}m{" "}
                      {call.call_duration_seconds % 60}s
                    </td>
                    <td className="py-3 px-4 text-right text-muted-foreground text-xs">
                      {format(new Date(call.timestamp), "MMM d, h:mm a")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Side Drawer */}
      {selectedCall && (
        <CallDrawer call={selectedCall} onClose={() => setSelectedCall(null)} />
      )}
    </div>
  );
}
