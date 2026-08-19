import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Client, ClientStatus } from "@/types/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function HomePage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => api<Client[]>("/clients"),
  });

  const createClient = useMutation({
    mutationFn: (name: string) =>
      api<Client>("/clients", { method: "POST", body: JSON.stringify({ name }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setOpen(false);
      setName("");
      toast.success("Client added");
    },
    onError: () => toast.error("Could not add client"),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ClientStatus }) =>
      api<Client>(`/clients/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients"] }),
    onError: () => toast.error("Could not update status"),
  });

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (name.trim()) createClient.mutate(name.trim());
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl text-foreground">Clients</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>New client</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New client</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="client-name">Name</Label>
                <Input
                  id="client-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createClient.isPending}>
                  {createClient.isPending ? "Adding..." : "Add client"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="uppercase tracking-wide">Client ID</TableHead>
              <TableHead className="uppercase tracking-wide">Name</TableHead>
              <TableHead className="uppercase tracking-wide">Date Created</TableHead>
              <TableHead className="uppercase tracking-wide">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {clients?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No clients yet.
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
                  <Select
                    value={client.status}
                    onValueChange={(status: ClientStatus) =>
                      updateStatus.mutate({ id: client.id, status })
                    }
                  >
                    <SelectTrigger
                      size="sm"
                      className={cn(
                        "w-auto gap-1.5 rounded-full border-none px-2.5 py-0.5 text-xs font-medium capitalize shadow-none",
                        client.status === "paid"
                          ? "bg-paid-light text-paid"
                          : "bg-due-light text-due",
                      )}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="due">Due</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
