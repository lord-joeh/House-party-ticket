import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(__dirname, "../../.env.development") });

const config = {
  app: {
    port: Number.parseInt(process.env.PORT || "3000", 10),
    nodeEnv: process.env.NODE_ENV || "development",
    publicUrl: process.env.APP_PUBLIC_URL || "http://localhost:3000",
  },
  mongo: {
    uri:
      process.env.MONGO_URI || "mongodb://localhost:27017/house_party_tickets",
  },
  paystack: {
    secretKey: process.env.PAYSTACK_SECRET_KEY || "",
    publicKey: process.env.PAYSTACK_PUBLIC_KEY || "",
  },
  event: {
    totalTickets: Number.parseInt(process.env.TOTAL_TICKETS || "200", 10),
    ticketPriceGhs: Number.parseFloat(process.env.TICKET_PRICE_GHS || "150"),
    eventName: process.env.EVENT_NAME || "House Party 2025",
    eventDate: new Date(process.env.EVENT_DATE || "2025-03-15T18:00:00.000Z"),
  },
};

export default config;
