import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Client } from "@/types/api";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { ClientsTable } from "@/components/ClientsTable";
import { SearchInput } from "@/components/SearchInput";

export function ArchivedPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients", { archived: true, search: debouncedSearch }],
    queryFn: () => {
      const params = new URLSearchParams({ archived: "true" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      return api<Client[]>(`/clients?${params}`);
    },
  });

  const unarchiveClient = useMutation({
    mutationFn: (id: string) =>
      api<Client>(`/clients/${id}/archive`, {
        method: "PATCH",
        body: JSON.stringify({ archived: false }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client unarchived");
    },
    onError: () => toast.error("Could not unarchive client"),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl text-foreground">Archived</h2>
        <SearchInput value={search} onChange={setSearch} />
      </div>

      <ClientsTable
        clients={clients}
        isLoading={isLoading}
        emptyMessage={debouncedSearch ? "No archived clients match your search." : "No archived clients."}
        rowAction={{ label: "Unarchive", onClick: (id) => unarchiveClient.mutate(id) }}
      />
    </div>
  );
}
