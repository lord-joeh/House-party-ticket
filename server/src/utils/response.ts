import { v4 as uuidv4 } from "uuid";
import { Response } from "express";
import crypto from "node:crypto";

export function generateTicketCode(): string {
  const year = new Date().getFullYear();
  const seq = String(crypto.randomInt(11111, 99999));
  return `HP-${year}-${seq}`;
}

// UUID helper
export function generateUUID(): string {
  return uuidv4();
}

// API Response Envelope
interface SuccessPayload {
  success: true;
  data: unknown;
  message?: string;
}

interface ErrorPayload {
  success: false;
  error: {
    message: string;
    code?: string;
  };
}

export function sendSuccess(
  res: Response,
  data: unknown,
  statusCode = 200,
  message?: string,
): void {
  const body: SuccessPayload = { success: true, data };
  if (message) body.message = message;
  res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  code?: string,
): void {
  const body: ErrorPayload = {
    success: false,
    error: { message, ...(code && { code }) },
  };
  res.status(statusCode).json(body);
}
