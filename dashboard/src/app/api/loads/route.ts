import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams();

    searchParams.forEach((value, key) => {
      params.append(key, value);
    });
    // Request all loads by default  
    if (!params.has("max_results")) {
      params.set("max_results", "50");
    }

    const url = `${API_URL}/loads?${params.toString()}`;
    const res = await fetch(url, {
      headers: { "X-API-Key": API_KEY },
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch loads" }, { status: 500 });
  }
}
