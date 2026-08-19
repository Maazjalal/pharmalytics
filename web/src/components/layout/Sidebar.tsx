import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/", label: "Home", end: true },
  { to: "/medications", label: "Medications" },
  { to: "/reports", label: "Reports" },
];

export function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-screen w-[220px] shrink-0 flex-col border-r border-border bg-card">
      <div className="px-6 py-6">
        <h1 className="text-lg text-foreground">Pharmalytics</h1>
      </div>

      <nav className="flex flex-col gap-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-border px-6 py-4">
        <p className="truncate text-sm text-foreground">{user?.name}</p>
        <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        <Button variant="ghost" size="sm" className="mt-2 -ml-2" onClick={logout}>
          Log out
        </Button>
      </div>
    </aside>
  );
}
