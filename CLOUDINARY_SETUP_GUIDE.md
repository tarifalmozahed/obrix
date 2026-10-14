# Cloudinary Media Management Setup & Integration Guide

This guide documents the enterprise Cloudinary media architecture integrated into **Orbix**. It adheres to strict security standards: Cloudinary API secrets are **never** exposed to client-side code, file binaries are **not** stored in Supabase tables, and confidential employee documents receive **signed, time-limited access control**.

---

## 1. Cloudinary Credentials & Environment Variables

### A. Backend Configuration (`backend/.env`)
All Cloudinary API operations (uploading, signing URLs, transforming, deleting) happen on the Express backend.

```env
# Cloudinary Server-Only Configuration
CLOUDINARY_CLOUD_NAME=gjn4majk
CLOUDINARY_API_KEY=117432279288263
CLOUDINARY_API_SECRET=AaKPFxmNzPk9s6RqEq1zccdEzj8
CLOUDINARY_URL=cloudinary://117432279288263:AaKPFxmNzPk9s6RqEq1zccdEzj8@gjn4majk
```

> **Security Reminder**: Never add `NEXT_PUBLIC_` prefixes to Cloudinary API Secret. Keep the secret exclusively in `backend/.env`.

### B. Frontend Configuration (`frontend/.env.local`)
The Next.js frontend only needs the public backend API URL and Supabase public keys:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ufkozzlxzfhleiqklyjb.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_286vN52b1ksNmlbKxVJbuw_Yqc5e7S7
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 2. Installed Packages

The official Cloudinary SDK and Multer (memory streaming) are installed in the backend:

```bash
cd backend
npm install cloudinary multer
npm install -D @types/multer
```

- **`cloudinary`**: Official Cloudinary v2 Node.js SDK.
- **`multer`**: In-memory streaming middleware (`multer.memoryStorage()`) ensuring temporary files never leak onto the server's disk.

---

## 3. Database Schema & Supabase RLS Migration

Database migration file:  
[`supabase/migrations/20261014000005_media_assets.sql`](supabase/migrations/20261014000005_media_assets.sql)

### Table: `public.media_assets`
Stores asset metadata and relationship mappings without storing heavy file binaries in Postgres:

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID PRIMARY KEY` | Internal unique asset record ID |
| `organization_id` | `UUID NOT NULL` | Multi-tenant tenant isolation key |
| `uploaded_by` | `UUID REFERENCES profiles` | Uploader profile reference |
| `public_id` | `TEXT NOT NULL` | Cloudinary asset public ID |
| `secure_url` | `TEXT NOT NULL` | HTTPS delivery URL |
| `file_name` | `TEXT NOT NULL` | Original uploaded file name |
| `file_size` | `INTEGER NOT NULL` | File size in bytes |
| `mime_type` | `TEXT NOT NULL` | MIME type (e.g., `image/png`, `application/pdf`) |
| `resource_type` | `TEXT NOT NULL` | `'image'`, `'raw'`, or `'video'` |
| `folder` | `TEXT NOT NULL` | Target folder (e.g., `hrms/employees`, `hrms/documents`) |
| `is_private` | `BOOLEAN NOT NULL` | Flags confidential documents |
| `related_type` | `TEXT` | Entity type (`'employee'`, `'company_logo'`, etc.) |
| `related_id` | `UUID` | Associated foreign record UUID |

### Row-Level Security (RLS) Policies
- **`org_members_select_media`**:
  - Public assets (`is_private = false`) are viewable by any verified member of the organization.
  - Confidential documents (`is_private = true`) are strictly restricted to **Owners, Admins, HR Managers**, or the **specific user who uploaded the document**.
- **`org_members_insert_media`**: Authenticated members can insert records within their tenant.
- **`org_members_update_media`** & **`org_members_delete_media`**: Only asset owners or organization admins/managers can update or remove media.

To apply the migration using the Supabase CLI or SQL Editor:
```sql
-- Run the contents of supabase/migrations/20261014000005_media_assets.sql
```

---

## 4. Folder Hierarchy & Module Segregation

Cloudinary assets are segregated on the server under the organization namespace:  
`orbix/{organizationId}/{folder}`

| Folder Target | Supported File Types | Max Size | Access Model | Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **`hrms/employees`** | `JPEG, PNG, WebP, GIF` | 5 MB | Public / CDN | Employee avatars & profile pictures |
| **`hrms/documents`** | `PDF, DOCX, XLSX, Images` | 15 MB | **Confidential (Signed URL)** | Contracts, IDs, tax records, resumes |
| **`crm/contacts`** | `JPEG, PNG, WebP` | 5 MB | Public / CDN | Client and lead contact portraits |
| **`projects/attachments`** | `All Images, PDF, ZIP, TXT` | 20 MB | Public / CDN | Task deliverables & attachments |
| **`company/branding`** | `PNG, SVG, JPEG, WebP` | 5 MB | Public / CDN | Company logos, marks, and favicons |

---

## 5. Backend API Endpoints

All media routes require authentication (`Authorization: Bearer <token>`) and organization isolation (`x-organization-id: <orgId>`):

### 1. `POST /api/media/upload`
Uploads a file to Cloudinary and saves metadata to Supabase.
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `file`: Binary file
  - `folder`: One of `hrms/employees`, `hrms/documents`, `crm/contacts`, `projects/attachments`, `company/branding`
  - `relatedType` *(optional)*: `'employee'`, `'company_logo'`, `'employee_doc'`, etc.
  - `relatedId` *(optional)*: Record UUID
  - `isPrivate` *(optional)*: `true` or `false`
- **Response**:
```json
{
  "success": true,
  "data": {
    "id": "e81d76b1-4f1b-4cf7-9a4c-5d18d408eb76",
    "publicId": "orbix/c12.../hrms/employees/sarah_photo_123",
    "secureUrl": "https://res.cloudinary.com/gjn4majk/image/upload/v1.../orbix/...",
    "fileName": "avatar.png",
    "fileSize": 182400,
    "mimeType": "image/png",
    "isPrivate": false
  }
}
```

### 2. `DELETE /api/media/:assetId`
Safely destroys the asset in Cloudinary (`cloudinary.uploader.destroy`) and removes the record from Supabase.

### 3. `GET /api/media/signed-url/:assetId?expiresIn=3600`
Generates a time-limited signed URL for confidential documents (`is_private = true`) without exposing public URLs.

### 4. `GET /api/media?folder=hrms/employees&relatedId=<id>`
Lists all media assets associated with an organization or specific entity.

---

## 6. Frontend Reusable Components

The frontend provides modular components located in `frontend/src/components/media/`:

### A. `<AvatarUpload />`
Interactive circular profile picture uploader with live upload progress, instant preview, and remove button.
```tsx
import { AvatarUpload } from "@/components/media";

<AvatarUpload
  currentUrl={employee.avatar_url}
  name={`${employee.first_name} ${employee.last_name}`}
  organizationId={activeOrg.id}
  folder="hrms/employees"
  relatedType="employee"
  relatedId={employee.id}
  onUploadSuccess={(url, publicId) => console.log("Uploaded:", url)}
/>
```

### B. `<ImageUpload />`
Drag-and-drop image dropzone with aspect-ratio options (square, video, banner) for company branding and project covers.
```tsx
import { ImageUpload } from "@/components/media";

<ImageUpload
  currentUrl={activeOrg.logo_url}
  organizationId={activeOrg.id}
  folder="company/branding"
  relatedType="company_logo"
  relatedId={activeOrg.id}
  aspectRatio="square"
  onUploadSuccess={(url) => refreshUserData()}
/>
```

### C. `<DocumentUpload />`
Document uploader for confidential employee files (contracts, IDs, tax docs) or project deliverables with signed download access.
```tsx
import { DocumentUpload } from "@/components/media";

<DocumentUpload
  documents={existingDocs}
  organizationId={activeOrg.id}
  folder="hrms/documents"
  relatedType="employee_doc"
  relatedId={employee.id}
  isPrivate={true}
  onUploadSuccess={(newDoc) => console.log("Uploaded private doc:", newDoc)}
/>
```

---

## 7. How to Test the Integration

1. **Verify Backend Cloudinary Connection**:
   - Ensure `backend/.env` has `CLOUDINARY_CLOUD_NAME=gjn4majk`, `CLOUDINARY_API_KEY=...`, and `CLOUDINARY_API_SECRET=...`.
   - The backend server validates Cloudinary credentials on startup and pings Cloudinary API successfully (`status: 'ok'`).

2. **Test Employee Avatar Upload in HRMS**:
   - Navigate to `http://localhost:3000/hrms`
   - Click **`+ Add Staff`**
   - Click the profile photo placeholder circle to upload an image.
   - The file will stream to Cloudinary (`hrms/employees`), show live percentage progress, and display in the form and table directory!

3. **Test Company Branding Logo in Settings / Info**:
   - Navigate to `http://localhost:3000/dashboard`
   - Look at the **Organization Brand Logo** section in the Organization card.
   - Drag & drop a company mark or logo.
   - The asset uploads directly to Cloudinary (`company/branding`) and links to the organization.
