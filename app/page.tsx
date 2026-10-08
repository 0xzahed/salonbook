"use client";

import { useCallback, useEffect, useState } from "react";

interface Service {
  id: string;
  name: string;
  durationMin: number;
  price: number;
}

interface Staff {
  id: string;
  name: string;
  role: string;
}

interface Booking {
  id: string;
  customerName: string;
  phone: string;
  serviceName: string;
  durationMin: number;
  price: number;
  staffName: string;
  date: string;
  time: string;
  status: string;
}

const input =
  "h-11 rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm outline-none placeholder:text-slate-600 focus:border-pink-500";
const btn =
  "h-11 cursor-pointer rounded-xl bg-pink-500 px-5 font-semibold text-white transition hover:bg-pink-400 disabled:cursor-not-allowed disabled:opacity-40";
const ghost =
  "h-9 cursor-pointer rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition hover:border-pink-500 hover:text-white";

const statusPill: Record<string, string> = {
  booked: "bg-sky-500/15 text-sky-300 border-sky-500/40",
  done: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  cancelled: "bg-slate-500/15 text-slate-400 border-slate-600/40",
};

export default function Home() {
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [today, setToday] = useState<Booking[]>([]);
  const [revenue, setRevenue] = useState(0);
  const [error, setError] = useState("");
  const [bForm, setBForm] = useState({ customerName: "", phone: "", serviceId: "", staffId: "", date: new Date().toISOString().slice(0, 10), time: "10:00" });
  const [sForm, setSForm] = useState({ name: "", durationMin: "", price: "" });
  const [tForm, setTForm] = useState({ name: "", role: "" });

  const load = useCallback(async () => {
    try {
      const [s, t, d] = await Promise.all([
        fetch("/api/services").then((x) => x.json()),
        fetch("/api/staff").then((x) => x.json()),
        fetch("/api/today").then((x) => x.json()),
      ]);
      setServices(s.services ?? []);
      setStaff(t.staff ?? []);
      setToday(d.bookings ?? []);
      setRevenue(d.monthRevenue ?? 0);
    } catch {
      /* offline */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const fail = (e: unknown) => setError(e instanceof Error ? e.message : "Failed.");

  const post = async (url: string, body: unknown, method = "POST") => {
    const r = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error ?? "Failed.");
    return j;
  };

  const book = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await post("/api/bookings", bForm);
      setBForm({ customerName: "", phone: "", serviceId: "", staffId: "", date: new Date().toISOString().slice(0, 10), time: "10:00" });
      load();
    } catch (e) {
      fail(e);
    }
  };

  const setStatus = async (id: string, status: string) => {
    setError("");
    try {
      await post("/api/bookings/status", { id, status }, "PATCH");
      load();
    } catch (e) {
      fail(e);
    }
  };

  const addService = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await post("/api/services", { name: sForm.name, durationMin: Number(sForm.durationMin), price: Number(sForm.price) });
      setSForm({ name: "", durationMin: "", price: "" });
      load();
    } catch (e) {
      fail(e);
    }
  };

  const addStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await post("/api/staff", tForm);
      setTForm({ name: "", role: "" });
      load();
    } catch (e) {
      fail(e);
    }
  };

  const seed = async () => {
    await fetch("/api/seed", { method: "POST" });
    load();
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-pink-400">SalonBook</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">No more khata bookings.</h1>
          <p className="mt-2 text-slate-400">Services · staff · slots · revenue — one dashboard.</p>
        </div>
        <button onClick={seed} className={ghost}>Load demo data</button>
      </header>

      {error && (
        <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { l: "Today's bookings", v: today.length },
          { l: "Done today", v: today.filter((b) => b.status === "done").length },
          { l: "Revenue this month (৳)", v: revenue },
        ].map((c) => (
          <div key={c.l} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-sm text-slate-400">{c.l}</p>
            <p className="mt-1 text-3xl font-black tabular-nums">{c.v}</p>
          </div>
        ))}
      </div>

      <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-slate-500">New booking</h2>
        <form onSubmit={book} className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <input value={bForm.customerName} onChange={(e) => setBForm({ ...bForm, customerName: e.target.value })} placeholder="Customer *" className={input} />
          <input value={bForm.phone} onChange={(e) => setBForm({ ...bForm, phone: e.target.value })} placeholder="Phone" className={input} />
          <select value={bForm.serviceId} onChange={(e) => setBForm({ ...bForm, serviceId: e.target.value })} className={`${input} cursor-pointer`}>
            <option value="">Service…</option>
            {services.map((s) => <option key={s.id} value={s.id}>{s.name} — ৳{s.price}</option>)}
          </select>
          <select value={bForm.staffId} onChange={(e) => setBForm({ ...bForm, staffId: e.target.value })} className={`${input} cursor-pointer`}>
            <option value="">Staff…</option>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input value={bForm.date} onChange={(e) => setBForm({ ...bForm, date: e.target.value })} type="date" className={`${input} text-slate-300`} />
          <input value={bForm.time} onChange={(e) => setBForm({ ...bForm, time: e.target.value })} type="time" className={`${input} text-slate-300`} />
          <button type="submit" className={`${btn} col-span-2 sm:col-span-3`}>Book slot</button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-slate-500">Today&apos;s schedule</h2>
        <ul className="mt-3 space-y-2">
          {today.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
              <span className="font-mono font-black text-pink-300">{b.time}</span>
              <div className="min-w-0">
                <p className="truncate font-bold">{b.customerName} <span className="font-normal text-slate-500">· {b.serviceName}</span></p>
                <p className="font-mono text-xs text-slate-500">{b.staffName} · {b.durationMin} min · ৳{b.price}</p>
              </div>
              <span className={`rounded-full border px-2.5 py-0.5 font-mono text-xs ${statusPill[b.status]}`}>{b.status}</span>
              <span className="ml-auto flex gap-2">
                {b.status === "booked" && (
                  <>
                    <button onClick={() => setStatus(b.id, "done")} className="cursor-pointer rounded-lg border border-slate-700 px-3 py-1.5 text-xs hover:border-emerald-500">✓ Done</button>
                    <button onClick={() => setStatus(b.id, "cancelled")} className="cursor-pointer rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-500 hover:border-red-500 hover:text-red-300">Cancel</button>
                  </>
                )}
              </span>
            </li>
          ))}
          {today.length === 0 && <li className="text-sm text-slate-600">No bookings today — add one above.</li>}
        </ul>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-slate-500">Services</h2>
          <form onSubmit={addService} className="mt-3 flex gap-2">
            <input value={sForm.name} onChange={(e) => setSForm({ ...sForm, name: e.target.value })} placeholder="Haircut" className={`${input} flex-1`} />
            <input value={sForm.durationMin} onChange={(e) => setSForm({ ...sForm, durationMin: e.target.value })} placeholder="Min" inputMode="numeric" className={`${input} w-20`} />
            <input value={sForm.price} onChange={(e) => setSForm({ ...sForm, price: e.target.value })} placeholder="৳" inputMode="numeric" className={`${input} w-24`} />
            <button type="submit" className={btn}>Add</button>
          </form>
          <ul className="mt-3 space-y-1.5">
            {services.map((s) => (
              <li key={s.id} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm">
                <b>{s.name}</b><span className="font-mono text-xs text-slate-500">{s.durationMin} min</span>
                <span className="ml-auto font-mono font-bold">৳{s.price}</span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-slate-500">Staff</h2>
          <form onSubmit={addStaff} className="mt-3 flex gap-2">
            <input value={tForm.name} onChange={(e) => setTForm({ ...tForm, name: e.target.value })} placeholder="Name" className={`${input} flex-1`} />
            <input value={tForm.role} onChange={(e) => setTForm({ ...tForm, role: e.target.value })} placeholder="Role" className={`${input} flex-1`} />
            <button type="submit" className={btn}>Add</button>
          </form>
          <ul className="mt-3 space-y-1.5">
            {staff.map((s) => (
              <li key={s.id} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm">
                <b>{s.name}</b><span className="font-mono text-xs text-slate-500">{s.role}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
