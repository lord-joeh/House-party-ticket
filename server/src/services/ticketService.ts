import config from "@/config";
import TicketModel, { TicketStatus } from "@/models/Ticket";
import OrderModel, { OrderStatus } from "@/models/Order";
import { generateTicketCode, generateUUID } from "@/utils/response";
import { initializePayment, verifyPayment } from "@/services/paystackService";

//  Check Availability
export async function getAvailableTicketCount(): Promise<number> {
  const takenCount = await TicketModel.countDocuments({
    status: {
      $in: [TicketStatus.RESERVED, TicketStatus.SOLD, TicketStatus.USED],
    },
  });
  return config.event.totalTickets - takenCount;
}

export async function checkAvailability(requested: number): Promise<{
  available: boolean;
  availableCount: number;
}> {
  const availableCount = await getAvailableTicketCount();
  return {
    available: availableCount >= requested,
    availableCount,
  };
}

//  Issue Tickets (shared helper)
// Creates Ticket documents and returns the codes.
// Called both from pollPaymentStatus and handleWebhookEvent so that
// whichever fires first issues the tickets; the second is a no-op (idempotency).

async function issueTicketsForOrder(order: {
  orderId: string;
  buyerName: string;
  buyerPhone: string;
  numberOfTickets: number;
}): Promise<string[]> {
  const ticketCodes: string[] = [];

  for (let i = 0; i < order.numberOfTickets; i++) {
    const code = generateTicketCode();
    ticketCodes.push(code);

    await TicketModel.create({
      ticketCode: code,
      buyerName: order.buyerName,
      buyerPhone: order.buyerPhone,
      status: TicketStatus.SOLD,
      orderId: order.orderId,
    });
  }

  return ticketCodes;
}

// Purchase Flow
// 1. Validate availability
// 2. Create Order (PENDING)
// 3. Call Paystack initialize → get authorizationUrl
// 4. Update Order to PAYMENT_INITIATED + store reference
// 5. Return authorizationUrl so the front-end can redirect the user

export async function initiateTicketPurchase({
  name,
  phone,
  email,
  numberOfTickets,
}: {
  name: string;
  phone: string;
  email: string; // Paystack requires an email on every transaction
  numberOfTickets: number;
}): Promise<{
  orderId: string;
  authorizationUrl: string;
  totalAmount: number;
  message: string;
}> {
  // 1. availability
  const { available, availableCount } =
    await checkAvailability(numberOfTickets);
  if (!available) {
    throw new Error(
      `Only ${availableCount} ticket(s) remaining. You requested ${numberOfTickets}.`,
    );
  }

  const orderId = generateUUID();
  const totalAmountGhs = numberOfTickets * config.event.ticketPriceGhs;
  const amountInKobo = Math.round(totalAmountGhs * 100); // Paystack uses smallest currency unit

  // 2. create order
  await OrderModel.create({
    orderId,
    buyerName: name,
    buyerPhone: phone,
    numberOfTickets,
    totalAmount: totalAmountGhs,
    status: OrderStatus.PENDING,
  });

  // 3. initialize Paystack session
  let authorizationUrl: string;
  try {
    const result = await initializePayment({
      amount: amountInKobo,
      email,
      reference: orderId, // orderId doubles as the Paystack reference
      callbackUrl: `${config.app.publicUrl}/api/tickets/paystack-callback`,
    });
    authorizationUrl = result.authorizationUrl;
  } catch (err) {
    await OrderModel.updateOne(
      { orderId },
      { status: OrderStatus.PAYMENT_FAILED },
    );
    throw err;
  }

  // 4. update order
  await OrderModel.updateOne(
    { orderId },
    { status: OrderStatus.PAYMENT_INITIATED, paystackReference: orderId },
  );

  return {
    orderId,
    authorizationUrl,
    totalAmount: totalAmountGhs,
    message:
      "Payment session created. Redirect the user to the authorizationUrl to complete payment.",
  };
}

// ─── Poll / Verify Payment ───────────────────────────────────────────────────
// The front-end calls this after the user returns from Paystack's payment page,
// or any time afterwards.  We call Paystack's /verify endpoint and finalise.

export async function pollPaymentStatus(orderId: string): Promise<{
  orderStatus: string;
  ticketCodes?: string[];
  message: string;
}> {
  const order = await OrderModel.findOne({ orderId });
  if (!order) throw new Error("Order not found.");

  // Already in a terminal state — return cached result
  if (
    order.status === OrderStatus.PAYMENT_SUCCESSFUL ||
    order.status === OrderStatus.PAYMENT_FAILED ||
    order.status === OrderStatus.PAYMENT_TIMEOUT ||
    order.status === OrderStatus.CANCELLED
  ) {
    return {
      orderStatus: order.status,
      ticketCodes: order.ticketCodes.length ? order.ticketCodes : undefined,
      message: `Order is ${order.status}.`,
    };
  }

  // Must be PAYMENT_INITIATED — verify with Paystack
  if (!order.paystackReference) {
    throw new Error("Paystack reference missing on order.");
  }

  const result = await verifyPayment(order.paystackReference);

  switch (result.status) {
    case "success": {
      const ticketCodes = await issueTicketsForOrder({
        orderId: order.orderId,
        buyerName: order.buyerName,
        buyerPhone: order.buyerPhone,
        numberOfTickets: order.numberOfTickets,
      });

      await OrderModel.updateOne(
        { orderId },
        {
          status: OrderStatus.PAYMENT_SUCCESSFUL,
          ticketCodes,
          paystackPaymentId: String(result.paymentId),
          paystackWebhookPayload: result,
        },
      );

      return {
        orderStatus: OrderStatus.PAYMENT_SUCCESSFUL,
        ticketCodes,
        message: "Payment successful! Your tickets have been issued.",
      };
    }

    case "failed":
    case "declined": {
      await OrderModel.updateOne(
        { orderId },
        {
          status: OrderStatus.PAYMENT_FAILED,
          paystackWebhookPayload: result,
        },
      );
      return {
        orderStatus: OrderStatus.PAYMENT_FAILED,
        message: `Payment ${result.status}. Please try again.`,
      };
    }

    case "abandoned": {
      await OrderModel.updateOne(
        { orderId },
        {
          status: OrderStatus.CANCELLED,
          paystackWebhookPayload: result,
        },
      );
      return {
        orderStatus: OrderStatus.CANCELLED,
        message: "Payment was abandoned. Please try again.",
      };
    }

    default:
      // "pending" or unknown — not yet resolved
      return {
        orderStatus: "PENDING",
        message: "Payment is still pending. Please wait and try again.",
      };
  }
}

// Handle Paystack Webhook Event
export async function handleWebhookEvent(
  payload: Record<string, unknown>,
): Promise<void> {
  const event = payload?.event as string;

  if (event !== "charge.success") return;

  const data = payload.data as Record<string, unknown>;
  const reference = data.reference as string;
  const status = data.status as string;

  if (status !== "success") return;

  const order = await OrderModel.findOne({ orderId: reference });
  if (!order) {
    console.warn(
      `[Webhook] charge.success for unknown reference: ${reference}`,
    );
    return;
  }

  // Idempotency guard — already issued
  if (order.status === OrderStatus.PAYMENT_SUCCESSFUL) return;

  const ticketCodes = await issueTicketsForOrder({
    orderId: order.orderId,
    buyerName: order.buyerName,
    buyerPhone: order.buyerPhone,
    numberOfTickets: order.numberOfTickets,
  });

  await OrderModel.updateOne(
    { orderId: reference },
    {
      status: OrderStatus.PAYMENT_SUCCESSFUL,
      ticketCodes,
      paystackPaymentId: String(data.id),
      paystackWebhookPayload: payload,
    },
  );

  console.log(
    `[Webhook] Tickets issued for order ${reference}: ${ticketCodes.join(", ")}`,
  );
}

//  Verify Ticket
export async function verifyTicket(ticketCode: string): Promise<{
  valid: boolean;
  status: string;
  buyerName?: string;
  buyerPhone?: string;
  orderId?: string;
  message: string;
}> {
  const ticket = await TicketModel.findOne({ ticketCode });

  if (!ticket) {
    return {
      valid: false,
      status: "NOT_FOUND",
      message: "Ticket code not found.",
    };
  }

  switch (ticket.status) {
    case TicketStatus.SOLD:
      await TicketModel.updateOne(
        { ticketCode },
        { status: TicketStatus.USED, usedAt: new Date() },
      );
      return {
        valid: true,
        status: TicketStatus.USED,
        buyerName: ticket.buyerName,
        buyerPhone: ticket.buyerPhone,
        orderId: ticket.orderId,
        message: "Ticket is valid. Entry granted.",
      };

    case TicketStatus.USED:
      return {
        valid: false,
        status: TicketStatus.USED,
        buyerName: ticket.buyerName,
        message: "Ticket has already been used.",
      };

    case TicketStatus.RESERVED:
      return {
        valid: false,
        status: TicketStatus.RESERVED,
        message: " Ticket is reserved but payment is not yet confirmed.",
      };

    case TicketStatus.CANCELLED:
      return {
        valid: false,
        status: TicketStatus.CANCELLED,
        message: " Ticket has been cancelled.",
      };

    default:
      return {
        valid: false,
        status: ticket.status,
        message: "Ticket is not in a usable state.",
      };
  }
}
