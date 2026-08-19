import { cn } from "@/lib/utils";
import type { ClientStatus } from "@/types/api";

const labels: Record<ClientStatus, string> = {
  treatment: "Treatment",
  settled: "Settled",
};

export function StatusBadge({ status }: { status: ClientStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        status === "settled"
          ? "bg-paid-light text-paid"
          : "bg-due-light text-due",
      )}
    >
      {labels[status]}
    </span>
  );
}
