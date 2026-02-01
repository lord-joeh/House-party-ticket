import mongoose, { Schema, Document } from "mongoose";

//  Enums
export enum TicketStatus {
  AVAILABLE = "AVAILABLE",
  RESERVED = "RESERVED", // payment initiated, not yet confirmed
  SOLD = "SOLD", // payment confirmed, ticket issued
  USED = "USED", // scanned at door
  CANCELLED = "CANCELLED", // payment failed / expired
}

//  Interface
export interface ITicket extends Document {
  ticketCode: string; // unique human-readable code, e.g. "HP-2025-00042"
  buyerName: string;
  buyerPhone: string;
  status: TicketStatus;
  orderId: string; // links back to the Order document
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

//  Schema
const TicketSchema = new Schema<ITicket>(
  {
    ticketCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    buyerName: {
      type: String,
      required: true,
      trim: true,
    },
    buyerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(TicketStatus),
      default: TicketStatus.AVAILABLE,
      index: true,
    },
    orderId: {
      type: String,
      required: true,
      index: true,
    },
    usedAt: {
      type: Date,
      default: undefined,
    },
  },
  { timestamps: true },
);

export default mongoose.model<ITicket>("Ticket", TicketSchema);
