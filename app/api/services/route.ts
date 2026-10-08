import { NextResponse } from "next/server";
import { addService, deleteService, listServices } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ services: await listServices() });
}

export async function POST(req: Request) {
  let b: { name?: string; durationMin?: number; price?: number };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Send { name, durationMin, price }." }, { status: 400 });
  }
  try {
    const s = await addService(String(b.name ?? ""), Number(b.durationMin), Number(b.price));
    return NextResponse.json(s, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed." }, { status: 422 });
  }
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  return NextResponse.json({ deleted: await deleteService(id) });
}
