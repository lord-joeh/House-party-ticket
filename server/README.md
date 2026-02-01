# 🎟️ House Party Ticket API

A **Node.js · Express · TypeScript · Mongoose** backend for selling event tickets with **Paystack** payments (card, bank transfer, mobile money via Paystack's unified gateway).

---

## Architecture at a Glance

```
src/
├── app.ts                      # Express bootstrap, raw-body middleware, server start
├── config/
│   ├── index.ts                # Typed env config
│   └── database.ts             # Mongoose connect / disconnect
├── models/
│   ├── Ticket.ts               # Individual ticket document
│   └── Order.ts                # Purchase order + Paystack payment state
├── middleware/
│   ├── validation.ts           # Request body & param validators
│   └── errorHandler.ts         # Global error catcher
├── services/
│   ├── paystackService.ts      # Paystack SDK: initialize, verify, webhook sig check
│   └── ticketService.ts        # Business logic (buy, verify payment, issue, verify ticket)
├── routes/
│   └── tickets.ts              # Express route definitions
└── utils/
    └── response.ts             # Ticket-code generator + API envelope helpers
```

---

## Quick Start

### 1. Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| MongoDB | Running locally or a cloud URI (Atlas, etc.) |

### 2. Install

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Open `.env` and fill in every value. The critical ones are your Paystack keys from the [Paystack Dashboard](https://dashboard.paystack.com) under **Settings → API Keys**.

| Variable | Description |
|----------|-------------|
| `PORT` | HTTP port (default `3000`) |
| `MONGO_URI` | MongoDB connection string |
| `PAYSTACK_SECRET_KEY` | `sk_test_…` (test) or `sk_live_…` (production) |
| `PAYSTACK_PUBLIC_KEY` | `pk_test_…` — returned to the client for client-side use if needed |
| `APP_PUBLIC_URL` | Public HTTPS URL of your server (used as Paystack callback & webhook base). Use `ngrok` or similar in dev. |
| `TOTAL_TICKETS` | Max tickets for this event |
| `TICKET_PRICE_GHS` | Price per ticket in GHS |
| `EVENT_NAME` | Display name of the event |
| `EVENT_DATE` | ISO-8601 date string |

### 4. Register your webhook URL with Paystack

In the Paystack dashboard go to **Settings → Webhooks** and add:

```
https://YOUR_PUBLIC_URL/api/tickets/webhook
```

Paystack will POST `charge.success` events to this URL whenever a payment completes.

### 5. Run

```bash
# Development
npm run dev

# Production
npm run build && npm start
```

---

## API Reference

Base URL: `http://localhost:3000/api/tickets`

---

### `GET /availability`

Returns current ticket availability and event metadata. No authentication required.

**Response `200`**
```json
{
  "success": true,
  "data": {
    "availableTickets": 187,
    "totalTickets": 200,
    "soldOut": false,
    "ticketPrice": 150,
    "currency": "GHS",
    "eventName": "House Party 2025",
    "eventDate": "2025-03-15T18:00:00.000Z"
  }
}
```

---

### `POST /purchase`

Creates an order and initialises a Paystack payment session. Returns the `authorizationUrl` that your front-end must redirect the user to.

**Request Body**
```json
{
  "name": "Kwame Asante",
  "phone": "+233501234567",
  "email": "kwame@example.com",
  "numberOfTickets": 2
}
```

| Field | Type | Rules |
|-------|------|-------|
| `name` | string | 2–100 chars |
| `phone` | string | Valid Ghana number: `+233XXXXXXXXX` |
| `email` | string | Valid email — Paystack requires this on every transaction |
| `numberOfTickets` | number | Integer ≥ 1, ≤ available |

**Response `201`**
```json
{
  "success": true,
  "message": "Payment session created. Redirect the user to the authorizationUrl to complete payment.",
  "data": {
    "orderId": "uuid-here",
    "authorizationUrl": "https://checkout.paystack.com/…",
    "totalAmount": 300,
    "message": "…"
  }
}
```

> **Next step:** redirect the user's browser to `authorizationUrl`. Paystack handles card entry, bank transfer, or mobile money. After payment, Paystack redirects back to `/api/tickets/paystack-callback`.

---

### `GET /paystack-callback`

Paystack redirects the user here after payment (success *or* failure). The server verifies the transaction, issues tickets if successful, and then **302-redirects** to your front-end confirmation page.

> You do not call this endpoint yourself — Paystack does. Just make sure your front-end has a `/confirmation` route that can display the result.

---

### `POST /webhook`

Paystack POSTs `charge.success` events here asynchronously. The server verifies the HMAC-SHA512 signature, then issues tickets if not already issued (idempotent).

> Register this URL in your Paystack dashboard. You do not call it yourself.

---

### `GET /status/:orderId`

Lets your front-end poll for the current order state at any time — useful as a fallback if the callback redirect fails or the user refreshes.

**Response `200`**
```json
{
  "success": true,
  "data": {
    "orderStatus": "PAYMENT_SUCCESSFUL",
    "ticketCodes": ["HP-2025-00001", "HP-2025-00002"],
    "message": "Payment successful! Your tickets have been issued."
  }
}
```

Possible `orderStatus` values: `PENDING`, `PAYMENT_INITIATED`, `PAYMENT_SUCCESSFUL`, `PAYMENT_FAILED`, `PAYMENT_TIMEOUT`, `CANCELLED`.

---

### `GET /verify/:ticketCode`

Door-check endpoint. On the **first** successful scan the ticket is marked `USED`; any subsequent scan is rejected.

**Example:** `GET /verify/HP-2025-00001`

**Response `200` (valid, first scan)**
```json
{
  "success": true,
  "message": "✅ Ticket is valid. Entry granted.",
  "data": {
    "valid": true,
    "status": "USED",
    "buyerName": "Kwame Asante",
    "buyerPhone": "+233501234567",
    "orderId": "uuid-here",
    "message": "✅ Ticket is valid. Entry granted."
  }
}
```

**Response `400` (already used)**
```json
{
  "success": true,
  "data": {
    "valid": false,
    "status": "USED",
    "buyerName": "Kwame Asante",
    "message": "⚠️ Ticket has already been used."
  }
}
```

---

## Payment Flow Diagram

```
Client (Browser)              Server                      Paystack
  │                             │                            │
  │  POST /purchase             │                            │
  │  { name, phone, email, … }  │                            │
  │───────────────────────────▶ │                            │
  │                             │  initialize({ amount,…})   │
  │                             │──────────────────────────▶ │
  │                             │  ◀── { authorizationUrl } ─│
  │  ◀── 201 { authUrl, … } ───│                            │
  │                             │                            │
  │  REDIRECT ──────────────────────────────────────────────▶│
  │                             │       (user pays on        │
  │                             │        Paystack page)      │
  │  ◀── REDIRECT /paystack-callback ───────────────────────│
  │                             │                            │
  │  GET /paystack-callback     │                            │
  │───────────────────────────▶ │  verify(reference)         │
  │                             │──────────────────────────▶ │
  │                             │  ◀── { status: success } ──│
  │                             │                            │
  │                             │  → Issues tickets in DB    │
  │  ◀── 302 /confirmation ────│                            │
  │                             │                            │
  │                             │  ◀── POST /webhook ────────│  (async, may arrive
  │                             │       charge.success        │   before or after callback)
  │                             │       → idempotency guard  │
  │                             │                            │
  │  GET /verify/HP-2025-00001  │                            │
  │───────────────────────────▶ │                            │
  │  ◀── 200 { valid: true } ──│                            │
```

### Why both callback *and* webhook?

Paystack's callback redirect can fail (user closes the tab, network drops, etc.). The webhook is the **authoritative** signal that money moved — it fires independently. Both paths call the same `issueTicketsForOrder` helper with an idempotency guard, so whichever arrives first wins and the second is a harmless no-op.

---

## Data Models

### Order

| Field | Description |
|-------|-------------|
| `orderId` | Server-generated UUID — also used as the Paystack `reference` |
| `buyerName` | Buyer's full name |
| `buyerPhone` | Phone with country code |
| `numberOfTickets` | How many tickets requested |
| `totalAmount` | `numberOfTickets × ticketPrice` in GHS |
| `status` | Lifecycle state (see enum above) |
| `paystackReference` | The reference we sent to Paystack (= `orderId`) |
| `paystackPaymentId` | Paystack's internal transaction ID (from verify / webhook) |
| `paystackWebhookPayload` | Raw event/verify payload stored for auditing |
| `ticketCodes` | Array of issued ticket codes |

### Ticket

| Field | Description |
|-------|-------------|
| `ticketCode` | Human-readable code: `HP-YYYY-NNNNN` |
| `buyerName` | Denormalised from Order |
| `buyerPhone` | Denormalised from Order |
| `status` | `AVAILABLE → SOLD → USED` (or `CANCELLED`) |
| `orderId` | FK back to the Order |
| `usedAt` | Timestamp set when scanned at door |

---

## Production Checklist

- [ ] Swap to **live** Paystack keys (`sk_live_…` / `pk_live_…`)
- [ ] Set `APP_PUBLIC_URL` to your actual HTTPS domain
- [ ] Register the webhook URL in the Paystack dashboard
- [ ] Set `NODE_ENV=production` (suppresses verbose error messages)
- [ ] Use a proper MongoDB cloud instance (Atlas, etc.)
- [ ] Put the server behind a reverse proxy (nginx, Caddy) that terminates TLS
- [ ] Consider wrapping availability check + ticket creation in a **MongoDB transaction** to prevent overselling under high concurrency