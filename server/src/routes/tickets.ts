import { Router, Request, Response } from "express";
import {
  validatePurchaseRequest,
  validateTicketCodeParam,
  validateOrderIdParam,
} from "@/middleware/validation";
import {
  checkAvailability,
  initiateTicketPurchase,
  pollPaymentStatus,
  handleWebhookEvent,
  verifyTicket,
} from "@/services/ticketService";
import { verifyWebhookSignature } from "@/services/paystackService";
import { sendSuccess, sendError } from "@/utils/response";
import config from "@/config";

const router: Router = Router();

//  GET /api/tickets/availability
router.get("/availability", async (_req: Request, res: Response) => {
  try {
    const { availableCount } = await checkAvailability(0);

    sendSuccess(res, {
      availableTickets: availableCount,
      totalTickets: config.event.totalTickets,
      soldOut: availableCount === 0,
      ticketPrice: config.event.ticketPriceGhs,
      currency: "GHS",
      eventName: config.event.eventName,
      eventDate: config.event.eventDate.toISOString(),
    });
  } catch (err) {
    sendError(res, 500, (err as Error).message, "INTERNAL_ERROR");
  }
});

// ─── POST /api/tickets/purchase
// Body: { name, phone, email, numberOfTickets }
// Returns authorizationUrl — the front-end redirects the user there to pay.

router.post(
  "/purchase",
  validatePurchaseRequest,
  async (req: Request, res: Response) => {
    try {
      const { name, phone, email, numberOfTickets } = req.body;

      const result = await initiateTicketPurchase({
        name,
        phone,
        email,
        numberOfTickets,
      });

      sendSuccess(res, result, 201, result.message);
    } catch (err) {
      const message = (err as Error).message;

      if (message.includes("remaining")) {
        sendError(res, 409, message, "TICKETS_UNAVAILABLE");
        return;
      }

      sendError(res, 500, message, "PAYMENT_ERROR");
    }
  },
);

//  GET /api/tickets/status/:orderId
// Verifies payment with Paystack and issues tickets if successful.
// Call this after the user returns from the Paystack payment page.

router.get(
  "/status/:orderId",
  validateOrderIdParam,
  async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      const result = await pollPaymentStatus(
        Array.isArray(orderId) ? orderId[0] : orderId,
      );

      sendSuccess(res, result);
    } catch (err) {
      const message = (err as Error).message;

      if (message === "Order not found.") {
        sendError(res, 404, message, "ORDER_NOT_FOUND");
        return;
      }

      sendError(res, 500, message, "STATUS_ERROR");
    }
  },
);

//  GET /api/tickets/paystack-callback
// Paystack redirects the user here after payment (success or failure).
// We verify the transaction and then redirect to a front-end confirmation page.
// This is NOT where we trust the payment — that happens in /status or /webhook.

router.get("/paystack-callback", async (req: Request, res: Response) => {
  const { reference } = req.query as { reference?: string };

  if (!reference) {
    sendError(res, 400, "Missing reference parameter.", "MISSING_REFERENCE");
    return;
  }

  // Verify the payment and issue tickets if successful
  try {
    const result = await pollPaymentStatus(reference);

    // Redirect to a front-end page that shows the result
    // Replace this URL with your actual front-end confirmation route
    const redirectBase = config.app.publicUrl;
    const redirectUrl =
      result.orderStatus === "PAYMENT_SUCCESSFUL"
        ? `${redirectBase}/confirmation?orderId=${reference}&status=success`
        : `${redirectBase}/confirmation?orderId=${reference}&status=${result.orderStatus.toLowerCase()}`;

    res.redirect(302, redirectUrl);
  } catch (err) {
    console.log(err);
    // On any error, redirect to a failure page
    const redirectBase = config.app.publicUrl;
    res.redirect(
      302,
      `${redirectBase}/confirmation?orderId=${reference}&status=error`,
    );
  }
});

// ─── POST /api/tickets/webhook ──
// Paystack POSTs payment events here asynchronously.
// We MUST verify the HMAC signature before processing.
// NOTE: This route uses the raw body captured by the rawBodyMiddleware
//       registered in app.ts — do NOT let express.json() parse it first.

router.post("/webhook", async (req: Request, res: Response) => {
  const signature = req.headers["x-paystack-signature"] as string;
  const rawBody = (req as Request & { rawBody?: string }).rawBody;

  if (!signature || !rawBody) {
    sendError(res, 400, "Missing signature or body.", "INVALID_WEBHOOK");
    return;
  }

  // Verify signature
  if (!verifyWebhookSignature(rawBody, signature)) {
    sendError(res, 401, "Invalid webhook signature.", "UNAUTHORIZED");
    return;
  }

  // Acknowledge receipt immediately — Paystack retries if it doesn't get 200 fast
  res.status(200).json({ received: true });

  // Process asynchronously so we don't block the 200
  handleWebhookEvent(JSON.parse(rawBody)).catch((err) => {
    console.error("[Webhook] Error processing event:", err);
  });
});

//  GET /api/tickets/verify/:ticketCode
router.get(
  "/verify/:ticketCode",
  validateTicketCodeParam,
  async (req: Request, res: Response) => {
    try {
      const { ticketCode } = req.params;
      const result = await verifyTicket(
        Array.isArray(ticketCode) ? ticketCode[0] : ticketCode,
      );

      const statusCode = result.valid ? 200 : 400;
      sendSuccess(res, result, statusCode, result.message);
    } catch (err) {
      sendError(res, 500, (err as Error).message, "INTERNAL_ERROR");
    }
  },
);

export default router;
