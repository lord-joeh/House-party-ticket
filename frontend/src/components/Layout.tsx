import { NavLink, Outlet } from "react-router-dom";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/buy", label: "Buy Tickets" },
  // { to: "/verify", label: "Verify" },
];

export default function Layout() {
  return (
    <div
      className="flex flex-col min-h-screen"
      style={{
        fontFamily: "var(--font-body)",
        background: "var(--color-bg)",
        color: "var(--color-text)",
      }}
    >
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          borderColor: "var(--color-border)",
          background: "rgba(10,10,10,0.85)",
          backdropFilter: "blur(12px)",
        }}
      >
        <nav className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          {/* logo */}
          <NavLink to="/" className="flex items-center gap-2 no-underline">
            <span
              className="text-2xl font-bold tracking-tight"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--color-accent)",
              }}
            >
              HP
            </span>
            <span
              className="text-sm font-medium opacity-60"
              style={{ color: "var(--color-text)" }}
            >
              2026
            </span>
          </NavLink>

          {/* links */}
          <ul className="flex gap-6 list-none">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }: { isActive: boolean }) =>
                    [
                      "text-sm font-medium no-underline transition-colors duration-200",
                      isActive ? "" : "opacity-45 hover:opacity-80",
                    ].join(" ")
                  }
                  style={({ isActive }: { isActive: boolean }) => ({
                    color: isActive
                      ? "var(--color-accent)"
                      : "var(--color-text)",
                  })}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer
        className="border-t mt-auto"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div className="max-w-5xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p
            className="text-xs opacity-40"
            style={{ color: "var(--color-text)" }}
          >
            © 2026 House Party. All rights reserved.
          </p>
          <div className="flex gap-5">
            {["Twitter", "Instagram", "WhatsApp"].map((s) => (
              <button
                key={s}
                className="text-xs font-medium opacity-40 hover:opacity-80 transition-opacity duration-200 no-underline bg-none border-none cursor-pointer p-0"
                style={{ color: "var(--color-text)" }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
