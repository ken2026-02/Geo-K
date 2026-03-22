import { create } from "zustand";

export interface ReviewProgressState {
  activeMode?: string;
  completedToday: number;
  setActiveMode: (activeMode?: string) => void;
  incrementCompleted: () => void;
  resetCompleted: () => void;
}

export const useReviewProgressStore = create<ReviewProgressState>((set) => ({
  completedToday: 0,
  setActiveMode: (activeMode) => set({ activeMode }),
  incrementCompleted: () => set((state) => ({ completedToday: state.completedToday + 1 })),
  resetCompleted: () => set({ completedToday: 0 })
}));
