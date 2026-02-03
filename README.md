# 🎟️ House Party Ticket System

A full-stack event ticketing application designed for selling and verifying tickets for house parties and private events. This system features a secure payment flow using **Paystack**, automated ticket generation, and a real-time verification interface for door entry.

## 🏗️ Architecture

The repository is organized as a monorepo containing two distinct applications:

- **`frontend/`**: A modern React application (Vite + TypeScript + Tailwind CSS) for the user interface.
- **`server/`**: A robust REST API (Node.js + Express + TypeScript) that handles business logic, database interactions, and payments.

---

## 🚀 Tech Stack

### Frontend

- **Framework:** React 19
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4
- **Language:** TypeScript
- **Routing:** React Router
- **HTTP Client:** Native Fetch / Custom Utils

### Backend

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (with Mongoose ODM)
- **Payment Gateway:** Paystack API
- **Language:** TypeScript

---

## 🛠️ Prerequisites

Ensure you have the following installed before proceeding:

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or Atlas URI)
- A [Paystack](https://paystack.com/) Account (for API Keys)

---

## ⚙️ Installation & Setup

### 1. Backend Setup

Navigate to the server directory and install dependencies:

```bash
cd server
npm install

```

Create a `.env` file in the `server/` root directory with the following variables:

```env
# Server Configuration
PORT=3000
APP_PUBLIC_URL=http://localhost:3000

# Database
MONGO_URI=mongodb://localhost:27017/house_party_tickets

# Paystack Configuration (Get these from your Paystack Dashboard)
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxx

# Event Details
EVENT_NAME="Summer House Party 2026"
EVENT_DATE="2026-07-20T18:00:00.000Z"
TOTAL_TICKETS=200
TICKET_PRICE_GHS=150

```

Start the backend server:

```bash
npm run dev

> The server will start on `http://localhost:3000`.

```

> The server will start on `http://localhost:3000`.

### 2. Frontend Setup

Open a new terminal, navigate to the frontend directory, and install dependencies:

```bash
cd frontend
npm install

```

Start the frontend development server:

```bash
npm run dev

```

> The frontend will start on `http://localhost:5173`.

---

## 💳 How It Works

### Purchasing a Ticket

1. Users visit the **Home** page and click "Get Ticket".
2. They enter their details (Name, Email, Phone).
3. The system initializes a transaction with Paystack.
4. Users are redirected to Paystack to complete payment (Card, Mobile Money, etc.).
5. Upon success, they are redirected to a **Confirmation** page displaying their unique **Ticket Code**.

### Verifying a Ticket (Door Entry)

1. Event organizers navigate to the `/verify` route (e.g., `http://localhost:5173/verify`).

2. Enter the attendee's **Ticket Code**.

3. The system checks the database:

- **✅ Valid:** Ticket exists and hasn't been used. (Status updates to `USED`).
- **⚠️ Used:** Ticket exists but was already scanned.
- **❌ Invalid:** Ticket code does not exist.

---

## 📂 Project Structure

```text
.
├── frontend/                # Client-side React application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/           # Custom React hooks (e.g., useAvailability)
│   │   ├── pages/           # Application views (Home, Buy, Verify)
│   │   └── utils/           # API helpers
│   └── ...
│
├── server/                  # Server-side Node.js application
│   ├── src/
│   │   ├── config/          # Environment & DB config
│   │   ├── models/          # Mongoose Data Models (Order, Ticket)
│   │   ├── routes/          # API Route definitions
│   │   ├── services/        # Logic for Paystack & Ticket handling
│   │   └── app.ts           # App entry point
│   └── ...

```

## 📝 API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/tickets/initialize` | Creates an order and gets Paystack auth URL |
| `GET` | `/api/tickets/verify-payment` | Verifies transaction after callback |
| `GET` | `/api/tickets/verify/:code` | Checks if a ticket code is valid for entry |
| `GET` | `/api/tickets/availability` | Checks remaining ticket count |
| `POST` | `/api/tickets/webhook` | Receives Paystack webhooks (optional) |

## 📄 License

This project is open-source and available under the [MIT License](https://www.google.com/search?q=LICENSE).
