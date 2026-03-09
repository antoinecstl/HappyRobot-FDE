// Types shared across the dashboard

export interface Load {
  load_id: string;
  origin: string;
  destination: string;
  pickup_datetime: string;
  delivery_datetime: string;
  equipment_type: string;
  loadboard_rate: number;
  notes: string;
  weight: number;
  commodity_type: string;
  num_of_pieces: number;
  miles: number;
  dimensions: string;
}

export interface Call {
  call_id: string;
  mc_number: string;
  carrier_name: string;
  load_id: string | null;
  initial_rate: number;
  final_agreed_rate: number | null;
  num_negotiations: number;
  outcome: string;
  sentiment: string;
  call_duration_seconds: number;
  notes: string;
  timestamp: string;
}

export interface CallsPerDay {
  date: string;
  count: number;
}

export interface TopLane {
  origin: string;
  destination: string;
  count: number;
}

export interface Metrics {
  total_calls: number;
  booked_count: number;
  booking_rate: number;
  avg_negotiation_rounds: number;
  avg_rate_delta_pct: number;
  sentiment_breakdown: Record<string, number>;
  outcome_breakdown: Record<string, number>;
  calls_per_day: CallsPerDay[];
  avg_call_duration_seconds: number;
  top_lanes: TopLane[];
}
