import mongoose from "mongoose";

const uri = process.env.MONGODB_URI ?? "";

declare global {
  // eslint-disable-next-line no-var
  var __sbMongoose: Promise<typeof mongoose> | undefined;
}

/** Connect once per server instance. Null when no URI is configured. */
export async function db(): Promise<typeof mongoose | null> {
  if (!uri) return null;
  if (!global.__sbMongoose) {
    global.__sbMongoose = mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  }
  try {
    return await global.__sbMongoose;
  } catch {
    global.__sbMongoose = undefined;
    return null;
  }
}
