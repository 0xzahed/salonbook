import { NextResponse } from "next/server";
import { addStaff, deleteStaff, listStaff } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ staff: await listStaff() });
}

export async function POST(req: Request) {
  let b: { name?: string; role?: string };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Send { name, role? }." }, { status: 400 });
  }
  try {
    const s = await addStaff(String(b.name ?? ""), String(b.role ?? ""));
    return NextResponse.json(s, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed." }, { status: 422 });
  }
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  return NextResponse.json({ deleted: await deleteStaff(id) });
}
