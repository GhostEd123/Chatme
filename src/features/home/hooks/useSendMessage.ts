import { apiRequest, ApiException, NetworkException } from "@/core/lib/apiClient";
import { getCurrentSessionGeneration } from "@/core/lib/session";
import { queryClient } from "@/core/lib/queryClient";
import { useAuthStore } from "@/features/auth/store/authStore";
import {
  useOutboxStore,
  type OutboxAttachment,
} from "@/features/home/store/outboxStore";
import {
  isUploadKeyExhausted,
  MediaValidationError,
  SessionMismatchError,
  uploadAttachment,
  validateAttachment,
} from "@/features/home/hooks/useMediaUpload";
import { upsertMessageInCache } from "../utils/messageReconcile";
import { generateUuid } from "@/shared/utils/uuid";
import type { Message } from "./useMessages";

/** Entries currently being processed — prevents double-sending on rapid taps. */
const inFlight = new Set<string>();

function describeError(err: unknown): string {
  if (err instanceof MediaValidationError) return err.message;
  if (err instanceof NetworkException) return "No connection — tap Retry to send.";
  if (err instanceof ApiException) {
    if (err.status >= 500) return "Server problem — tap Retry to send.";
    return err.message || `Couldn't send (HTTP ${err.status}).`;
  }
  return err instanceof Error ? err.message : "Couldn't send.";
}

/**
 * Process one outbox entry: upload its attachment (if not already verified),
 * then POST the message with its original clientMessageId.
 *
 * Safe to call repeatedly for the same entry: the API treats clientMessageId
 * as an idempotency key and replays the existing message, so a send whose
 * response was lost and is then retried yields exactly one message.
 */
async function processEntry(clientMessageId: string): Promise<void> {
  if (inFlight.has(clientMessageId)) return;
  const store = useOutboxStore.getState();
  const entry = store.entries[clientMessageId];
  if (!entry) return;

  // Capture the session this work belongs to. If the user logs out or another
  // account signs in while we're awaiting, we stop and touch nothing.
  const generation = getCurrentSessionGeneration();
  const { user } = useAuthStore.getState();
  if (!user || user.id !== entry.userId) return;
  const stillOurSession = () => getCurrentSessionGeneration() === generation;

  inFlight.add(clientMessageId);
  try {
    let attachment: OutboxAttachment | undefined = entry.attachment;

    // ── 1. Upload (skipped when a verified mediaId is already stored) ──────
    if (attachment && !attachment.mediaId) {
      store.update(clientMessageId, { status: "uploading", progress: 0, error: undefined });
      try {
        const ready = await uploadAttachment(
          {
            clientUploadId: attachment.clientUploadId,
            uri: attachment.localUri,
            contentType: attachment.contentType,
            sizeBytes: attachment.sizeBytes,
            fileName: attachment.fileName,
            transferComplete: attachment.transferComplete,
            mediaId: attachment.mediaId,
            initiatingGeneration: generation,
            onTransferComplete: (mediaId, secureUrl) => {
              if (stillOurSession()) {
                useOutboxStore.getState().updateAttachment(clientMessageId, {
                  transferComplete: true,
                  mediaId,
                  url: secureUrl,
                });
              }
            },
          },
          (p) => {
            if (stillOurSession()) useOutboxStore.getState().update(clientMessageId, { progress: p });
          }
        );
        if (!stillOurSession()) return;
        // Preserve the completed upload so a failed message send can retry
        // without uploading again.
        useOutboxStore.getState().updateAttachment(clientMessageId, {
          transferComplete: true,
          mediaId: ready.id,
          url: ready.secureUrl ?? undefined,
        });
        attachment = useOutboxStore.getState().entries[clientMessageId]?.attachment;
      } catch (err) {
        if (!stillOurSession() || err instanceof SessionMismatchError) return;
        if (isUploadKeyExhausted(err)) {
          // That upload authorisation expired / can't be reused — next retry
          // starts a fresh upload with a new idempotency key.
          useOutboxStore.getState().updateAttachment(clientMessageId, {
            clientUploadId: generateUuid(),
            transferComplete: false,
          });
        }
        useOutboxStore.getState().update(clientMessageId, {
          status: "failed",
          progress: undefined,
          error: `Upload failed: ${describeError(err)}`,
        });
        return;
      }
    }

    // ── 2. Submit the message referencing the verified media ID ──────────
    useOutboxStore.getState().update(clientMessageId, {
      status: "sending",
      progress: undefined,
      error: undefined,
    });

    const current = useOutboxStore.getState().entries[clientMessageId];
    if (!current) return; // removed meanwhile (e.g. socket echo reconciled it)

    const body: Record<string, unknown> = { clientMessageId };
    if (current.text) body.text = current.text;
    if (attachment?.mediaId) body.attachmentMediaIds = [attachment.mediaId];

    try {
      const serverMessage = await apiRequest<Message>(
        `/conversations/${current.conversationId}/messages`,
        { method: "POST", body }
      );
      if (!stillOurSession()) return;
      upsertMessageInCache(current.conversationId, serverMessage, current.userId);
      useOutboxStore.getState().remove(clientMessageId);
      queryClient.invalidateQueries({ queryKey: ["conversations", current.userId] });
    } catch (err) {
      if (!stillOurSession()) return;
      useOutboxStore.getState().update(clientMessageId, {
        status: "failed",
        error: describeError(err),
      });
    }
  } finally {
    inFlight.delete(clientMessageId);
  }
}

export interface PickedFile {
  uri: string;
  contentType: string;
  sizeBytes: number;
  fileName: string;
  type: OutboxAttachment["type"];
}

/**
 * Send API for the chat screen. All state lives in the persisted outbox, so
 * pending/failed messages (with their original clientMessageId, payload and
 * any completed upload) survive navigation and app restarts.
 */
export function useSendMessage() {
  const send = (input: {
    conversationId: string;
    text?: string;
    file?: PickedFile;
  }): string | null => {
    const user = useAuthStore.getState().user;
    const text = input.text?.trim() || null;
    if (!user || (!text && !input.file)) return null;

    if (input.file) {
      validateAttachment(input.file.contentType, input.file.sizeBytes);
    }

    // Generated ONCE here; reused verbatim by every retry.
    const clientMessageId = generateUuid();
    useOutboxStore.getState().add({
      clientMessageId,
      userId: user.id,
      conversationId: input.conversationId,
      text,
      attachment: input.file
        ? {
            localUri: input.file.uri,
            contentType: input.file.contentType,
            sizeBytes: input.file.sizeBytes,
            fileName: input.file.fileName,
            type: input.file.type,
            clientUploadId: generateUuid(),
          }
        : undefined,
      status: input.file ? "uploading" : "sending",
      createdAt: new Date().toISOString(),
    });
    void processEntry(clientMessageId);
    return clientMessageId;
  };

  /** Retry with the same clientMessageId, payload and (if any) verified mediaId. */
  const retry = (clientMessageId: string) => {
    void processEntry(clientMessageId);
  };

  /** Remove a failed message the user no longer wants to send. */
  const discard = (clientMessageId: string) => {
    if (inFlight.has(clientMessageId)) return;
    useOutboxStore.getState().remove(clientMessageId);
  };

  return { send, retry, discard };
}
