import JSZip from "jszip";

export interface KnowledgePackFilePayload {
  format: "json" | "zip";
  sourceFileName: string;
  rawJson: string;
  imageFiles: Map<string, Blob>;
}

export class KnowledgePackFileReaderService {
  async read(file: File): Promise<KnowledgePackFilePayload> {
    const lower = file.name.toLowerCase();

    if (lower.endsWith(".json")) {
      return {
        format: "json",
        sourceFileName: file.name,
        rawJson: await file.text(),
        imageFiles: new Map<string, Blob>()
      };
    }

    if (!lower.endsWith(".zip")) {
      throw new Error("Unsupported file type. Use knowledge pack JSON or ZIP.");
    }

    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const jsonEntry = zip.file("knowledge_pack.json");

    if (!jsonEntry) {
      throw new Error("ZIP package is missing knowledge_pack.json.");
    }

    const rawJson = await jsonEntry.async("text");
    const imageFiles = new Map<string, Blob>();

    for (const [path, entry] of Object.entries(zip.files)) {
      if (entry.dir) {
        continue;
      }
      if (!path.startsWith("images/")) {
        continue;
      }

      const fileName = path.replace(/^images\//, "");
      if (!fileName) {
        continue;
      }

      const blob = await entry.async("blob");
      imageFiles.set(fileName, blob);
    }

    return {
      format: "zip",
      sourceFileName: file.name,
      rawJson,
      imageFiles
    };
  }
}
