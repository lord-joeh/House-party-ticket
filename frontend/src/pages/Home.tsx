import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAvailability } from "../hooks/useAvailability";
import AvailabilityBadge from "../components/AvailabilityBadge";
import Button from "../components/Button";

function useReveal() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);
  return visible;
}

function DetailCard({
  icon,
  label,
  value,
  delay,
}: {
  readonly icon: string;
  readonly label: string;
  readonly value: string;
  readonly delay: number;
}) {
  const visible = useReveal();
  return (
    <div
      className="rounded-lg p-5 border flex flex-col gap-2"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(18px)",
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
      }}
    >
      <span className="text-lg">{icon}</span>
      <span
        className="text-xs uppercase tracking-wider font-semibold"
        style={{ color: "var(--color-text-dim)" }}
      >
        {label}
      </span>
      <span
        className="text-sm font-medium"
        style={{ color: "var(--color-text)" }}
      >
        {value}
      </span>
    </div>
  );
}

export default function Home() {
  const { data, loading } = useAvailability();
  const visible = useReveal();

  const eventDate = data ? new Date(data.eventDate) : null;
  const formattedDate = eventDate
    ? eventDate.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";
  const formattedTime = eventDate
    ? eventDate.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "—";

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      <section className="relative flex-1 flex flex-col items-center justify-center px-5 pt-16 pb-24 text-center overflow-hidden">
        {/* ambient glow */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 600,
            height: 600,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background:
              "radial-gradient(circle, rgba(232,255,71,0.08) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        {/* badge */}
        {!loading && data && (
          <div
            className="mb-8"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(-12px)",
              transition: "opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s",
            }}
          >
            <AvailabilityBadge
              available={data.availableTickets}
              total={data.totalTickets}
              soldOut={data.soldOut}
            />
          </div>
        )}

        {/* headline */}
        <h1
          className="text-7xl sm:text-9xl font-bold leading-none tracking-tight mb-4 relative"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--color-accent)",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s",
          }}
        >
          HOUSE
          <br />
          PARTY
        </h1>

        {/* sub */}
        <p
          className="text-base sm:text-lg max-w-md mx-auto mb-10"
          style={{
            color: "var(--color-text-dim)",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.6s ease 0.35s, transform 0.6s ease 0.35s",
          }}
        >
          One night. Good music. Better company. Grab your spot before they're
          gone.
        </p>

        {/* CTA */}
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.5s ease 0.5s, transform 0.5s ease 0.5s",
          }}
        >
          <Link to="/buy">
            <Button size="lg" variant="accent" disabled={data?.soldOut}>
              {data?.soldOut ? "Sold Out" : "Get Your Tickets"}
            </Button>
          </Link>
        </div>
      </section>

      <section className="max-w-4xl mx-auto w-full px-5 pb-24">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <DetailCard icon="📅" label="Date" value={formattedDate} delay={0} />
          <DetailCard icon="🕗" label="Time" value={formattedTime} delay={80} />
          <DetailCard
            icon="📍"
            label="Location"
            value="Secret Venue, Accra"
            delay={160}
          />
          <DetailCard
            icon="🎵"
            label="Vibe"
            value="Live DJ · Afrobeats · Fun"
            delay={240}
          />
        </div>

        {/* pricing row */}
        <div
          className="mt-8 rounded-lg border p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="flex flex-col gap-0.5">
            <span
              className="text-xs uppercase tracking-wider font-semibold"
              style={{ color: "var(--color-text-dim)" }}
            >
              Ticket Price
            </span>
            <span className="flex items-baseline gap-1.5">
              <span
                className="text-4xl font-bold"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--color-accent)",
                }}
              >
                {loading ? "—" : data?.ticketPrice}
              </span>
              <span
                className="text-sm"
                style={{ color: "var(--color-text-dim)" }}
              >
                GHS per ticket
              </span>
            </span>
          </div>
          <Link to="/buy">
            <Button size="md" variant="ghost" disabled={data?.soldOut}>
              {data?.soldOut ? "Unavailable" : "Buy Now →"}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
