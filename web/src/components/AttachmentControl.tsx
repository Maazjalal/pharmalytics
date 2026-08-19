import { useRef, type ChangeEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { api, fetchBlob, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";

export function AttachmentControl({
  clientId,
  attachmentName,
}: {
  clientId: string;
  attachmentName: string | null;
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["clients", clientId] });
  }

  const upload = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return api(`/clients/${clientId}/attachment`, { method: "POST", body: formData });
    },
    onSuccess: () => {
      invalidate();
      toast.success("Attachment uploaded");
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Could not upload attachment"),
  });

  const remove = useMutation({
    mutationFn: () => api(`/clients/${clientId}/attachment`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate();
      toast.success("Attachment removed");
    },
    onError: () => toast.error("Could not remove attachment"),
  });

  async function handleView() {
    try {
      const blob = await fetchBlob(`/clients/${clientId}/attachment`);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error("Could not open attachment");
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload.mutate(file);
    e.target.value = "";
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        hidden
        onChange={handleFileChange}
      />
      {attachmentName ? (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={handleView}
            className="max-w-[180px] gap-1.5"
          >
            <FileText className="size-3.5 shrink-0" />
            <span className="truncate">{attachmentName}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => remove.mutate()}
            disabled={remove.isPending}
            aria-label="Remove attachment"
          >
            <X className="size-3.5" />
          </Button>
        </>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => fileInputRef.current?.click()}
          disabled={upload.isPending}
        >
          <Upload className="size-3.5" />
          {upload.isPending ? "Uploading..." : "Attach PDF"}
        </Button>
      )}
    </div>
  );
}
