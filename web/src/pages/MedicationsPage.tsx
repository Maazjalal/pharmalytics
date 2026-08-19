import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Medication } from "@/types/api";
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

function formatPrice(price: string) {
  return `$${Number(price).toFixed(2)}`;
}

export function MedicationsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [editing, setEditing] = useState<Medication | null>(null);

  const { data: medications, isLoading } = useQuery({
    queryKey: ["medications"],
    queryFn: () => api<Medication[]>("/medications"),
  });

  const createMedication = useMutation({
    mutationFn: () =>
      api<Medication>("/medications", {
        method: "POST",
        body: JSON.stringify({ name, defaultPrice: Number(price) }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
      setOpen(false);
      setName("");
      setPrice("");
      toast.success("Medication added");
    },
    onError: () => toast.error("Could not add medication"),
  });

  const updateMedication = useMutation({
    mutationFn: () =>
      api<Medication>(`/medications/${editing!.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name, defaultPrice: Number(price) }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
      setEditing(null);
      toast.success("Medication updated");
    },
    onError: () => toast.error("Could not update medication"),
  });

  function openCreate() {
    setName("");
    setPrice("");
    setOpen(true);
  }

  function openEdit(medication: Medication) {
    setName(medication.name);
    setPrice(medication.defaultPrice);
    setEditing(medication);
  }

  function handleCreateSubmit(e: FormEvent) {
    e.preventDefault();
    createMedication.mutate();
  }

  function handleEditSubmit(e: FormEvent) {
    e.preventDefault();
    updateMedication.mutate();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl text-foreground">Medications</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>New medication</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New medication</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="med-name">Name</Label>
                <Input id="med-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="med-price">Default price</Label>
                <Input
                  id="med-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMedication.isPending}>
                  {createMedication.isPending ? "Adding..." : "Add medication"}
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
              <TableHead className="uppercase tracking-wide">Name</TableHead>
              <TableHead className="uppercase tracking-wide">Default price</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {medications?.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No medications yet.
                </TableCell>
              </TableRow>
            )}
            {medications?.map((medication) => (
              <TableRow key={medication.id} className="hover:bg-muted">
                <TableCell>{medication.name}</TableCell>
                <TableCell className="font-mono text-sm">
                  {formatPrice(medication.defaultPrice)}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(medication)}>
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit medication</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-med-name">Name</Label>
              <Input id="edit-med-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-med-price">Default price</Label>
              <Input
                id="edit-med-price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={updateMedication.isPending}>
                {updateMedication.isPending ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
