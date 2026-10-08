import { NextResponse } from "next/server";
import { createBooking, deleteBooking, listBookings } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const date = new URL(req.url).searchParams.get("date") ?? undefined;
  return NextResponse.json({ bookings: await listBookings(date) });
}

export async function POST(req: Request) {
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Send booking JSON." }, { status: 400 });
  }
  try {
    const doc = await createBooking({
      customerName: String(b.customerName ?? ""),
      phone: String(b.phone ?? ""),
      serviceId: String(b.serviceId ?? ""),
      staffId: String(b.staffId ?? ""),
      date: String(b.date ?? ""),
      time: String(b.time ?? ""),
      note: String(b.note ?? ""),
    });
    return NextResponse.json(doc, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed." }, { status: 422 });
  }
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  return NextResponse.json({ deleted: await deleteBooking(id) });
}
