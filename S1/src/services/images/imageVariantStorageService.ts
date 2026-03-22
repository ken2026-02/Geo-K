import { setBlob } from "../../data/idb/storage";

export interface StoredVariantRef {
  variant: "thumbnail" | "standard" | "original";
  storageKey: string;
  mimeType: string;
  width: number;
  height: number;
  sizeBytes: number;
}

export class ImageVariantStorageService {
  async saveVariant(batchId: string, imageId: string, variant: StoredVariantRef["variant"], blob: Blob, mimeType: string, width: number, height: number): Promise<StoredVariantRef> {
    const storageKey = `image:${batchId}:${imageId}:${variant}`;
    await setBlob(storageKey, blob);

    return {
      variant,
      storageKey,
      mimeType,
      width,
      height,
      sizeBytes: blob.size
    };
  }
}
