import type {
  ApiResponse,
  AvailabilityData,
  PurchaseRequest,
  PurchaseData,
  OrderStatusData,
  VerifyData,
} from "../types/api";

const BASE = "/api/tickets";


async function api<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const json: ApiResponse<T> = await res.json();

  if (!json.success) {
    throw new Error(json.error.message);
  }

  return json.data;
}


export const fetchAvailability = () =>
  api<AvailabilityData>("GET", "/availability");

export const purchaseTickets = (payload: PurchaseRequest) =>
  api<PurchaseData>("POST", "/purchase", payload);

export const fetchOrderStatus = (orderId: string) =>
  api<OrderStatusData>("GET", `/status/${orderId}`);

export const verifyTicket = (ticketCode: string) =>
  api<VerifyData>("GET", `/verify/${ticketCode}`);
