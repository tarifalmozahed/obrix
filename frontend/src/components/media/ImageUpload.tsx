"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, Image as ImageIcon, AlertCircle, Check } from "lucide-react";
import { uploadMediaFile, deleteMediaFile, MediaFolder } from "@/lib/media";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  currentUrl?: string | null;
  currentPublicId?: string | null;
  label?: string;
  description?: string;
  organizationId: string;
  folder: MediaFolder;
  relatedType?: "company_logo" | "crm_contact" | "project_attachment";
  relatedId?: string;
  aspectRatio?: "square" | "video" | "banner";
  maxSizeMb?: number;
  onUploadSuccess?: (url: string, publicId: string) => void;
  onRemove?: () => void;
  disabled?: boolean;
}

export function ImageUpload({
  currentUrl,
  currentPublicId,
  label = "Upload Image",
  description = "PNG, JPG, WebP up to 5MB",
  organizationId,
  folder,
  relatedType,
  relatedId,
  aspectRatio = "video",
  maxSizeMb = 5,
  onUploadSuccess,
  onRemove,
  disabled = false,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectClasses = {
    square: "aspect-square max-w-[200px]",
    video: "aspect-video max-w-md",
    banner: "aspect-[3/1] w-full",
  };

  const processFile = async (file: File) => {
    setErrorMessage(null);

    // Validate size
    if (file.size > maxSizeMb * 1024 * 1024) {
      setErrorMessage(`File exceeds ${maxSizeMb}MB maximum limit.`);
      return;
    }

    // Validate mime
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Only image files (JPEG, PNG, WebP, GIF) are supported.");
      return;
    }

    // Local preview
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    setUploading(true);
    setProgress(0);

    const result = await uploadMediaFile({
      file,
      folder,
      organizationId,
      relatedType,
      relatedId,
      isPrivate: false,
      onProgress: (p) => setProgress(p),
    });

    setUploading(false);

    if (result.success && result.data) {
      setPreview(result.data.secureUrl);
      onUploadSuccess?.(result.data.secureUrl, result.data.publicId);
    } else {
      setErrorMessage(result.error || "Image upload failed");
      setPreview(currentUrl || null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || uploading) return;

    if (currentPublicId) {
      await deleteMediaFile(currentPublicId, organizationId);
    }

    setPreview(null);
    onRemove?.();
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-semibold text-slate-700">
          {label}
        </label>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        className={cn(
          "relative rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-4 overflow-hidden",
          aspectClasses[aspectRatio],
          isDragOver
            ? "border-blue-500 bg-blue-50/50"
            : preview
            ? "border-slate-200 bg-slate-50"
            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 bg-white",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none"
        )}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Uploaded preview"
              className="w-full h-full object-contain"
            />
            {/* Delete / Replace Buttons */}
            <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20">
              <button
                type="button"
                onClick={handleRemove}
                title="Remove image"
                className="p-1 rounded-full bg-slate-900/70 text-white hover:bg-rose-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        ) : (
          <div className="text-center p-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mx-auto mb-2">
              <Upload className="w-5 h-5 text-slate-600" />
            </div>
            <p className="text-xs font-semibold text-slate-800">
              Click to upload or drag & drop
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>
          </div>
        )}

        {/* Progress Bar Overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20 p-4">
            <Loader2 className="w-6 h-6 animate-spin mb-2 text-blue-400" />
            <span className="text-xs font-semibold">Uploading to Cloudinary...</span>
            <div className="w-48 bg-slate-700 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] font-mono mt-1">{progress}%</span>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) processFile(file);
            e.target.value = "";
          }}
          disabled={disabled || uploading}
        />
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="text-xs text-rose-600 flex items-center gap-1.5 bg-rose-50 border border-rose-200 p-2 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
