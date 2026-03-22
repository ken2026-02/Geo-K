import type { ImportAcquiredPayload } from "./pipelineTypes";

export class ImportInputAcquisitionService {
  acquireFromJson(sourceFileName: string, rawJson: string): ImportAcquiredPayload {
    return {
      format: "json",
      sourceFileName,
      rawJson,
      imageFileNames: []
    };
  }

  acquireFromZip(sourceFileName: string, knowledgePackJson: string, imageFileNames: string[]): ImportAcquiredPayload {
    return {
      format: "zip",
      sourceFileName,
      rawJson: knowledgePackJson,
      imageFileNames
    };
  }
}
