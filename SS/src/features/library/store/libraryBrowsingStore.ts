import { create } from "zustand";

export interface LibraryBrowsingState {
  query: string;
  activeType?: string;
  activeTags: string[];
  setQuery: (query: string) => void;
  setActiveType: (activeType?: string) => void;
  setActiveTags: (activeTags: string[]) => void;
}

export const useLibraryBrowsingStore = create<LibraryBrowsingState>((set) => ({
  query: "",
  activeTags: [],
  setQuery: (query) => set({ query }),
  setActiveType: (activeType) => set({ activeType }),
  setActiveTags: (activeTags) => set({ activeTags })
}));
