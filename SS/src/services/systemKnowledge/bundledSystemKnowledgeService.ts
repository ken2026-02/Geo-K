import type { Database } from "sql.js";

import { bundledSystemKnowledgePacks, getBundledSystemKnowledgePack } from "../../features/systemKnowledge/bundledSystemKnowledgePacks";
import {
  SystemKnowledgeInjectionService,
  type SystemKnowledgeInjectionResult
} from "./systemKnowledgeInjectionService";
import type { SystemKnowledgeValidationReport } from "./systemKnowledgePackValidationService";

export interface TrustedBundledSystemPackSummary {
  id: string;
  packName: string;
  description: string;
}

export interface BundledSystemKnowledgeValidationResult {
  packId: string;
  packName: string;
  validationReport: SystemKnowledgeValidationReport;
}

export interface BundledSystemKnowledgeExecutionResult {
  packId: string;
  packName: string;
  validationReport: SystemKnowledgeValidationReport;
  snapshotCreated: true;
  snapshotName: string;
  injection: SystemKnowledgeInjectionResult;
}

export class BundledSystemKnowledgeService {
  constructor(private readonly injectionService = new SystemKnowledgeInjectionService()) {}

  listTrustedPacks(): TrustedBundledSystemPackSummary[] {
    return bundledSystemKnowledgePacks.map((pack) => ({
      id: pack.id,
      packName: pack.packName,
      description: pack.description
    }));
  }

  validateTrustedPack(packId: string): BundledSystemKnowledgeValidationResult {
    const pack = getBundledSystemKnowledgePack(packId);
    return {
      packId: pack.id,
      packName: pack.packName,
      validationReport: this.injectionService.validate(pack.rawJson)
    };
  }

  async injectTrustedPack(db: Database, packId: string): Promise<BundledSystemKnowledgeExecutionResult> {
    const pack = getBundledSystemKnowledgePack(packId);
    const validationReport = this.injectionService.validate(pack.rawJson);

    if (validationReport.state === "invalid") {
      const firstError = validationReport.errors[0] ?? "Bundled system knowledge pack validation failed.";
      throw new Error(firstError);
    }

    const injection = await this.injectionService.inject(db, pack.rawJson, pack.createImageFiles());

    return {
      packId: pack.id,
      packName: pack.packName,
      validationReport,
      snapshotCreated: true,
      snapshotName: injection.snapshotRecord.snapshotName,
      injection
    };
  }
}
