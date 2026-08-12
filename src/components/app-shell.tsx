import { Link, useRouterState } from "@tanstack/react-router";
import { Library, Boxes, Headphones, Network, Plug, RotateCcw, ScrollText } from "lucide-react";
import type { ReactNode } from "react";
import { useDemoSession } from "@/state/demo-session";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/library", label: "My Library", icon: Library },
  { to: "/virtual-library", label: "Virtual Library", icon: Boxes },
  { to: "/reader", label: "Active Reader", icon: Headphones },
  { to: "/graph", label: "Knowledge Graph", icon: Network },
  { to: "/connect", label: "Providers", icon: Plug },
  { to: "/architecture", label: "Status", icon: ScrollText },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { resetDemo, demoStarted } = useDemoSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen text-foreground">
      <header className="sticky top-0 z-40 glass">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-md bg-primary/15 text-primary ring-1 ring-primary/40">
              <Headphones className="size-4" />
            </span>
            <span className="text-sm leading-tight font-semibold tracking-tight">
              Spatial Audio Library
              <span className="block font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                Knowledge HUD
              </span>
            </span>
          </Link>

          <nav className="order-3 flex w-full gap-1 overflow-x-auto md:order-none md:w-auto md:flex-1 md:justify-center">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = pathname === to || pathname.startsWith(`${to}/`);
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                    active
                      ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <Icon className="size-3.5" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <span
              className={cn(
                "hidden font-mono text-[10px] tracking-widest uppercase sm:inline",
                demoStarted ? "text-primary" : "text-muted-foreground",
              )}
            >
              {demoStarted ? "demo active" : "demo idle"}
            </span>
            <button
              onClick={resetDemo}
              className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <RotateCcw className="size-3.5" />
              Reset demo
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
