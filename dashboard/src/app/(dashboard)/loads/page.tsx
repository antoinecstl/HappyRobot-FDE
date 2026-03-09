"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import type { Load, Call } from "@/lib/types";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Package } from "lucide-react";

export default function LoadsPage() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [bookedLoadIds, setBookedLoadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [loadsRes, callsRes] = await Promise.all([
        fetch("/api/loads"),
        fetch("/api/calls?outcome=booked"),
      ]);
      const loadsData = await loadsRes.json();
      const callsData = await callsRes.json();

      setLoads(Array.isArray(loadsData) ? loadsData : []);

      const booked = new Set<string>();
      if (Array.isArray(callsData)) {
        callsData.forEach((c: Call) => {
          if (c.load_id) booked.add(c.load_id);
        });
      }
      setBookedLoadIds(booked);
    } catch (err) {
      console.error("Failed to fetch loads:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Load Inventory</h1>
        <TableSkeleton rows={8} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Load Inventory</h1>
        <span className="text-sm text-muted-foreground">
          {loads.length} loads
        </span>
      </div>

      {loads.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">No loads available.</p>
          </div>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground bg-muted/30">
                  <th className="text-left py-3 px-4 font-medium">Load ID</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Origin</th>
                  <th className="text-left py-3 px-4 font-medium">Destination</th>
                  <th className="text-left py-3 px-4 font-medium">Equipment</th>
                  <th className="text-right py-3 px-4 font-medium">Rate</th>
                  <th className="text-right py-3 px-4 font-medium">Miles</th>
                  <th className="text-right py-3 px-4 font-medium">Weight</th>
                  <th className="text-left py-3 px-4 font-medium">Commodity</th>
                  <th className="text-left py-3 px-4 font-medium">Pickup</th>
                  <th className="text-left py-3 px-4 font-medium">Delivery</th>
                </tr>
              </thead>
              <tbody>
                {loads.map((load) => {
                  const isBooked = bookedLoadIds.has(load.load_id);
                  return (
                    <tr
                      key={load.load_id}
                      className="border-b border-border/50 hover:bg-accent/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-xs font-medium">
                        {load.load_id}
                      </td>
                      <td className="py-3 px-4">
                        {isBooked ? (
                          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                            Booked
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium bg-blue-500/10 text-blue-400 border-blue-500/20">
                            Available
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">{load.origin}</td>
                      <td className="py-3 px-4">{load.destination}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs">
                          {load.equipment_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-emerald-400">
                        ${load.loadboard_rate.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-muted-foreground">
                        {load.miles.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-muted-foreground">
                        {load.weight.toLocaleString()} lbs
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {load.commodity_type}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {format(new Date(load.pickup_datetime), "MMM d, h:mm a")}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {format(new Date(load.delivery_datetime), "MMM d, h:mm a")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
