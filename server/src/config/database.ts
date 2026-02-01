import mongoose from "mongoose";
import config from "@/config";

let isConnected = false;

export const connectDatabase = async (): Promise<void> => {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(config.mongo.uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });

    isConnected = true;
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(" MongoDB connection failed:", error);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  if (!isConnected) return;

  await mongoose.disconnect();
  isConnected = false;
  console.log(" MongoDB disconnected");
};
