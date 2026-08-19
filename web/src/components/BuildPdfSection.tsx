import { useRef, type ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileOutput, Upload } from "lucide-react";
import { toast } from "sonner";
import { api, fetchBlob, ApiError } from "@/lib/api";
import type { PdfTemplate } from "@/types/api";
import { Button } from "@/components/ui/button";

export function BuildPdfSection({ clientId }: { clientId: string }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: template, isLoading } = useQuery({
    queryKey: ["pdf-template"],
    queryFn: () => api<PdfTemplate | null>("/pdf-template"),
  });

  const uploadTemplate = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return api("/pdf-template", { method: "POST", body: formData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdf-template"] });
      toast.success("Template uploaded");
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Could not upload template"),
  });

  const buildPdf = useMutation({
    mutationFn: async () => {
      const blob = await fetchBlob(`/clients/${clientId}/build-pdf`);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Could not build PDF"),
  });

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadTemplate.mutate(file);
    e.target.value = "";
  }

  return (
    <div className="mt-6 rounded-xl border border-border bg-card p-6">
      <h3 className="mb-1 text-lg text-foreground">Build PDF</h3>
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        hidden
        onChange={handleFileChange}
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : template ? (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Fills <span className="font-mono">{template.originalName}</span> with this client's
            details.
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadTemplate.isPending}
            >
              Replace template
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => buildPdf.mutate()}
              disabled={buildPdf.isPending}
            >
              <FileOutput className="size-3.5" />
              {buildPdf.isPending ? "Building..." : "Generate PDF"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            No PDF template uploaded yet. Upload a .docx with{" "}
            <span className="font-mono">[SQUARE_BRACKET]</span> merge fields.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadTemplate.isPending}
          >
            <Upload className="size-3.5" />
            {uploadTemplate.isPending ? "Uploading..." : "Upload template"}
          </Button>
        </div>
      )}
    </div>
  );
}
