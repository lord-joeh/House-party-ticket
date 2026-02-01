export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    message: string;
    code?: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface AvailabilityData {
  availableTickets: number;
  totalTickets: number;
  soldOut: boolean;
  ticketPrice: number;
  currency: string;
  eventName: string;
  eventDate: string;
}

export interface PurchaseRequest {
  name: string;
  phone: string;
  email: string;
  numberOfTickets: number;
}

export interface PurchaseData {
  orderId: string;
  authorizationUrl: string;
  totalAmount: number;
  message: string;
}

export type OrderStatus =
  | "PENDING"
  | "PAYMENT_INITIATED"
  | "PAYMENT_SUCCESSFUL"
  | "PAYMENT_FAILED"
  | "PAYMENT_TIMEOUT"
  | "CANCELLED";

export interface OrderStatusData {
  orderStatus: OrderStatus;
  ticketCodes?: string[];
  message: string;
}

export interface VerifyData {
  valid: boolean;
  status: string;
  buyerName?: string;
  buyerPhone?: string;
  orderId?: string;
  message: string;
}


