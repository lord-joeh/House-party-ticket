import { useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAvailability } from "../hooks/useAvailability";
import { purchaseTickets } from "../utils/api";
import AvailabilityBadge from "../components/AvailabilityBadge";
import Input from "../components/Input";
import Button from "../components/Button";

interface FormData {
  name: string;
  phone: string;
  email: string;
  numberOfTickets: number;
}

interface Errors {
  name?: string;
  phone?: string;
  email?: string;
  numberOfTickets?: string;
}

function validate(form: FormData, maxTickets: number): Errors {
  const e: Errors = {};
  if (!form.name.trim() || form.name.trim().length < 2)
    e.name = "Name must be at least 2 characters.";
  if (!/^\+?233\d{9}$/.test(form.phone.trim()))
    e.phone = "Enter a valid Ghana number (e.g. +233501234567).";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
    e.email = "Enter a valid email address.";
  if (form.numberOfTickets < 1 || form.numberOfTickets > maxTickets)
    e.numberOfTickets = `You can buy between 1 and ${maxTickets} tickets.`;
  return e;
}

export default function Buy() {
  const { data, loading: availLoading } = useAvailability();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormData>({
    name: "",
    phone: "",
    email: "",
    numberOfTickets: 1,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const maxTickets = data?.availableTickets ?? 0;
  const ticketPrice = data?.ticketPrice ?? 0;
  const total = form.numberOfTickets * ticketPrice;

  const handleChange =
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const val =
        field === "numberOfTickets" ? Number(e.target.value) : e.target.value;
      setForm((prev) => ({ ...prev, [field]: val }));
      // clear individual error on touch
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const adjustTickets = (delta: number) => {
    setForm((prev) => {
      const next = Math.max(
        1,
        Math.min(maxTickets, prev.numberOfTickets + delta),
      );
      return { ...prev, numberOfTickets: next };
    });
  };

  const handleSubmit = async (e: ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    const errs = validate(form, maxTickets);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const result = await purchaseTickets({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        numberOfTickets: form.numberOfTickets,
      });

      // store orderId so /processing can use it
      sessionStorage.setItem("currentOrderId", result.orderId);

      // navigate to processing page, then it will redirect to Paystack
      navigate("/processing", {
        state: {
          authorizationUrl: result.authorizationUrl,
          orderId: result.orderId,
        },
      });
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (availLoading) {
    return (
      <div className="flex items-center justify-center py-40">
        <span
          className="inline-block w-6 h-6 border-2 rounded-full"
          style={{
            borderColor: "var(--color-accent)",
            borderTopColor: "transparent",
            animation: "spin 0.6s linear infinite",
          }}
        />
      </div>
    );
  }

  if (data?.soldOut) {
    return (
      <div className="max-w-lg mx-auto px-5 py-32 text-center flex flex-col items-center gap-6">
        <AvailabilityBadge
          available={0}
          total={data.totalTickets}
          soldOut={true}
        />
        <h2
          className="text-3xl font-bold"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--color-text)",
          }}
        >
          SOLD OUT
        </h2>
        <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
          All tickets have been sold. Check back or follow us for updates.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-5 py-16">
      {/* header */}
      <div className="flex flex-col gap-4 mb-10">
        <h1
          className="text-4xl font-bold"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--color-accent)",
          }}
        >
          BUY TICKETS
        </h1>
        {data && (
          <AvailabilityBadge
            available={data.availableTickets}
            total={data.totalTickets}
            soldOut={data.soldOut}
          />
        )}
      </div>

      {/* form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input
          label="Full Name"
          placeholder="Kwame Joseph"
          value={form.name}
          onChange={handleChange("name")}
          error={errors.name}
        />
        <Input
          label="Phone Number"
          placeholder="+233501234567"
          value={form.phone}
          onChange={handleChange("phone")}
          error={errors.phone}
          helperText="Ghana number starting with +233"
        />
        <Input
          label="Email Address"
          type="email"
          placeholder="kwame@example.com"
          value={form.email}
          onChange={handleChange("email")}
          error={errors.email}
          helperText="Email is required to process payment"
        />

        {/* quantity stepper */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="button"
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-text-dim)" }}
          >
            Number of Tickets
          </label>

          <div className="flex items-center gap-3">
            {/* – button */}
            <button
              type="button"
              onClick={() => adjustTickets(-1)}
              disabled={form.numberOfTickets <= 1}
              className="w-10 h-10 rounded-md flex items-center justify-center text-lg font-bold transition-colors duration-150 disabled:opacity-25 cursor-pointer"
              style={{
                background: "var(--color-surface-raised)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
              }}
            >
              -
            </button>

            {/* count */}
            <span
              className="text-xl font-bold w-8 text-center"
              style={{
                color: "var(--color-text)",
                fontFamily: "var(--font-display)",
              }}
            >
              {form.numberOfTickets}
            </span>

            {/* + button */}
            <button
              type="button"
              onClick={() => adjustTickets(1)}
              disabled={form.numberOfTickets >= maxTickets}
              className="w-10 h-10 rounded-md flex items-center justify-center text-lg font-bold transition-colors duration-150 disabled:opacity-25 cursor-pointer"
              style={{
                background: "var(--color-surface-raised)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
              }}
            >
              +
            </button>
          </div>

          {errors.numberOfTickets && (
            <span className="text-xs" style={{ color: "var(--color-error)" }}>
              {errors.numberOfTickets}
            </span>
          )}
        </div>

        <div
          className="rounded-lg border p-5 flex flex-col gap-3 mt-2"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <span
            className="text-xs uppercase tracking-wider font-semibold"
            style={{ color: "var(--color-text-dim)" }}
          >
            Order Summary
          </span>

          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--color-text-dim)" }}>
              {form.numberOfTickets} x GHS {ticketPrice}
            </span>
            <span style={{ color: "var(--color-text)" }}>
              GHS {total.toFixed(2)}
            </span>
          </div>

          <div
            className="border-t pt-3 flex justify-between items-baseline"
            style={{ borderColor: "var(--color-border)" }}
          >
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--color-text)" }}
            >
              Total
            </span>
            <span
              className="text-2xl font-bold"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--color-accent)",
              }}
            >
              GHS {total.toFixed(2)}
            </span>
          </div>
        </div>

        {submitError && (
          <div
            className="rounded-md border px-4 py-3 text-sm"
            style={{
              background: "var(--color-error-dim)",
              borderColor: "var(--color-error)",
              color: "var(--color-error)",
            }}
          >
            {submitError}
          </div>
        )}

        {/* submit */}
        <Button type="submit" size="lg" variant="accent" isLoading={submitting}>
          Proceed to Payment
        </Button>

        <p
          className="text-center text-xs"
          style={{ color: "var(--color-text-muted)" }}
        >
          You'll be redirected to Paystack to complete your payment securely.
        </p>
      </form>
    </div>
  );
}
