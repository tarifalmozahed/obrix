import { Router } from "express";
import multer from "multer";
import { requireAuth, requireOrgContext } from "../middleware/auth.js";
import {
  uploadMedia,
  deleteMedia,
  getSignedUrl,
  listMedia,
} from "../controllers/media.controller.js";

const router = Router();

// Configure Multer with memory storage for zero-disk-leak streaming
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB maximum threshold
  },
});

// All media endpoints require authentication & organization context isolation
router.use(requireAuth);
router.use(requireOrgContext);

// 1. Upload media endpoint (single file field named 'file')
router.post("/upload", upload.single("file"), uploadMedia);

// 2. Delete media asset
router.delete("/:assetId", deleteMedia);

// 3. Generate signed, time-limited URL for confidential documents
router.get("/signed-url/:assetId", getSignedUrl);

// 4. List organization media assets
router.get("/", listMedia);

export { router as mediaRouter };
