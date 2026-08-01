// ─── Cloudinary Upload Helper ──────────────────────────────────────────────────
// Uses unsigned preset upload to Cloudinary's API.
// Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in your .env.local file.
// Set NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in your .env.local file.

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "demo";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "";
const MAX_FILE_SIZE_MB = 5;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "application/pdf"];

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface UploadResult {
  url: string;
  secure_url: string;
  public_id: string;
}

// ─── Upload a single image to Cloudinary ───────────────────────────────────────

export async function uploadToCloudinary(
  file: File
): Promise<UploadResult> {
  // Validate
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error(
      `Unsupported file type "${file.type}". Accepted: JPEG, PNG, WebP, AVIF, PDF.`
    );
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new Error(
      `File too large (max ${MAX_FILE_SIZE_MB}MB).`
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      (errBody as any).error?.message || "Cloudinary upload failed."
    );
  }

  const data = await res.json();
  return {
    url: data.url,
    secure_url: data.secure_url,
    public_id: data.public_id,
  };
}

// ─── Upload a video to Cloudinary (uses /video/upload endpoint) ────────────────

export async function uploadVideoToCloudinary(
  file: File | Blob
): Promise<UploadResult> {
  const formData = new FormData();
  const filename = file instanceof File ? file.name : "kyc-video.webm";
  formData.append("file", file, filename);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      (errBody as any).error?.message || "Cloudinary video upload failed."
    );
  }

  const data = await res.json();
  return {
    url: data.url,
    secure_url: data.secure_url,
    public_id: data.public_id,
  };
}

// ─── Upload multiple files (max N) ─────────────────────────────────────────────

export async function uploadMultipleToCloudinary(
  files: File[],
  maxCount: number = 5
): Promise<UploadResult[]> {
  if (files.length > maxCount) {
    throw new Error(`Maximum ${maxCount} files allowed.`);
  }

  const results: UploadResult[] = [];
  for (const file of files) {
    const result = await uploadToCloudinary(file);
    results.push(result);
  }
  return results;
}

// ─── Get a public Cloudinary URL with transformations ─────────────────────────

export function getCloudinaryUrl(
  publicId: string,
  options?: { width?: number; height?: number; quality?: number }
): string {
  const { width = 400, height = 300, quality = 80 } = options || {};
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/c_fill,w_${width},h_${height},q_${quality}/${publicId}`;
}
