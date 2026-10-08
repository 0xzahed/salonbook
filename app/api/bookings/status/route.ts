import { NextResponse } from "next/server";
import { setBookingStatus } from "@/lib/store";

export async function PATCH(req: Request) {
  let b: { id?: string; status?: string };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Send { id, status }." }, { status: 400 });
  }
  try {
    const doc = await setBookingStatus(String(b.id ?? ""), String(b.status ?? ""));
    if (!doc) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    return NextResponse.json(doc);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed." }, { status: 422 });
  }
}
