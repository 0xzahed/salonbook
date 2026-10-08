import fs from "node:fs";
import path from "node:path";
import { db } from "@/lib/db";
import { Booking, Service, Staff } from "@/models/Salon";

export interface ServiceDoc {
  id: string;
  name: string;
  durationMin: number;
  price: number;
}

export interface StaffDoc {
  id: string;
  name: string;
  role: string;
}

export type BookingStatus = "booked" | "done" | "cancelled";

export interface BookingDoc {
  id: string;
  customerName: string;
  phone: string;
  serviceId: string;
  serviceName: string;
  durationMin: number;
  price: number;
  staffId: string;
  staffName: string;
  date: string;
  time: string;
  status: BookingStatus;
  note: string;
}

type Raw = Record<string, unknown> & { _id?: unknown };

// ---------- Shared file store (pages + routes may run isolated) ----------
const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "salon.json");

interface FileDB {
  services: ServiceDoc[];
  staff: StaffDoc[];
  bookings: BookingDoc[];
}

function readFile(): FileDB {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) as FileDB;
  } catch {
    return { services: [], staff: [], bookings: [] };
  }
}

function writeFile(d: FileDB): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(d));
}

const rid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const validDate = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(new Date(d + "T00:00:00Z").getTime());
const validTime = (t: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t);

// ---------- Services ----------
export async function listServices(): Promise<ServiceDoc[]> {
  if (await db()) {
    const rows = (await Service.find({}).sort({ name: 1 }).lean().catch(() => [])) as unknown as Raw[];
    return rows.map((r) => ({ id: String(r._id ?? ""), name: String(r.name ?? ""), durationMin: Number(r.durationMin ?? 0), price: Number(r.price ?? 0) }));
  }
  return readFile().services;
}

export async function addService(name: string, durationMin: number, price: number): Promise<ServiceDoc> {
  if (!name.trim()) throw new Error("Service name is required.");
  if (!Number.isFinite(durationMin) || durationMin <= 0) throw new Error("Duration must be positive minutes.");
  if (!Number.isFinite(price) || price < 0) throw new Error("Price must be 0 or more.");
  if (await db()) {
    const c = await Service.create({ name: name.trim(), durationMin, price });
    const r = c.toObject() as unknown as Raw;
    return { id: String(r._id ?? ""), name: String(r.name), durationMin: Number(r.durationMin), price: Number(r.price) };
  }
  const d = readFile();
  const s: ServiceDoc = { id: rid(), name: name.trim(), durationMin, price };
  d.services.push(s);
  writeFile(d);
  return s;
}

export async function deleteService(id: string): Promise<boolean> {
  if (await db()) {
    const r = await Service.findByIdAndDelete(id).catch(() => null);
    return !!r;
  }
  const d = readFile();
  const n = d.services.length;
  d.services = d.services.filter((s) => s.id !== id);
  if (d.services.length !== n) writeFile(d);
  return d.services.length !== n;
}

// ---------- Staff ----------
export async function listStaff(): Promise<StaffDoc[]> {
  if (await db()) {
    const rows = (await Staff.find({}).sort({ name: 1 }).lean().catch(() => [])) as unknown as Raw[];
    return rows.map((r) => ({ id: String(r._id ?? ""), name: String(r.name ?? ""), role: String(r.role ?? "") }));
  }
  return readFile().staff;
}

export async function addStaff(name: string, role: string): Promise<StaffDoc> {
  if (!name.trim()) throw new Error("Staff name is required.");
  if (await db()) {
    const c = await Staff.create({ name: name.trim(), role: role.trim() });
    const r = c.toObject() as unknown as Raw;
    return { id: String(r._id ?? ""), name: String(r.name), role: String(r.role ?? "") };
  }
  const d = readFile();
  const s: StaffDoc = { id: rid(), name: name.trim(), role: role.trim() };
  d.staff.push(s);
  writeFile(d);
  return s;
}

export async function deleteStaff(id: string): Promise<boolean> {
  if (await db()) {
    const r = await Staff.findByIdAndDelete(id).catch(() => null);
    return !!r;
  }
  const d = readFile();
  const n = d.staff.length;
  d.staff = d.staff.filter((s) => s.id !== id);
  if (d.staff.length !== n) writeFile(d);
  return d.staff.length !== n;
}

async function lookup(serviceId: string, staffId: string) {
  const services = await listServices();
  const staff = await listStaff();
  const service = services.find((s) => s.id === serviceId);
  const member = staff.find((s) => s.id === staffId);
  if (!service) throw new Error("Service not found.");
  if (!member) throw new Error("Staff not found.");
  return { service, member };
}

// ---------- Bookings ----------
const toBooking = (r: Raw): BookingDoc => ({
  id: String(r._id ?? r.id ?? ""),
  customerName: String(r.customerName ?? ""),
  phone: String(r.phone ?? ""),
  serviceId: String(r.serviceId ?? ""),
  serviceName: String(r.serviceName ?? ""),
  durationMin: Number(r.durationMin ?? 30),
  price: Number(r.price ?? 0),
  staffId: String(r.staffId ?? ""),
  staffName: String(r.staffName ?? ""),
  date: String(r.date ?? ""),
  time: String(r.time ?? ""),
  status: (String(r.status ?? "booked") === "done" || String(r.status) === "cancelled" ? String(r.status) : "booked") as BookingStatus,
  note: String(r.note ?? ""),
});

export async function listBookings(date?: string): Promise<BookingDoc[]> {
  if (await db()) {
    const q = date ? { date, status: { $ne: "cancelled" } } : {};
    const rows = (await Booking.find(q).sort({ date: 1, time: 1 }).lean().catch(() => [])) as unknown as Raw[];
    return rows.map(toBooking);
  }
  const all = readFile().bookings;
  const rows = date ? all.filter((b) => b.date === date && b.status !== "cancelled") : all;
  return rows.sort((a, b) => (a.date + a.time < b.date + b.time ? -1 : 1));
}

/** Double-booking guard: same staff, same date, overlapping time window. */
function clashes(existing: BookingDoc[], staffId: string, date: string, start: number, end: number, ignoreId?: string): BookingDoc | null {
  for (const b of existing) {
    if (b.id === ignoreId || b.staffId !== staffId || b.date !== date || b.status === "cancelled") continue;
    const s = toMin(b.time);
    const e = s + b.durationMin;
    if (start < e && s < end) return b;
  }
  return null;
}

export async function createBooking(input: {
  customerName: string;
  phone: string;
  serviceId: string;
  staffId: string;
  date: string;
  time: string;
  note: string;
}): Promise<BookingDoc> {
  const customerName = input.customerName.trim();
  if (!customerName) throw new Error("Customer name is required.");
  if (!validDate(input.date)) throw new Error("Date must be YYYY-MM-DD.");
  if (!validTime(input.time)) throw new Error("Time must be HH:MM (24h).");
  const { service, member } = await lookup(input.serviceId, input.staffId);
  const start = toMin(input.time);
  const end = start + service.durationMin;

  if (await db()) {
    const existing = (await Booking.find({ staffId: member.id, date: input.date }).lean().catch(() => [])) as unknown as Raw[];
    const clash = clashes(existing.map(toBooking), member.id, input.date, start, end);
    if (clash) throw new Error(`${member.name} is already booked ${clash.time}–${clash.serviceName}.`);
    const c = await Booking.create({
      customerName, phone: input.phone.trim(), serviceId: service.id, serviceName: service.name,
      durationMin: service.durationMin, price: service.price, staffId: member.id, staffName: member.name,
      date: input.date, time: input.time, status: "booked", note: input.note.trim(),
    });
    return toBooking(c.toObject() as unknown as Raw);
  }
  const d = readFile();
  const clash = clashes(d.bookings, member.id, input.date, start, end);
  if (clash) throw new Error(`${member.name} is already booked ${clash.time}–${clash.serviceName}.`);
  const b: BookingDoc = {
    id: rid(), customerName, phone: input.phone.trim(), serviceId: service.id, serviceName: service.name,
    durationMin: service.durationMin, price: service.price, staffId: member.id, staffName: member.name,
    date: input.date, time: input.time, status: "booked", note: input.note.trim(),
  };
  d.bookings.push(b);
  writeFile(d);
  return b;
}

export async function setBookingStatus(id: string, status: string): Promise<BookingDoc | null> {
  if (status !== "done" && status !== "cancelled" && status !== "booked") throw new Error("Invalid status.");
  if (await db()) {
    const r = (await Booking.findByIdAndUpdate(id, { status }, { new: true }).lean().catch(() => null)) as unknown as Raw | null;
    return r ? toBooking(r) : null;
  }
  const d = readFile();
  const b = d.bookings.find((x) => x.id === id);
  if (!b) return null;
  b.status = status;
  writeFile(d);
  return b;
}

export async function deleteBooking(id: string): Promise<boolean> {
  if (await db()) {
    const r = await Booking.findByIdAndDelete(id).catch(() => null);
    return !!r;
  }
  const d = readFile();
  const n = d.bookings.length;
  d.bookings = d.bookings.filter((b) => b.id !== id);
  if (d.bookings.length !== n) writeFile(d);
  return d.bookings.length !== n;
}

export async function monthRevenue(): Promise<number> {
  const month = new Date().toISOString().slice(0, 7);
  const all = await listBookings();
  return all
    .filter((b) => b.status === "done" && b.date.slice(0, 7) === month)
    .reduce((a, b) => a + b.price, 0);
}
