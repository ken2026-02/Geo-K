export interface ImageProcessingInput {
  id: string;
  fileName: string;
  mimeType: string;
  blob: Blob;
}

export interface ProcessedImageVariant {
  variant: "thumbnail" | "standard" | "original";
  blob: Blob;
  mimeType: string;
  width: number;
  height: number;
}

export interface ProcessedImageAsset {
  id: string;
  variants: ProcessedImageVariant[];
}

export class ImagePipeline {
  async process(input: ImageProcessingInput, keepOriginal: boolean): Promise<ProcessedImageAsset> {
    const thumbnail = await this.resizeImage(input.blob, 320, "image/webp");
    const standard = await this.resizeImage(input.blob, 1280, "image/webp");

    const variants: ProcessedImageVariant[] = [
      { variant: "thumbnail", ...thumbnail },
      { variant: "standard", ...standard }
    ];

    if (keepOriginal) {
      const size = await this.getImageSize(input.blob);
      variants.push({
        variant: "original",
        blob: input.blob,
        mimeType: input.mimeType,
        width: size.width,
        height: size.height
      });
    }

    return { id: input.id, variants };
  }

  private async resizeImage(blob: Blob, maxDimension: number, preferredMimeType: string) {
    const bitmap = await createImageBitmap(blob);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas 2D context is not available.");
    }

    context.drawImage(bitmap, 0, 0, width, height);

    const mimeType = preferredMimeType;
    const outputBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (!result) {
          reject(new Error("Failed to encode image variant."));
          return;
        }
        resolve(result);
      }, mimeType, 0.85);
    });

    return {
      blob: outputBlob,
      mimeType,
      width,
      height
    };
  }

  private async getImageSize(blob: Blob): Promise<{ width: number; height: number }> {
    const bitmap = await createImageBitmap(blob);
    return { width: bitmap.width, height: bitmap.height };
  }
}
