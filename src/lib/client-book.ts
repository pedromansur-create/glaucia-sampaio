import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MaisonClient } from "./maison-ai";

type Book = {
  clients: MaisonClient[];
  upsert: (c: Partial<MaisonClient> & Pick<MaisonClient, "name">) => void;
  remove: (id: string) => void;
  touch: (id: string, piece?: string) => void;
};

export const useClientBook = create<Book>()(
  persist(
    (set, get) => ({
      clients: [],
      upsert: (c) => {
        const id = c.id || crypto.randomUUID();
        const next: MaisonClient = {
          id,
          name: c.name.trim(),
          phone: (c.phone ?? "").trim(),
          size: (c.size ?? "").trim().toUpperCase(),
          notes: (c.notes ?? "").trim(),
          lastVisit: c.lastVisit || new Date().toISOString().slice(0, 10),
          lastPieces: c.lastPieces ?? [],
        };
        const clients = get().clients.filter((x) => x.id !== id);
        set({ clients: [next, ...clients] });
      },
      remove: (id) => set({ clients: get().clients.filter((c) => c.id !== id) }),
      touch: (id, piece) => {
        set({
          clients: get().clients.map((c) =>
            c.id === id
              ? {
                  ...c,
                  lastVisit: new Date().toISOString().slice(0, 10),
                  lastPieces: piece ? [piece, ...c.lastPieces.filter((s) => s !== piece)].slice(0, 6) : c.lastPieces,
                }
              : c,
          ),
        });
      },
    }),
    { name: "gs-casa-book" },
  ),
);
