import { create } from "zustand";

export interface InboxReviewState {
  selectedIds: string[];
  activeFilters: string[];
  setSelectedIds: (selectedIds: string[]) => void;
  setActiveFilters: (activeFilters: string[]) => void;
}

export const useInboxReviewStore = create<InboxReviewState>((set) => ({
  selectedIds: [],
  activeFilters: [],
  setSelectedIds: (selectedIds) => set({ selectedIds }),
  setActiveFilters: (activeFilters) => set({ activeFilters })
}));
