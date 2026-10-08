import { NextResponse } from "next/server";
import { listBookings, monthRevenue } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);
  const bookings = await listBookings(today);
  return NextResponse.json({
    date: today,
    bookings,
    counts: {
      total: bookings.length,
      done: bookings.filter((b) => b.status === "done").length,
      booked: bookings.filter((b) => b.status === "booked").length,
    },
    monthRevenue: await monthRevenue(),
  });
}
