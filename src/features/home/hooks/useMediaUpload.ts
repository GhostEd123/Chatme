import { apiRequest, ApiException } from "@/core/lib/apiClient";
import type { MessageAttachment } from "@/features/home/hooks/useMessages";

// ── API contract (GET /v1/docs) ──────────────────────────────────────────────

export const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "audio/aac",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/x-wav",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
] as const;

const MiB = 1024 * 1024;
const MAX_BYTES: Record<MessageAttachment["type"], number> = {
  image: 5 * MiB,
  audio: 20 * MiB,
  video: 50 * MiB,
  document: 25 * MiB,
};

export interface MediaAsset {
  id: string;
  purpose: "profile_avatar" | "group_avatar" | "message_attachment";
  status: "pending" | "ready" | "failed" | "deleted";
  type: MessageAttachment["type"];
  contentType: string;
  sizeBytes: number;
  originalFilename?: string | null;
  secureUrl?: string | null;
}

interface CreateMediaUploadResponse {
  media: MediaAsset;
  /** Null when this clientUploadId already belongs to a completed asset. */
  upload: {
    url: string;
    method: "POST";
    expiresAt: string;
    fields: Record<string, string | number>;
  } | null;
}

export class MediaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaValidationError";
  }
}

/** Map a MIME type to the attachment category the API uses. */
export function attachmentTypeFor(contentType: string): MessageAttachment["type"] {
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("audio/")) return "audio";
  if (contentType.startsWith("video/")) return "video";
  return "document";
}

/** Client-side validation mirroring the server's limits — fail fast, clearly. */
export function validateAttachment(contentType: string, sizeBytes: number): void {
  if (!(ALLOWED_CONTENT_TYPES as readonly string[]).includes(contentType)) {
    throw new MediaValidationError(
      `This file type (${contentType || "unknown"}) can't be sent. Use JPEG/PNG/WebP images, MP4/MOV videos, common audio, PDF, TXT or Office documents.`
    );
  }
  const type = attachmentTypeFor(contentType);
  if (sizeBytes > MAX_BYTES[type]) {
    throw new MediaValidationError(
      `This ${type} is too large (max ${MAX_BYTES[type] / MiB} MB).`
    );
  }
}

// ── Steps ─────────────────────────────────────────────────────────────────────

/** Step 1 — ask our API to authorise a signed Cloudinary upload. */
export function createMediaUpload(params: {
  clientUploadId: string;
  contentType: string;
  sizeBytes: number;
  originalFilename?: string;
}): Promise<CreateMediaUploadResponse> {
  return apiRequest<CreateMediaUploadResponse>("/media/uploads", {
    method: "POST",
    body: {
      clientUploadId: params.clientUploadId,
      purpose: "message_attachment",
      contentType: params.contentType,
      sizeBytes: params.sizeBytes,
      originalFilename: params.originalFilename?.slice(0, 255),
    },
  });
}

/**
 * Step 2 — send the bytes directly to Cloudinary: every returned field plus
 * the file, as multipart/form-data. No API secret ever touches the app.
 */
export function uploadToCloudinary(
  upload: NonNullable<CreateMediaUploadResponse["upload"]>,
  file: { uri: string; contentType: string; fileName: string },
  onProgress?: (fraction: number) => void
): Promise<void> {
  const form = new FormData();
  Object.entries(upload.fields).forEach(([k, v]) => form.append(k, String(v)));
  form.append("file", {
    uri: file.uri,
    type: file.contentType,
    name: file.fileName,
  } as unknown as Blob);

  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (onProgress && e.lengthComputable && e.total > 0) onProgress(e.loaded / e.total);
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`The file upload failed (HTTP ${xhr.status}).`));
    xhr.onerror = () => reject(new Error("The file upload failed — check your connection."));
    xhr.ontimeout = () => reject(new Error("The file upload timed out."));
    xhr.timeout = 5 * 60_000;
    xhr.open(upload.method ?? "POST", upload.url);
    xhr.send(form);
  });
}

/** Step 3 — ask our API to verify the Cloudinary object and mark it ready. */
export function completeMediaUpload(mediaId: string): Promise<MediaAsset> {
  return apiRequest<MediaAsset>(`/media/uploads/${mediaId}/complete`, {
    method: "POST",
  });
}

/**
 * Runs steps 1–3 and returns the verified (ready) media asset.
 * Idempotent per `clientUploadId`: if the same key already completed, the API
 * returns `upload: null` and we go straight to the ready asset.
 */
export async function uploadAttachment(
  params: {
    clientUploadId: string;
    uri: string;
    contentType: string;
    sizeBytes: number;
    fileName: string;
  },
  onProgress?: (fraction: number) => void
): Promise<MediaAsset> {
  const created = await createMediaUpload({
    clientUploadId: params.clientUploadId,
    contentType: params.contentType,
    sizeBytes: params.sizeBytes,
    originalFilename: params.fileName,
  });

  if (created.media.status === "ready" && !created.upload) {
    onProgress?.(1);
    return created.media;
  }
  if (!created.upload) {
    throw new Error("The server did not return upload authorization.");
  }

  await uploadToCloudinary(
    created.upload,
    { uri: params.uri, contentType: params.contentType, fileName: params.fileName },
    onProgress
  );

  const ready = await completeMediaUpload(created.media.id);
  if (ready.status !== "ready") {
    throw new Error("The upload could not be verified. Please try again.");
  }
  return ready;
}

/** True when an upload-step error means the clientUploadId can't be reused. */
export function isUploadKeyExhausted(err: unknown): boolean {
  return err instanceof ApiException && (err.status === 409 || err.status === 410);
}
