import { Request, Response, NextFunction } from "express";
import {
  AllowedFolder,
  validateUploadFile,
  uploadToCloudinary,
  deleteFromCloudinary,
  generateSignedDocumentUrl,
  FOLDER_RULES,
} from "../services/cloudinary.service.js";

/**
 * Handle multipart file upload to Cloudinary & register in Supabase
 */
export async function uploadMedia(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({
        success: false,
        error: { message: "No file uploaded. Please attach a file." },
      });
      return;
    }

    const orgId = req.organization!.id;
    const userId = req.user!.id;
    const folder = (req.body.folder || "projects/attachments") as AllowedFolder;
    const relatedType = req.body.relatedType as string | undefined;
    const relatedId = req.body.relatedId as string | undefined;

    // Check if the folder explicitly sets privacy or if user requested it
    const requestedPrivate = req.body.isPrivate === "true" || req.body.isPrivate === true;
    const isPrivate = requestedPrivate || (FOLDER_RULES[folder]?.defaultPrivate ?? false);

    // Validate file against folder policy
    const validation = validateUploadFile(file, folder);
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: { message: validation.error },
      });
      return;
    }

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary({
      buffer: file.buffer,
      filename: file.originalname,
      mimetype: file.mimetype,
      folder,
      orgId,
      isPrivate,
    });

    // Save record in Supabase media_assets table
    const supabase = req.supabase!;
    const { data: assetRecord, error: dbError } = await supabase
      .from("media_assets")
      .insert({
        organization_id: orgId,
        uploaded_by: userId,
        public_id: uploadResult.publicId,
        secure_url: uploadResult.secureUrl,
        file_name: uploadResult.fileName,
        file_size: uploadResult.fileSize,
        mime_type: uploadResult.mimeType,
        resource_type: uploadResult.resourceType,
        folder,
        is_private: isPrivate,
        related_type: relatedType || null,
        related_id: relatedId || null,
        metadata: {
          width: uploadResult.width,
          height: uploadResult.height,
          format: uploadResult.format,
        },
      })
      .select()
      .single();

    if (dbError) {
      console.error("Failed to insert media_assets record in Supabase:", dbError);
      // Clean up Cloudinary asset if DB insert fails
      await deleteFromCloudinary(uploadResult.publicId, uploadResult.resourceType, isPrivate);
      res.status(500).json({
        success: false,
        error: { message: `Database error: ${dbError.message}` },
      });
      return;
    }

    // If this is an employee avatar, automatically update employee record
    if (relatedType === "employee" && relatedId) {
      await supabase
        .from("employees")
        .update({
          avatar_url: uploadResult.secureUrl,
          avatar_public_id: uploadResult.publicId,
        })
        .eq("id", relatedId)
        .eq("organization_id", orgId);
    }

    // If this is a company logo, update organization record
    if (relatedType === "company_logo") {
      await supabase
        .from("organizations")
        .update({
          logo_url: uploadResult.secureUrl,
          logo_public_id: uploadResult.publicId,
        })
        .eq("id", orgId);
    }

    res.status(201).json({
      success: true,
      data: {
        id: assetRecord.id,
        publicId: uploadResult.publicId,
        secureUrl: uploadResult.secureUrl,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
        mimeType: uploadResult.mimeType,
        folder,
        isPrivate,
        relatedType,
        relatedId,
        createdAt: assetRecord.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete a media asset from both Cloudinary and Supabase
 */
export async function deleteMedia(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const orgId = req.organization!.id;
    const { assetId } = req.params;
    const supabase = req.supabase!;

    // Find the asset record
    const { data: asset, error: fetchError } = await supabase
      .from("media_assets")
      .select("*")
      .eq("id", assetId)
      .eq("organization_id", orgId)
      .single();

    if (fetchError || !asset) {
      res.status(404).json({
        success: false,
        error: { message: "Media asset not found" },
      });
      return;
    }

    // Delete from Cloudinary
    await deleteFromCloudinary(
      asset.public_id,
      asset.resource_type as "image" | "raw" | "video",
      asset.is_private
    );

    // Delete from Supabase
    const { error: deleteError } = await supabase
      .from("media_assets")
      .delete()
      .eq("id", assetId)
      .eq("organization_id", orgId);

    if (deleteError) {
      res.status(500).json({
        success: false,
        error: { message: deleteError.message },
      });
      return;
    }

    // Clean up employee avatar if applicable
    if (asset.related_type === "employee" && asset.related_id) {
      await supabase
        .from("employees")
        .update({ avatar_url: null, avatar_public_id: null })
        .eq("id", asset.related_id)
        .eq("avatar_public_id", asset.public_id);
    }

    res.json({
      success: true,
      data: { message: "Asset deleted successfully", id: assetId },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Generate a secure signed URL for confidential/private documents
 */
export async function getSignedUrl(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const orgId = req.organization!.id;
    const { assetId } = req.params;
    const expiresIn = parseInt((req.query.expiresIn as string) || "3600", 10);
    const supabase = req.supabase!;

    // Find asset
    const { data: asset, error: fetchError } = await supabase
      .from("media_assets")
      .select("*")
      .eq("id", assetId)
      .eq("organization_id", orgId)
      .single();

    if (fetchError || !asset) {
      res.status(404).json({
        success: false,
        error: { message: "Media asset not found" },
      });
      return;
    }

    // If asset is not private, return secureUrl directly
    if (!asset.is_private) {
      res.json({
        success: true,
        data: {
          signedUrl: asset.secure_url,
          isPrivate: false,
          expiresAt: null,
        },
      });
      return;
    }

    // Generate signed, time-limited URL for private document
    const format = asset.metadata?.format || asset.file_name.split(".").pop() || "pdf";
    const signedUrl = generateSignedDocumentUrl(asset.public_id, format, expiresIn);

    res.json({
      success: true,
      data: {
        signedUrl,
        isPrivate: true,
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * List media assets for organization
 */
export async function listMedia(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const orgId = req.organization!.id;
    const { folder, relatedType, relatedId } = req.query;
    const supabase = req.supabase!;

    let query = supabase
      .from("media_assets")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (folder) {
      query = query.eq("folder", folder);
    }
    if (relatedType) {
      query = query.eq("related_type", relatedType);
    }
    if (relatedId) {
      query = query.eq("related_id", relatedId);
    }

    const { data: assets, error } = await query;

    if (error) {
      res.status(500).json({
        success: false,
        error: { message: error.message },
      });
      return;
    }

    res.json({
      success: true,
      data: assets || [],
    });
  } catch (err) {
    next(err);
  }
}
