import { cn } from "@/lib/utils";
import type { ClientStatus } from "@/types/api";

export function StatusBadge({ status }: { status: ClientStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        status === "paid"
          ? "bg-paid-light text-paid"
          : "bg-due-light text-due",
      )}
    >
      {status}
    </span>
  );
}
