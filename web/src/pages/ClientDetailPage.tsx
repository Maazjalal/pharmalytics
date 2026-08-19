import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { ClientDetail, ClientStatus, Medication } from "@/types/api";
import { StatusBadge } from "@/components/StatusBadge";
import { AttachmentControl } from "@/components/AttachmentControl";
import { BuildPdfSection } from "@/components/BuildPdfSection";
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

function formatMoney(value: number | string) {
  return `$${Number(value).toFixed(2)}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [medicationId, setMedicationId] = useState("");
  const [dosage, setDosage] = useState("");
  const [dosageUnit, setDosageUnit] = useState("mg");
  const [prescriptionDate, setPrescriptionDate] = useState(todayIso());

  const { data: client, isLoading } = useQuery({
    queryKey: ["clients", id],
    queryFn: () => api<ClientDetail>(`/clients/${id}`),
  });

  const { data: medications } = useQuery({
    queryKey: ["medications"],
    queryFn: () => api<Medication[]>("/medications"),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["clients", id] });
    queryClient.invalidateQueries({ queryKey: ["clients"] });
  }

  const updateStatus = useMutation({
    mutationFn: (status: ClientStatus) =>
      api(`/clients/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: invalidate,
    onError: () => toast.error("Could not update status"),
  });

  const setArchived = useMutation({
    mutationFn: (archived: boolean) =>
      api(`/clients/${id}/archive`, { method: "PATCH", body: JSON.stringify({ archived }) }),
    onSuccess: (_, archived) => {
      invalidate();
      toast.success(archived ? "Client archived" : "Client unarchived");
    },
    onError: () => toast.error("Could not update archive status"),
  });

  const attachMedication = useMutation({
    mutationFn: () =>
      api(`/clients/${id}/medications`, {
        method: "POST",
        body: JSON.stringify({
          medicationId,
          dosage: Number(dosage),
          dosageUnit,
          prescriptionDate,
        }),
      }),
    onSuccess: () => {
      invalidate();
      setOpen(false);
      setMedicationId("");
      setDosage("");
      setDosageUnit("mg");
      setPrescriptionDate(todayIso());
      toast.success("Medication attached");
    },
    onError: () => toast.error("Could not attach medication"),
  });

  const removeMedication = useMutation({
    mutationFn: (clientMedicationId: string) =>
      api(`/client-medications/${clientMedicationId}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate();
      toast.success("Medication removed");
    },
    onError: () => toast.error("Could not remove medication"),
  });

  function handleAttachSubmit(e: FormEvent) {
    e.preventDefault();
    if (medicationId && dosage) attachMedication.mutate();
  }

  if (isLoading || !client) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  return (
    <div>
      <button
        onClick={() => navigate("/")}
        className="mb-4 text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Back to clients
      </button>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="font-mono text-sm text-muted-foreground">{client.clientCode}</p>
          <h2 className="text-2xl text-foreground">{client.name}</h2>
        </div>
        <div className="flex items-center gap-3">
          {client.archived && <StatusBadge status={client.status} />}
          {!client.archived && (
            <Select
              value={client.status}
              onValueChange={(status: ClientStatus) => updateStatus.mutate(status)}
            >
              <SelectTrigger size="sm" className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="treatment">Treatment</SelectItem>
                <SelectItem value="settled">Settled</SelectItem>
              </SelectContent>
            </Select>
          )}
          <AttachmentControl clientId={client.id} attachmentName={client.attachmentOriginalName} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setArchived.mutate(!client.archived)}
          >
            {client.archived ? "Unarchive" : "Archive"}
          </Button>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between rounded-xl bg-primary px-6 py-5 text-primary-foreground">
        <span className="text-sm opacity-90">Total due</span>
        <span className="font-mono text-2xl">{formatMoney(client.total)}</span>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg text-foreground">Medications</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Attach medication</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Attach medication</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAttachSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="medication">Medication</Label>
                <Select value={medicationId} onValueChange={setMedicationId}>
                  <SelectTrigger id="medication" className="w-full">
                    <SelectValue placeholder="Select a medication" />
                  </SelectTrigger>
                  <SelectContent>
                    {medications?.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} &mdash; {formatMoney(m.defaultPrice)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="dosage">Dosage</Label>
                  <Input
                    id="dosage"
                    type="number"
                    step="0.01"
                    min="0"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="dosage-unit">Unit</Label>
                  <Input
                    id="dosage-unit"
                    value={dosageUnit}
                    onChange={(e) => setDosageUnit(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="prescription-date">Prescription date</Label>
                <Input
                  id="prescription-date"
                  type="date"
                  value={prescriptionDate}
                  onChange={(e) => setPrescriptionDate(e.target.value)}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={attachMedication.isPending || !medicationId}>
                  {attachMedication.isPending ? "Attaching..." : "Attach"}
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
              <TableHead className="uppercase tracking-wide">Medication</TableHead>
              <TableHead className="uppercase tracking-wide">Dosage</TableHead>
              <TableHead className="uppercase tracking-wide">Prescription date</TableHead>
              <TableHead className="uppercase tracking-wide">Price</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {client.clientMedications.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No medications attached yet.
                </TableCell>
              </TableRow>
            )}
            {client.clientMedications.map((cm) => (
              <TableRow key={cm.id} className="hover:bg-muted">
                <TableCell>{cm.medication.name}</TableCell>
                <TableCell className="font-mono text-sm">
                  {cm.dosage} {cm.dosageUnit}
                </TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {new Date(cm.prescriptionDate).toLocaleDateString()}
                </TableCell>
                <TableCell className="font-mono text-sm">{formatMoney(cm.price)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMedication.mutate(cm.id)}
                  >
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <BuildPdfSection clientId={client.id} />
    </div>
  );
}
