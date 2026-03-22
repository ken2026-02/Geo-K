import { create } from "zustand";

export interface ImportPipelineState {
  batchId?: string;
  batchState?: string;
  warningCount: number;
  setImportStatus: (payload: { batchId?: string; batchState?: string; warningCount: number }) => void;
}

export const useImportPipelineStore = create<ImportPipelineState>((set) => ({
  warningCount: 0,
  setImportStatus: (payload) => set(payload)
}));
