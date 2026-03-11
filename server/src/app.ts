import express, { Request, Application } from "express";
import cors from "cors";
import { connectDatabase } from "@/config/database";
import { errorHandler } from "@/middleware/errorHandler";
import ticketRoutes from "@/routes/tickets";
import config from "@/config";

const app: Application = express();

app.use(cors());
// Raw-body capture for the Paystack webhook route.
// Paystack signs the raw JSON string — we must preserve it before express.json() parses it.
app.use("/api/tickets/webhook", (req, _res, next) => {
  let body = "";
  req.on("data", (chunk: Buffer) => {
    body += chunk.toString();
  });
  req.on("end", () => {
    (req as Request & { rawBody: string }).rawBody = body;
    next();
  });
});

app.use(express.json());

// Request logger (dev only)
if (config.app.nodeEnv === "development") {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

app.use("/api/tickets", ticketRoutes);

// 404 for unmatched routes
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { message: "Route not found.", code: "NOT_FOUND" },
  });
});

// Global error handler
app.use(errorHandler);

async function start(): Promise<void> {
  await connectDatabase();

  app.listen(config.app.port, () => {
    console.log(` Server running on http://localhost:${config.app.port}`);
    console.log(`   Event : ${config.event.eventName}`);
    console.log(`   Date  : ${config.event.eventDate.toDateString()}`);
    console.log(`   Price : GHS ${config.event.ticketPriceGhs} per ticket`);
    console.log(`   Total : ${config.event.totalTickets} tickets`);
  });
}

start().catch((err) => {
  console.error(" Failed to start server:", err);
  process.exit(1);
});

export default app;
