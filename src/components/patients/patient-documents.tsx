"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/format";
import type { Role } from "@/lib/types/database";

interface DocFile {
  name: string;
  created_at: string;
  size: number;
}

export function PatientDocuments({ patientId, role }: { patientId: string; role: Role }) {
  const [files, setFiles] = useState<DocFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.storage.from("patient-documents").list(patientId, {
      sortBy: { column: "created_at", order: "desc" },
    });
    setFiles(
      (data ?? [])
        .filter((f) => f.id)
        .map((f) => ({
          name: f.name,
          created_at: f.created_at ?? "",
          size: f.metadata?.size ?? 0,
        }))
    );
    setLoading(false);
  }, [patientId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleUpload(file: File) {
    setUploading(true);
    const supabase = createClient();
    await supabase.storage
      .from("patient-documents")
      .upload(`${patientId}/${Date.now()}-${file.name}`, file, { upsert: false });
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    refresh();
  }

  async function handleOpen(name: string) {
    const supabase = createClient();
    const { data } = await supabase.storage
      .from("patient-documents")
      .createSignedUrl(`${patientId}/${name}`, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  async function handleDelete(name: string) {
    const supabase = createClient();
    await supabase.storage.from("patient-documents").remove([`${patientId}/${name}`]);
    refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
          }}
        />
        <Button size="sm" variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
          Upload document
        </Button>
      </div>

      {loading ? null : files.length === 0 ? (
        <EmptyState icon={FileText} title="No documents uploaded" />
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {files.map((file) => (
            <li key={file.name} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <button
                onClick={() => handleOpen(file.name)}
                className="flex min-w-0 flex-1 items-center gap-2.5 text-left text-sm hover:underline"
              >
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{file.name.replace(/^\d+-/, "")}</span>
              </button>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatDate(file.created_at || new Date())}
              </span>
              {role === "admin" && (
                <button
                  onClick={() => handleDelete(file.name)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
