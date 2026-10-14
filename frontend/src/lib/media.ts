import { createClient } from "./supabase";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export type MediaFolder =
  | "hrms/employees"
  | "hrms/documents"
  | "crm/contacts"
  | "projects/attachments"
  | "company/branding";

export interface UploadMediaOptions {
  file: File;
  folder: MediaFolder;
  organizationId: string;
  relatedType?: "employee" | "employee_doc" | "company_logo" | "crm_contact" | "project_attachment";
  relatedId?: string;
  isPrivate?: boolean;
  onProgress?: (percent: number) => void;
}

export interface UploadMediaResponse {
  id: string;
  publicId: string;
  secureUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  folder: string;
  isPrivate: boolean;
  relatedType?: string;
  relatedId?: string;
  createdAt: string;
}

/**
 * Uploads a file to Cloudinary through the secure backend endpoint with progress tracking
 */
export async function uploadMediaFile(
  options: UploadMediaOptions
): Promise<{ success: boolean; data?: UploadMediaResponse; error?: string }> {
  const {
    file,
    folder,
    organizationId,
    relatedType,
    relatedId,
    isPrivate = false,
    onProgress,
  } = options;

  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  if (relatedType) formData.append("relatedType", relatedType);
  if (relatedId) formData.append("relatedId", relatedId);
  if (isPrivate) formData.append("isPrivate", "true");

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}/media/upload`);

    // Set authorization & tenant headers
    if (session?.access_token) {
      xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
    }
    if (organizationId) {
      xhr.setRequestHeader("x-organization-id", organizationId);
    }

    // Upload progress listener
    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      try {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && response.success) {
          resolve({ success: true, data: response.data });
        } else {
          resolve({
            success: false,
            error: response.error?.message || "File upload failed",
          });
        }
      } catch {
        resolve({
          success: false,
          error: `Upload failed with status code ${xhr.status}`,
        });
      }
    };

    xhr.onerror = () => {
      resolve({
        success: false,
        error: "Network error during media upload",
      });
    };

    xhr.send(formData);
  });
}

/**
 * Deletes a media asset safely from Cloudinary and Supabase
 */
export async function deleteMediaFile(
  assetId: string,
  organizationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  try {
    const res = await fetch(`${API_BASE_URL}/media/${assetId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session?.access_token || ""}`,
        "x-organization-id": organizationId,
      },
    });

    const data = await res.json();
    return {
      success: res.ok && data.success,
      error: data.error?.message,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete file",
    };
  }
}

/**
 * Generates a signed, time-limited URL for confidential documents
 */
export async function getSignedDocumentUrl(
  assetId: string,
  organizationId: string,
  expiresInSeconds: number = 3600
): Promise<{ success: boolean; signedUrl?: string; error?: string }> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  try {
    const res = await fetch(
      `${API_BASE_URL}/media/signed-url/${assetId}?expiresIn=${expiresInSeconds}`,
      {
        headers: {
          Authorization: `Bearer ${session?.access_token || ""}`,
          "x-organization-id": organizationId,
        },
      }
    );

    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, signedUrl: data.data.signedUrl };
    }
    return { success: false, error: data.error?.message || "Failed to generate signed URL" };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error generating signed URL",
    };
  }
}
