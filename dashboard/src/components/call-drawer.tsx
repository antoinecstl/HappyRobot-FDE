"use client";

import { format } from "date-fns";
import type { Call } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface CallDrawerProps {
  call: Call;
  onClose: () => void;
}

export function CallDrawer({ call, onClose }: CallDrawerProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border z-50 overflow-y-auto shadow-xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">Call Details</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 hover:bg-accent transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-5">
            <DetailRow label="Call ID" value={call.call_id} mono />
            <DetailRow label="Carrier" value={call.carrier_name} />
            <DetailRow label="MC Number" value={call.mc_number} mono />
            <DetailRow label="Load ID" value={call.load_id || "N/A"} mono />

            <div className="flex gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Outcome</p>
                <Badge variant="outcome" value={call.outcome} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Sentiment</p>
                <Badge variant="sentiment" value={call.sentiment} />
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-medium mb-3">Rate Negotiation</h3>
              <div className="grid grid-cols-2 gap-3">
                <DetailRow
                  label="Initial Rate"
                  value={call.initial_rate ? `$${call.initial_rate.toLocaleString()}` : "N/A"}
                />
                <DetailRow
                  label="Final Rate"
                  value={
                    call.final_agreed_rate
                      ? `$${call.final_agreed_rate.toLocaleString()}`
                      : "N/A"
                  }
                />
                <DetailRow
                  label="Negotiation Rounds"
                  value={String(call.num_negotiations)}
                />
                <DetailRow
                  label="Call Duration"
                  value={call.call_duration_seconds ? `${Math.floor(call.call_duration_seconds / 60)}m ${call.call_duration_seconds % 60}s` : "N/A"}
                />
              </div>
            </div>

            {call.notes && (
              <div className="border-t border-border pt-4">
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-sm text-foreground">{call.notes}</p>
              </div>
            )}

            <div className="border-t border-border pt-4">
              <DetailRow
                label="Timestamp"
                value={format(new Date(call.timestamp), "MMMM d, yyyy 'at' h:mm a")}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className={`text-sm text-foreground ${mono ? "font-mono" : ""}`}>
        {value}
      </p>
    </div>
  );
}
