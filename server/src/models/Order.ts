import mongoose, { Schema, Document } from "mongoose";

// Enums

export enum OrderStatus {
  PENDING = "PENDING", // created, awaiting payment initiation
  PAYMENT_INITIATED = "PAYMENT_INITIATED", // Paystack session created, user redirected to pay
  PAYMENT_SUCCESSFUL = "PAYMENT_SUCCESSFUL",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  PAYMENT_TIMEOUT = "PAYMENT_TIMEOUT",
  CANCELLED = "CANCELLED",
}

// Interface

export interface IOrder extends Document {
  orderId: string; // UUID generated server-side
  buyerName: string;
  buyerPhone: string; // must include country code e.g. +23350123456
  numberOfTickets: number;
  totalAmount: number; // in GHS
  status: OrderStatus;

  // Paystack fields
  paystackReference?: string; // unique ref we generate, used to init & verify
  paystackPaymentId?: string; // Paystack's own payment object id (from webhook)
  paystackWebhookPayload?: Record<string, unknown>; // raw webhook event body

  // ticket codes issued after successful payment
  ticketCodes: string[];

  createdAt: Date;
  updatedAt: Date;
}

// Schema

const OrderSchema = new Schema<IOrder>(
  {
    orderId: {
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
    numberOfTickets: {
      type: Number,
      required: true,
      min: 1,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
      index: true,
    },
    paystackReference: { type: String, index: true },
    paystackPaymentId: { type: String },
    paystackWebhookPayload: { type: Schema.Types.Mixed },
    ticketCodes: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

export default mongoose.model<IOrder>("Order", OrderSchema);
