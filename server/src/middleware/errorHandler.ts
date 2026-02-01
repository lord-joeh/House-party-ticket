import { Request, Response, NextFunction } from "express";
import { sendError } from "@/utils/response";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("Unhandled error:", err);

  // If headers already sent, delegate to default handler
  if (res.headersSent) {
    _next(err);
    return;
  }

  const statusCode = 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "An internal server error occurred."
      : err.message || "Unknown error";

  sendError(res, statusCode, message, "INTERNAL_ERROR");
}
