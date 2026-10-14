"use client";

import { useState, useRef } from "react";
import { Camera, Loader2, X, AlertCircle } from "lucide-react";
import { uploadMediaFile, deleteMediaFile, MediaFolder } from "@/lib/media";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
  currentUrl?: string | null;
  currentPublicId?: string | null;
  name?: string;
  organizationId: string;
  folder?: MediaFolder;
  relatedType?: "employee" | "crm_contact";
  relatedId?: string;
  size?: number; // width & height in px
  onUploadSuccess?: (url: string, publicId: string) => void;
  onRemove?: () => void;
  disabled?: boolean;
}

export function AvatarUpload({
  currentUrl,
  currentPublicId,
  name = "User",
  organizationId,
  folder = "hrms/employees",
  relatedType = "employee",
  relatedId,
  size = 80,
  onUploadSuccess,
  onRemove,
  disabled = false,
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input
    e.target.value = "";
    setErrorMessage(null);

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Image must be smaller than 5MB");
      return;
    }

    // Validate type
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select an image file (JPEG, PNG, WebP)");
      return;
    }

    // Local instant preview
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
      setErrorMessage(result.error || "Failed to upload avatar");
      // Revert preview on failure
      setPreview(currentUrl || null);
    }
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
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          "relative group rounded-full overflow-hidden border-2 border-slate-200/80 bg-slate-100 flex items-center justify-center cursor-pointer shadow-xs transition-all hover:border-blue-500",
          disabled && "opacity-60 cursor-not-allowed pointer-events-none"
        )}
        style={{ width: size, height: size }}
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
      >
        {/* Avatar Image or Initials */}
        {preview ? (
          <img
            src={preview}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-slate-600 font-bold text-base font-heading">
            {initials}
          </span>
        )}

        {/* Hover Camera Overlay */}
        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
          <Camera className="w-5 h-5 mb-0.5" />
          <span className="text-[9px] font-semibold uppercase tracking-wider">Change</span>
        </div>

        {/* Uploading Progress Overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white z-10">
            <Loader2 className="w-5 h-5 animate-spin mb-1 text-blue-400" />
            <span className="text-[10px] font-bold font-mono">{progress}%</span>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled || uploading}
        />
      </div>

      {/* Remove Button */}
      {preview && !disabled && !uploading && (
        <button
          type="button"
          onClick={handleRemove}
          className="text-[11px] text-slate-400 hover:text-rose-600 font-medium flex items-center gap-1 transition-colors"
        >
          <X className="w-3 h-3" />
          <span>Remove picture</span>
        </button>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="text-[11px] text-rose-600 flex items-center gap-1 mt-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
