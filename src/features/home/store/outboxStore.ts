import { storage } from "@/core/lib/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Message, MessageAttachment } from "@/features/home/hooks/useMessages";

const zustandMmkvStorage = {
  setItem: (name: string, value: string) => storage.set(name, value),
  getItem: (name: string) => storage.getString(name) ?? null,
  removeItem: (name: string) => {
    storage.remove(name);
  },
};

/** A file the user picked, plus whatever upload progress has been completed. */
export interface OutboxAttachment {
  /** On-device URI from the picker (used for preview and for the upload). */
  localUri: string;
  contentType: string;
  sizeBytes: number;
  fileName: string;
  type: MessageAttachment["type"];
  /** Idempotency key for POST /media/uploads — reused on retry. */
  clientUploadId: string;
  /**
   * Set once POST /media/uploads/{id}/complete returns `ready`. When present,
   * retry skips the upload entirely and reuses this verified media ID.
   */
  mediaId?: string;
  url?: string;
}

export type OutboxStatus = "uploading" | "sending" | "failed";

export interface OutboxEntry {
  /** Idempotency key for POST /conversations/{id}/messages — never changes. */
  clientMessageId: string;
  /** Owning account — entries are never shown to or sent by another account. */
  userId: string;
  conversationId: string;
  text: string | null;
  attachment?: OutboxAttachment;
  status: OutboxStatus;
  /** 0–1 while uploading */
  progress?: number;
  error?: string;
  createdAt: string;
}

type OutboxState = {
  entries: Record<string, OutboxEntry>;
  add: (entry: OutboxEntry) => void;
  update: (clientMessageId: string, patch: Partial<OutboxEntry>) => void;
  updateAttachment: (clientMessageId: string, patch: Partial<OutboxAttachment>) => void;
  remove: (clientMessageId: string) => void;
  clearAll: () => void;
};

export const useOutboxStore = create<OutboxState>()(
  persist(
    (set) => ({
      entries: {},
      add: (entry) =>
        set((s) => ({ entries: { ...s.entries, [entry.clientMessageId]: entry } })),
      update: (id, patch) =>
        set((s) => {
          const existing = s.entries[id];
          if (!existing) return s;
          return { entries: { ...s.entries, [id]: { ...existing, ...patch } } };
        }),
      updateAttachment: (id, patch) =>
        set((s) => {
          const existing = s.entries[id];
          if (!existing?.attachment) return s;
          return {
            entries: {
              ...s.entries,
              [id]: { ...existing, attachment: { ...existing.attachment, ...patch } },
            },
          };
        }),
      remove: (id) =>
        set((s) => {
          if (!s.entries[id]) return s;
          const next = { ...s.entries };
          delete next[id];
          return { entries: next };
        }),
      clearAll: () => set({ entries: {} }),
    }),
    {
      name: "chatme-outbox",
      storage: createJSONStorage(() => zustandMmkvStorage),
      partialize: (s) => ({ entries: s.entries }),
      // Anything still "uploading"/"sending" when the app was killed was
      // interrupted: surface it as failed so the user can retry explicitly.
      // The original clientMessageId, payload and any verified mediaId are kept.
      merge: (persisted, current) => {
        const entries = (persisted as Partial<OutboxState> | undefined)?.entries ?? {};
        const fixed: Record<string, OutboxEntry> = {};
        for (const [id, e] of Object.entries(entries)) {
          fixed[id] =
            e.status === "failed"
              ? e
              : {
                  ...e,
                  status: "failed",
                  progress: undefined,
                  error: "Not sent — the app closed before sending finished.",
                };
        }
        return { ...current, entries: fixed };
      },
    }
  )
);

/** Render an outbox entry as a Message bubble. */
export function outboxEntryToMessage(e: OutboxEntry): Message {
  const a = e.attachment;
  return {
    id: `local-${e.clientMessageId}`,
    conversationId: e.conversationId,
    clientMessageId: e.clientMessageId,
    senderId: e.userId,
    kind: a ? a.type : "text",
    text: e.text,
    attachments:
      a && a.mediaId && a.url
        ? [
            {
              mediaId: a.mediaId,
              type: a.type,
              contentType: a.contentType,
              sizeBytes: a.sizeBytes,
              url: a.url,
              filename: a.fileName,
            },
          ]
        : undefined,
    createdAt: e.createdAt,
    status: e.status,
    error: e.error,
    localPreviewUri: a?.localUri,
    localFileName: a?.fileName,
  };
}
