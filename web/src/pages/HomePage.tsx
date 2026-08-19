import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Client, ClientStatus } from "@/types/api";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { ClientsTable } from "@/components/ClientsTable";
import { SearchInput } from "@/components/SearchInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function HomePage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients", { archived: false, search: debouncedSearch }],
    queryFn: () => {
      const params = new URLSearchParams({ archived: "false" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      return api<Client[]>(`/clients?${params}`);
    },
  });

  function invalidateClients() {
    queryClient.invalidateQueries({ queryKey: ["clients"] });
  }

  const createClient = useMutation({
    mutationFn: (name: string) =>
      api<Client>("/clients", { method: "POST", body: JSON.stringify({ name }) }),
    onSuccess: () => {
      invalidateClients();
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
    onSuccess: invalidateClients,
    onError: () => toast.error("Could not update status"),
  });

  const archiveClient = useMutation({
    mutationFn: (id: string) =>
      api<Client>(`/clients/${id}/archive`, {
        method: "PATCH",
        body: JSON.stringify({ archived: true }),
      }),
    onSuccess: () => {
      invalidateClients();
      toast.success("Client archived");
    },
    onError: () => toast.error("Could not archive client"),
  });

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (name.trim()) createClient.mutate(name.trim());
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl text-foreground">Clients</h2>
        <div className="flex items-center gap-3">
          <SearchInput value={search} onChange={setSearch} />
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
      </div>

      <ClientsTable
        clients={clients}
        isLoading={isLoading}
        emptyMessage={debouncedSearch ? "No clients match your search." : "No clients yet."}
        onStatusChange={(id, status) => updateStatus.mutate({ id, status })}
        rowAction={{ label: "Archive", onClick: (id) => archiveClient.mutate(id) }}
      />
    </div>
  );
}
