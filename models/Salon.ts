import mongoose, { Schema } from "mongoose";

const ServiceSchema = new Schema(
  {
    name: { type: String, required: true },
    durationMin: { type: Number, required: true },
    price: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const Service = mongoose.models.Service ?? mongoose.model("Service", ServiceSchema);

const StaffSchema = new Schema(
  {
    name: { type: String, required: true },
    role: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const Staff = mongoose.models.Staff ?? mongoose.model("Staff", StaffSchema);

const BookingSchema = new Schema(
  {
    customerName: { type: String, required: true },
    phone: { type: String, default: "" },
    serviceId: { type: String, default: "" },
    serviceName: { type: String, default: "" },
    durationMin: { type: Number, default: 30 },
    price: { type: Number, default: 0 },
    staffId: { type: String, default: "" },
    staffName: { type: String, default: "" },
    date: { type: String, required: true }, // YYYY-MM-DD
    time: { type: String, required: true }, // HH:MM
    status: { type: String, default: "booked" }, // booked|done|cancelled
    note: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

BookingSchema.index({ staffId: 1, date: 1 });

export const Booking = mongoose.models.Booking ?? mongoose.model("Booking", BookingSchema);
