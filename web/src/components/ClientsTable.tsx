import { Link } from "react-router-dom";
import type { Client, ClientStatus } from "@/types/api";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ClientsTableProps {
  clients: Client[] | undefined;
  isLoading: boolean;
  emptyMessage: string;
  onStatusChange?: (id: string, status: ClientStatus) => void;
  rowAction: {
    label: string;
    onClick: (id: string) => void;
  };
}

export function ClientsTable({
  clients,
  isLoading,
  emptyMessage,
  onStatusChange,
  rowAction,
}: ClientsTableProps) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="uppercase tracking-wide">Client ID</TableHead>
            <TableHead className="uppercase tracking-wide">Name</TableHead>
            <TableHead className="uppercase tracking-wide">Date Created</TableHead>
            <TableHead className="uppercase tracking-wide">Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Loading...
              </TableCell>
            </TableRow>
          )}
          {clients?.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
          {clients?.map((client) => (
            <TableRow key={client.id} className="hover:bg-muted">
              <TableCell className="font-mono text-sm">
                <Link to={`/clients/${client.id}`} className="hover:underline">
                  {client.clientCode}
                </Link>
              </TableCell>
              <TableCell>
                <Link to={`/clients/${client.id}`} className="hover:underline">
                  {client.name}
                </Link>
              </TableCell>
              <TableCell className="font-mono text-sm text-muted-foreground">
                {new Date(client.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {onStatusChange ? (
                  <Select
                    value={client.status}
                    onValueChange={(status: ClientStatus) => onStatusChange(client.id, status)}
                  >
                    <SelectTrigger
                      size="sm"
                      className={cn(
                        "w-auto gap-1.5 rounded-full border-none px-2.5 py-0.5 text-xs font-medium shadow-none",
                        client.status === "settled"
                          ? "bg-paid-light text-paid"
                          : "bg-due-light text-due",
                      )}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="treatment">Treatment</SelectItem>
                      <SelectItem value="settled">Settled</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <StatusBadge status={client.status} />
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => rowAction.onClick(client.id)}>
                  {rowAction.label}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
