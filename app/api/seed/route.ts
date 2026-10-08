import { NextResponse } from "next/server";
import { addService, addStaff, createBooking, listServices, listStaff } from "@/lib/store";

/** One-click demo data for client demos. */
export async function POST() {
  let services = await listServices();
  if (services.length === 0) {
    await addService("Haircut", 30, 300);
    await addService("Facial", 60, 1200);
    await addService("Hair Color", 90, 2500);
    services = await listServices();
  }
  let staff = await listStaff();
  if (staff.length === 0) {
    await addStaff("Nasrin", "Senior beautician");
    await addStaff("Rina", "Hair specialist");
    staff = await listStaff();
  }
  const today = new Date().toISOString().slice(0, 10);
  let booked = 0;
  const pairs = [
    { s: 0, t: 0, time: "10:00" },
    { s: 1, t: 1, time: "11:30" },
  ];
  for (const p of pairs) {
    try {
      await createBooking({
        customerName: p.s === 0 ? "Shimu Akter" : "Tania Rahman",
        phone: "01XXXXXXXXX",
        serviceId: services[p.s].id,
        staffId: staff[p.t].id,
        date: today,
        time: p.time,
        note: "Demo booking",
      });
      booked++;
    } catch {
      /* re-seed — skip */
    }
  }
  return NextResponse.json({ services: services.length, staff: staff.length, booked });
}
