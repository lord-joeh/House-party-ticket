import { Paystack } from "paystack-sdk";
import crypto from "node:crypto";
import config from "@/config";

const paystack = new Paystack(config.paystack.secretKey);

export interface InitializeResult {
  authorizationUrl: string; // redirect the user here to pay
  accessCode: string; // one-time code for the session
  reference: string; // the ref we passed in
}

export interface VerifyResult {
  status: "success" | "failed" | "abandoned" | "declined" | "pending";
  reference: string;
  amount: number; // in kobo (×100)
  currency: string;
  paymentMethod?: string;
  cardType?: string;
  bank?: string;
  paymentId?: number; // Paystack's internal payment object ID
}

//Initialize Payment
export async function initializePayment({
  amount,
  email,
  reference,
  callbackUrl,
}: {
  amount: number; // already in kobo
  email: string;
  reference: string;
  callbackUrl: string;
}): Promise<InitializeResult> {
  const response = await paystack.transaction.initialize({
    amount: String(amount),
    email,
    reference,
    callback_url: callbackUrl,
    currency: "GHS",
    metadata: {
      order_reference: reference,
    },
  });

  const data = (response as unknown as { data: InitializeResult }).data;

  return {
    authorizationUrl:
      data.authorizationUrl ||
      (data as unknown as Record<string, string>).authorization_url,
    accessCode:
      data.accessCode ||
      (data as unknown as Record<string, string>).access_code,
    reference: data.reference,
  };
}

//  Verify Payment
// Calls Paystack's verify endpoint with our reference.
// Safe to call multiple times — idempotent on Paystack's side.

export async function verifyPayment(reference: string): Promise<VerifyResult> {
  const response = await paystack.transaction.verify(reference);

  // The SDK returns { status, data: { ... } }
  const raw = (response as unknown as { data: Record<string, unknown> }).data;

  return {
    status: raw.status as VerifyResult["status"],
    reference: raw.reference as string,
    amount: raw.amount as number,
    currency: raw.currency as string,
    paymentMethod: raw.payment_method as string | undefined,
    cardType: (raw.card as Record<string, string> | undefined)?.type,
    bank: (raw.card as Record<string, string> | undefined)?.bank,
    paymentId: raw.id as number | undefined,
  };
}

//  Webhook Signature Verification
// Paystack signs every webhook POST with HMAC-SHA512 using your secret key.
// We MUST verify this before trusting any webhook payload.

export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string,
): boolean {
  const expectedSignature = crypto
    .createHmac("sha512", config.paystack.secretKey)
    .update(rawBody)
    .digest("hex");

  return expectedSignature === signatureHeader;
}
