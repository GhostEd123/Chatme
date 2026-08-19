import { storage } from "@/core/lib/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const zustandMmkvStorage = {
  setItem: (name: string, value: string) => storage.set(name, value),
  getItem: (name: string) => storage.getString(name) ?? null,
  removeItem: (name: string) => storage.delete(name),
};

export type Chat = {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount?: number;
  avatarUrl?: string;
  isPinned?: boolean;
  isMuted?: boolean;
  isArchived?: boolean;
};

type ChatState = {
  chats: Chat[];
  setChats: (chats: Chat[]) => void;
  updateChat: (id: string, data: Partial<Chat>) => void;
  deleteChat: (id: string) => void;
  pinChat: (id: string, isPinned: boolean) => void;
  muteChat: (id: string, isMuted: boolean) => void;
  archiveChat: (id: string, isArchived: boolean) => void;
};

// Initial mock data for development
const initialChats: Chat[] = [
  { id: "1", name: "Darrell Steward", lastMessage: "Hello, Good morning! ✨", timestamp: "11:47 PM", unreadCount: 4, avatarUrl: "https://i.pravatar.cc/150?u=1", isPinned: true },
  { id: "2", name: "Jane Cooper", lastMessage: "You: Can you sent the photo?", timestamp: "11:23 PM", avatarUrl: "https://i.pravatar.cc/150?u=2" },
  { id: "3", name: "Theresa Webb", lastMessage: "Okay, Thank you", timestamp: "11:17 PM", unreadCount: 4, avatarUrl: "https://i.pravatar.cc/150?u=3" },
  { id: "4", name: "Work Team", lastMessage: "Wait, I'm on my way!", timestamp: "08:26 PM", avatarUrl: "https://i.pravatar.cc/150?u=4" },
  { id: "5", name: "Annette Black", lastMessage: "You: Okay Rin, sounds good. Let's ...", timestamp: "08:13 PM", avatarUrl: "https://i.pravatar.cc/150?u=5" },
  { id: "6", name: "Ronald Richards", lastMessage: "You: Can you sent the photo?", timestamp: "Yesterday", avatarUrl: "https://i.pravatar.cc/150?u=6", isMuted: true },
  { id: "7", name: "Guy Hawkins", lastMessage: "You: Can you sent the photo?", timestamp: "Yesterday", avatarUrl: "https://i.pravatar.cc/150?u=7" },
];

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      chats: initialChats,
      setChats: (chats) => set({ chats }),
      updateChat: (id, data) =>
        set((state) => ({
          chats: state.chats.map((c) => (c.id === id ? { ...c, ...data } : c)),
        })),
      deleteChat: (id) =>
        set((state) => ({
          chats: state.chats.filter((c) => c.id !== id),
        })),
      pinChat: (id, isPinned) =>
        set((state) => ({
          chats: state.chats.map((c) => (c.id === id ? { ...c, isPinned } : c)),
        })),
      muteChat: (id, isMuted) =>
        set((state) => ({
          chats: state.chats.map((c) => (c.id === id ? { ...c, isMuted } : c)),
        })),
      archiveChat: (id, isArchived) =>
        set((state) => ({
          chats: state.chats.map((c) => (c.id === id ? { ...c, isArchived } : c)),
        })),
    }),
    {
      name: "chatme-chat-storage",
      storage: createJSONStorage(() => zustandMmkvStorage),
    }
  )
);
