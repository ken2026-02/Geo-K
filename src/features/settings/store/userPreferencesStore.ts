import { create } from "zustand";

export interface UserPreferencesState {
  keepOriginalImages: boolean;
  defaultLibraryType?: string;
  setKeepOriginalImages: (keepOriginalImages: boolean) => void;
  setDefaultLibraryType: (defaultLibraryType?: string) => void;
}

export const useUserPreferencesStore = create<UserPreferencesState>((set) => ({
  keepOriginalImages: false,
  setKeepOriginalImages: (keepOriginalImages) => set({ keepOriginalImages }),
  setDefaultLibraryType: (defaultLibraryType) => set({ defaultLibraryType })
}));
