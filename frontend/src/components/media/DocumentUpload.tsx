"use client";

import { useState, useRef } from "react";
import {
  FileText,
  FileCheck,
  Lock,
  Upload,
  Download,
  Trash2,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { uploadMediaFile, deleteMediaFile, getSignedDocumentUrl, MediaFolder } from "@/lib/media";
import { cn } from "@/lib/utils";

export interface AttachedDocument {
  id: string;
  publicId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  isPrivate: boolean;
  secureUrl?: string;
}

interface DocumentUploadProps {
  documents?: AttachedDocument[];
  organizationId: string;
  folder?: MediaFolder;
  relatedType?: "employee_doc" | "project_attachment";
  relatedId?: string;
  isPrivate?: boolean;
  maxFiles?: number;
  onUploadSuccess?: (doc: AttachedDocument) => void;
  onRemoveSuccess?: (docId: string) => void;
  disabled?: boolean;
}

export function DocumentUpload({
  documents = [],
  organizationId,
  folder = "hrms/documents",
  relatedType = "employee_doc",
  relatedId,
  isPrivate = true,
  maxFiles = 5,
  onUploadSuccess,
  onRemoveSuccess,
  disabled = false,
}: DocumentUploadProps) {
  const [docList, setDocList] = useState<AttachedDocument[]>(documents);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";
    setErrorMessage(null);

    // Max limit check
    if (docList.length >= maxFiles) {
      setErrorMessage(`Maximum limit of ${maxFiles} documents reached.`);
      return;
    }

    setUploading(true);
    setProgress(0);

    const result = await uploadMediaFile({
      file,
      folder,
      organizationId,
      relatedType,
      relatedId,
      isPrivate,
      onProgress: (p) => setProgress(p),
    });

    setUploading(false);

    if (result.success && result.data) {
      const newDoc: AttachedDocument = {
        id: result.data.id,
        publicId: result.data.publicId,
        fileName: result.data.fileName,
        fileSize: result.data.fileSize,
        mimeType: result.data.mimeType,
        isPrivate: result.data.isPrivate,
        secureUrl: result.data.secureUrl,
      };

      setDocList((prev) => [...prev, newDoc]);
      onUploadSuccess?.(newDoc);
    } else {
      setErrorMessage(result.error || "Failed to upload document");
    }
  };

  const handleDownload = async (doc: AttachedDocument) => {
    setDownloadingId(doc.id);
    try {
      if (doc.isPrivate) {
        // Fetch time-limited signed URL
        const res = await getSignedDocumentUrl(doc.id, organizationId, 3600);
        if (res.success && res.signedUrl) {
          window.open(res.signedUrl, "_blank");
        } else {
          setErrorMessage(res.error || "Failed to generate signed download link");
        }
      } else if (doc.secureUrl) {
        window.open(doc.secureUrl, "_blank");
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRemove = async (docId: string, publicId: string) => {
    if (disabled) return;
    const res = await deleteMediaFile(docId, organizationId);
    if (res.success) {
      setDocList((prev) => prev.filter((d) => d.id !== docId));
      onRemoveSuccess?.(docId);
    } else {
      setErrorMessage(res.error || "Failed to delete document");
    }
  };

  return (
    <div className="space-y-3">
      {/* Upload Action Card */}
      {docList.length < maxFiles && (
        <div
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
          className={cn(
            "rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-center cursor-pointer transition-all hover:border-blue-400 hover:bg-blue-50/20",
            disabled && "opacity-50 cursor-not-allowed pointer-events-none"
          )}
        >
          {uploading ? (
            <div className="flex flex-col items-center justify-center py-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600 mb-1.5" />
              <span className="text-xs font-semibold text-slate-800">
                Encrypting & Uploading Document...
              </span>
              <div className="w-44 bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 font-mono mt-1">{progress}%</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Upload className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-700">
                Upload Document (PDF, DOCX, XLSX, max 15MB)
              </span>
              {isPrivate && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <Lock className="w-2.5 h-2.5" />
                  Private
                </span>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip"
            className="hidden"
            onChange={handleFileChange}
            disabled={disabled || uploading}
          />
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="text-xs text-rose-600 flex items-center gap-1.5 bg-rose-50 border border-rose-200 p-2 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Attached Documents List */}
      {docList.length > 0 && (
        <div className="space-y-1.5">
          {docList.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50/60 transition-colors text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-slate-900 truncate">
                    {doc.fileName}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span>{formatFileSize(doc.fileSize)}</span>
                    {doc.isPrivate && (
                      <span className="inline-flex items-center gap-0.5 text-amber-600 font-semibold">
                        <Lock className="w-3 h-3" />
                        Confidential
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownload(doc)}
                  disabled={downloadingId === doc.id}
                  title={doc.isPrivate ? "Generate signed download link" : "Download file"}
                  className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  {downloadingId === doc.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  ) : (
                    <ExternalLink className="w-3.5 h-3.5" />
                  )}
                </button>

                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemove(doc.id, doc.publicId)}
                    title="Delete document"
                    className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
