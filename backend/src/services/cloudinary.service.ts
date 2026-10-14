import { Readable } from "stream";
import { UploadApiResponse, UploadApiOptions } from "cloudinary";
import { cloudinary } from "../config/cloudinary.js";

export type AllowedFolder =
  | "hrms/employees"
  | "hrms/documents"
  | "crm/contacts"
  | "projects/attachments"
  | "company/branding";

export interface UploadOptions {
  buffer: Buffer;
  filename: string;
  mimetype: string;
  folder: AllowedFolder;
  orgId: string;
  isPrivate?: boolean;
  transformation?: UploadApiOptions["transformation"];
}

export interface UploadResult {
  publicId: string;
  secureUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  resourceType: "image" | "raw" | "video";
  format: string;
  width?: number;
  height?: number;
  isPrivate: boolean;
}

// Module validation rules
export const FOLDER_RULES: Record<
  AllowedFolder,
  {
    maxSizeBytes: number;
    allowedMimeTypes: string[];
    defaultPrivate: boolean;
  }
> = {
  "hrms/employees": {
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    defaultPrivate: false,
  },
  "hrms/documents": {
    maxSizeBytes: 15 * 1024 * 1024, // 15MB
    allowedMimeTypes: [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    defaultPrivate: true, // Confidential employee documents are private by default
  },
  "crm/contacts": {
    maxSizeBytes: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    defaultPrivate: false,
  },
  "projects/attachments": {
    maxSizeBytes: 20 * 1024 * 1024,
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/svg+xml",
      "application/pdf",
      "application/zip",
      "text/plain",
      "text/csv",
    ],
    defaultPrivate: false,
  },
  "company/branding": {
    maxSizeBytes: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
    defaultPrivate: false,
  },
};

/**
 * Validates a file against module-specific folder rules
 */
export function validateUploadFile(
  file: Express.Multer.File,
  folder: AllowedFolder
): { valid: boolean; error?: string } {
  const rules = FOLDER_RULES[folder];
  if (!rules) {
    return { valid: false, error: `Invalid folder target: ${folder}` };
  }

  if (file.size > rules.maxSizeBytes) {
    const maxMb = Math.round(rules.maxSizeBytes / (1024 * 1024));
    return {
      valid: false,
      error: `File size exceeds the allowed limit of ${maxMb}MB for ${folder}`,
    };
  }

  if (!rules.allowedMimeTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: `File type '${file.mimetype}' is not permitted for folder '${folder}'. Allowed types: ${rules.allowedMimeTypes.join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Uploads a buffer to Cloudinary via streaming
 */
export async function uploadToCloudinary(options: UploadOptions): Promise<UploadResult> {
  const { buffer, filename, mimetype, folder, orgId, isPrivate = false } = options;

  // Resource type determination
  const isImage = mimetype.startsWith("image/");
  const isVideo = mimetype.startsWith("video/");
  const resourceType = isImage ? "image" : isVideo ? "video" : "raw";

  // Sanitize filename for public_id
  const cleanName = filename
    .replace(/\.[^/.]+$/, "") // strip extension
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .substring(0, 50);

  // Structured organizational folder path: orbix/{orgId}/{folder}
  const fullFolderPath = `orbix/${orgId}/${folder}`;

  const uploadOptions: UploadApiOptions = {
    folder: fullFolderPath,
    resource_type: resourceType,
    // Access control: 'authenticated' for private docs, 'upload' for public assets
    type: isPrivate ? "authenticated" : "upload",
    use_filename: false,
    unique_filename: true,
    overwrite: true,
  };

  // Image optimizations
  if (isImage) {
    uploadOptions.quality = "auto";
    uploadOptions.fetch_format = "auto";
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error?: Error, result?: UploadApiResponse) => {
        if (error || !result) {
          return reject(error || new Error("Cloudinary upload failed with empty response"));
        }

        resolve({
          publicId: result.public_id,
          secureUrl: result.secure_url,
          fileName: filename,
          fileSize: result.bytes || buffer.length,
          mimeType: mimetype,
          resourceType,
          format: result.format || mimetype.split("/")[1] || "bin",
          width: result.width,
          height: result.height,
          isPrivate,
        });
      }
    );

    // Stream buffer into upload stream
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
}

/**
 * Deletes an asset from Cloudinary
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: "image" | "raw" | "video" = "image",
  isPrivate = false
): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      type: isPrivate ? "authenticated" : "upload",
      invalidate: true,
    });
    return result.result === "ok" || result.result === "not found";
  } catch (err) {
    console.error("Error deleting asset from Cloudinary:", err);
    return false;
  }
}

/**
 * Generates a signed, time-limited download URL for private confidential documents
 * @param publicId Cloudinary public_id of the private asset
 * @param format Format extension (e.g. 'pdf')
 * @param expiresInSeconds Duration in seconds before URL expires (default: 3600 = 1 hour)
 */
export function generateSignedDocumentUrl(
  publicId: string,
  format: string = "pdf",
  expiresInSeconds: number = 3600
): string {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  // Generate authenticated signed URL with expiration
  return cloudinary.utils.private_download_url(publicId, format, {
    expires_at: expiresAt,
    resource_type: "raw",
    type: "authenticated",
  });
}
