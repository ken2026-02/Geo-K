import JSZip from "jszip";
import type { Database } from "sql.js";

import { appConfig } from "../../config/appConfig";
import { createDatabase, exportDatabase, persistDatabase } from "../../data/db/database";
import { DATABASE_IDB_KEY, SCHEMA_VERSION } from "../../data/db/schemaVersion";
import { deleteValue, getBlob, listKeys, setBinary, setBlob } from "../../data/idb/storage";
import type { BackupSnapshotRecord } from "../../data/repositories/interfaces";
import { SqliteBackupSnapshotRepository } from "../../data/repositories/sqlite/backupSnapshotRepository";
import { PerformanceMetricsService } from "../performance/performanceMetricsService";

export interface BackupManifest {
  backup_version: "1.0";
  schema_version: string;
  created_at: string;
  backup_type: "full" | "snapshot";
  item_counts: Record<string, number>;
  image_counts: {
    pending_images: number;
    approved_images: number;
    image_resources: number;
  };
  app_version: string;
  notes?: string;
  database_file: string;
  image_resource_index_file: string;
}

interface ImageResourceDescriptor {
  storageKey: string;
  zipPath: string;
  sizeBytes?: number;
  mimeType?: string;
}

interface BackupPackageData {
  manifest: BackupManifest;
  databaseBinary: Uint8Array;
  imageResources: Array<ImageResourceDescriptor & { blob: Blob }>;
  blob: Blob;
}

export interface BackupExportResult {
  fileName: string;
  manifest: BackupManifest;
  snapshotRecord: BackupSnapshotRecord;
  blob: Blob;
}

export interface RestoreValidationPreview {
  state: "valid" | "valid_with_warnings" | "invalid";
  manifest?: BackupManifest;
  fileName: string;
  errors: string[];
  warnings: string[];
  itemCounts: Record<string, number>;
  imageCounts?: BackupManifest["image_counts"];
}

export interface RestoreExecutionResult {
  snapshotRecord: BackupSnapshotRecord;
  manifest: BackupManifest;
}

function nowIso(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  return `${prefix}-${nowIso()}-${Math.random().toString(16).slice(2, 8)}`;
}

function timestampToken(value: string): string {
  return value.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z").replace("T", "_");
}

function safeFileToken(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function getCount(db: Database, tableName: string): number {
  const result = db.exec(`SELECT COUNT(*) AS count_value FROM ${tableName}`);
  if (result.length === 0 || result[0].values.length === 0) {
    return 0;
  }

  return Number(result[0].values[0][0] ?? 0);
}

function parsePendingVariants(tempStoragePath?: string): ImageResourceDescriptor[] {
  if (!tempStoragePath) {
    return [];
  }

  try {
    const parsed = JSON.parse(tempStoragePath) as { variants?: Array<{ storageKey: string; sizeBytes?: number; mimeType?: string }> };
    return (parsed.variants ?? [])
      .filter((variant) => typeof variant.storageKey === "string" && variant.storageKey.length > 0)
      .map((variant) => ({
        storageKey: variant.storageKey,
        zipPath: "",
        sizeBytes: variant.sizeBytes,
        mimeType: variant.mimeType
      }));
  } catch {
    return [];
  }
}

async function buildBackupPackage(db: Database, backupType: BackupManifest["backup_type"], notes?: string): Promise<BackupPackageData> {
  const createdAt = nowIso();
  const zip = new JSZip();
  const databaseBinary = exportDatabase(db);
  const itemCounts: Record<string, number> = {
    import_batches: getCount(db, "import_batches"),
    pending_words: getCount(db, "pending_words"),
    pending_phrases: getCount(db, "pending_phrases"),
    pending_sentences: getCount(db, "pending_sentences"),
    pending_geo_materials: getCount(db, "pending_geo_materials"),
    pending_geo_features: getCount(db, "pending_geo_features"),
    pending_images: getCount(db, "pending_images"),
    words: getCount(db, "words"),
    phrases: getCount(db, "phrases"),
    sentences: getCount(db, "sentences"),
    geo_materials: getCount(db, "geo_materials"),
    geo_features: getCount(db, "geo_features"),
    reports: getCount(db, "reports"),
    item_sources: getCount(db, "item_sources"),
    item_relations: getCount(db, "item_relations"),
    images: getCount(db, "images"),
    item_image_links: getCount(db, "item_image_links")
  };

  const pendingImageRows = db.exec("SELECT temp_storage_path FROM pending_images WHERE temp_storage_path IS NOT NULL");
  const approvedImageRows = db.exec("SELECT storage_path, mime_type, original_size_bytes FROM images");
  const resourceMap = new Map<string, ImageResourceDescriptor>();

  if (pendingImageRows.length > 0) {
    for (const row of pendingImageRows[0].values) {
      const value = row[0] == null ? undefined : String(row[0]);
      for (const variant of parsePendingVariants(value)) {
        if (!resourceMap.has(variant.storageKey)) {
          resourceMap.set(variant.storageKey, variant);
        }
      }
    }
  }

  if (approvedImageRows.length > 0) {
    for (const row of approvedImageRows[0].values) {
      const storageKey = row[0] == null ? undefined : String(row[0]);
      if (!storageKey) {
        continue;
      }

      if (!resourceMap.has(storageKey)) {
        resourceMap.set(storageKey, {
          storageKey,
          zipPath: "",
          mimeType: row[1] == null ? undefined : String(row[1]),
          sizeBytes: row[2] == null ? undefined : Number(row[2])
        });
      }
    }
  }

  const imageResources: Array<ImageResourceDescriptor & { blob: Blob }> = [];
  let index = 0;
  for (const descriptor of resourceMap.values()) {
    const blob = await getBlob(descriptor.storageKey);
    if (!blob) {
      continue;
    }

    const extension = descriptor.mimeType === "image/webp" ? "webp" : descriptor.mimeType === "image/png" ? "png" : "jpg";
    const zipPath = `images/${String(index + 1).padStart(4, "0")}-${safeFileToken(descriptor.storageKey)}.${extension}`;
    imageResources.push({
      ...descriptor,
      zipPath,
      sizeBytes: descriptor.sizeBytes ?? blob.size,
      mimeType: descriptor.mimeType ?? blob.type,
      blob
    });
    index += 1;
  }

  const manifest: BackupManifest = {
    backup_version: "1.0",
    schema_version: SCHEMA_VERSION,
    created_at: createdAt,
    backup_type: backupType,
    item_counts: itemCounts,
    image_counts: {
      pending_images: itemCounts.pending_images ?? 0,
      approved_images: itemCounts.images ?? 0,
      image_resources: imageResources.length
    },
    app_version: appConfig.appVersion,
    notes,
    database_file: "database.sqlite",
    image_resource_index_file: "metadata/image-resources.json"
  };

  zip.file(manifest.database_file, databaseBinary);
  zip.file("manifest.json", JSON.stringify(manifest, null, 2));
  zip.file(
    manifest.image_resource_index_file,
    JSON.stringify(
      imageResources.map(({ storageKey, zipPath, sizeBytes, mimeType }) => ({ storageKey, zipPath, sizeBytes, mimeType })),
      null,
      2
    )
  );

  for (const resource of imageResources) {
    zip.file(resource.zipPath, await resource.blob.arrayBuffer());
  }

  const blob = await zip.generateAsync({ type: "blob" });
  return { manifest, databaseBinary, imageResources, blob };
}

async function loadBackupPackage(file: Blob, fileName: string): Promise<RestoreValidationPreview & { packageData?: Omit<BackupPackageData, "blob"> }> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const manifestEntry = zip.file("manifest.json");

  if (!manifestEntry) {
    return {
      state: "invalid",
      fileName,
      errors: ["Backup package is missing manifest.json."],
      warnings: [],
      itemCounts: {}
    };
  }

  let manifest: BackupManifest | undefined;
  try {
    manifest = JSON.parse(await manifestEntry.async("text")) as BackupManifest;
  } catch {
    return {
      state: "invalid",
      fileName,
      errors: ["Backup manifest could not be parsed."],
      warnings: [],
      itemCounts: {}
    };
  }

  if (!manifest.backup_version || !manifest.schema_version || !manifest.created_at || !manifest.backup_type || !manifest.database_file || !manifest.image_resource_index_file) {
    errors.push("Backup manifest is missing required fields.");
  }

  if (manifest.schema_version !== SCHEMA_VERSION) {
    errors.push(`Backup schema version ${manifest.schema_version} is not compatible with current schema ${SCHEMA_VERSION}.`);
  }

  const databaseEntry = manifest.database_file ? zip.file(manifest.database_file) : null;
  if (!databaseEntry) {
    errors.push(`Backup package is missing database file: ${manifest.database_file}.`);
  }

  const resourceIndexEntry = manifest.image_resource_index_file ? zip.file(manifest.image_resource_index_file) : null;
  if (!resourceIndexEntry) {
    errors.push(`Backup package is missing image resource index: ${manifest.image_resource_index_file}.`);
  }

  let descriptors: ImageResourceDescriptor[] = [];
  if (resourceIndexEntry) {
    try {
      const parsed = JSON.parse(await resourceIndexEntry.async("text")) as ImageResourceDescriptor[];
      descriptors = parsed;
    } catch {
      errors.push("Image resource index could not be parsed.");
    }
  }

  const imageResources: Array<ImageResourceDescriptor & { blob: Blob }> = [];
  for (const descriptor of descriptors) {
    const entry = zip.file(descriptor.zipPath);
    if (!entry) {
      errors.push(`Image resource is missing from backup: ${descriptor.zipPath}`);
      continue;
    }

    imageResources.push({
      ...descriptor,
      blob: await entry.async("blob")
    });
  }

  const databaseBinary = databaseEntry ? new Uint8Array(await databaseEntry.async("uint8array")) : new Uint8Array();
  if (databaseEntry && databaseBinary.length === 0) {
    errors.push("Backup database file is empty.");
  }

  if ((manifest.image_counts?.image_resources ?? 0) === 0) {
    warnings.push("Backup package contains no image resources.");
  }

  const state = errors.length > 0 ? "invalid" : warnings.length > 0 ? "valid_with_warnings" : "valid";

  return {
    state,
    manifest,
    fileName,
    errors,
    warnings,
    itemCounts: manifest.item_counts ?? {},
    imageCounts: manifest.image_counts,
    packageData: errors.length > 0 || !manifest
      ? undefined
      : {
          manifest,
          databaseBinary,
          imageResources
        }
  };
}

export class BackupOrchestrationService {
  private readonly performanceService = new PerformanceMetricsService();

  async listSnapshots(db: Database): Promise<BackupSnapshotRecord[]> {
    return new SqliteBackupSnapshotRepository(db).listAll();
  }

  async createPreImportSnapshot(db: Database): Promise<BackupSnapshotRecord> {
    return this.createSnapshot(db, "auto_pre_import", "Automatic snapshot created before import staging.");
  }

  async createPreRestoreSnapshot(db: Database): Promise<BackupSnapshotRecord> {
    return this.createSnapshot(db, "auto_pre_restore", "Automatic snapshot created before full replace restore.");
  }

  async createPreSystemInjectionSnapshot(db: Database): Promise<BackupSnapshotRecord> {
    return this.createSnapshot(db, "auto_pre_system_injection", "Automatic snapshot created before system knowledge injection.");
  }

  async exportFullBackup(db: Database): Promise<BackupExportResult> {
    return this.performanceService.measure("backup", undefined, async () => this.createExport(db, "manual_full", "full", "Manual full backup export."));
  }

  async previewRestore(file: File): Promise<RestoreValidationPreview> {
    const preview = await loadBackupPackage(file, file.name);
    return {
      state: preview.state,
      manifest: preview.manifest,
      fileName: preview.fileName,
      errors: preview.errors,
      warnings: preview.warnings,
      itemCounts: preview.itemCounts,
      imageCounts: preview.imageCounts
    };
  }

  async restoreFullReplace(db: Database, file: File): Promise<RestoreExecutionResult> {
    return this.performanceService.measure("restore", { fileName: file.name }, async () => {
      const preview = await loadBackupPackage(file, file.name);
      if (preview.state === "invalid" || !preview.packageData || !preview.manifest) {
        throw new Error(preview.errors[0] ?? "Backup package is invalid.");
      }

      const rollbackSnapshot = await this.createSnapshot(db, "auto_pre_restore", "Automatic snapshot created before full replace restore.");
      const rollbackPackage = rollbackSnapshot.backupPath ? await this.readStoredBackup(rollbackSnapshot.backupPath, rollbackSnapshot.snapshotName) : undefined;
      const restoredBinaryWithSnapshot = await this.withSnapshotRecord(preview.packageData.databaseBinary, rollbackSnapshot);

      try {
        await this.applyRestorePackage({
          manifest: preview.packageData.manifest,
          databaseBinary: restoredBinaryWithSnapshot,
          imageResources: preview.packageData.imageResources
        });
        return {
          snapshotRecord: rollbackSnapshot,
          manifest: preview.manifest
        };
      } catch (error) {
        if (rollbackPackage?.packageData) {
          const rollbackBinaryWithSnapshot = await this.withSnapshotRecord(rollbackPackage.packageData.databaseBinary, rollbackSnapshot);
          await this.applyRestorePackage({
            manifest: rollbackPackage.packageData.manifest,
            databaseBinary: rollbackBinaryWithSnapshot,
            imageResources: rollbackPackage.packageData.imageResources
          });
        }
        throw error;
      }
    });
  }

  private async createSnapshot(db: Database, snapshotType: string, notes: string): Promise<BackupSnapshotRecord> {
    return this.createExport(db, snapshotType, "snapshot", notes).then((result) => result.snapshotRecord);
  }

  private async createExport(
    db: Database,
    snapshotType: BackupSnapshotRecord["snapshotType"],
    backupType: BackupManifest["backup_type"],
    notes: string
  ): Promise<BackupExportResult> {
    const packageData = await buildBackupPackage(db, backupType, notes);
    const createdAt = packageData.manifest.created_at;
    const id = createId("snapshot");
    const snapshotName = `${snapshotType}_${timestampToken(createdAt)}`;
    const storageKey = `backup:${snapshotType}:${id}.zip`;
    const fileName = `${appConfig.appName.toLowerCase().replace(/\s+/g, "-")}-${snapshotName}.zip`;

    await setBlob(storageKey, packageData.blob);

    const record: BackupSnapshotRecord = {
      id,
      snapshotName,
      snapshotType,
      createdAt,
      schemaVersion: packageData.manifest.schema_version,
      includesImages: true,
      includesPending: true,
      includesUserData: true,
      backupPath: storageKey,
      notes
    };

    db.exec("BEGIN TRANSACTION;");
    try {
      await new SqliteBackupSnapshotRepository(db).insert(record);
      db.exec("COMMIT;");
    } catch (error) {
      db.exec("ROLLBACK;");
      await deleteValue(storageKey);
      throw error;
    }

    await persistDatabase(db);

    return {
      fileName,
      manifest: packageData.manifest,
      snapshotRecord: record,
      blob: packageData.blob
    };
  }

  private async readStoredBackup(storageKey: string, fileName: string): Promise<RestoreValidationPreview & { packageData?: Omit<BackupPackageData, "blob"> }> {
    const blob = await getBlob(storageKey);
    if (!blob) {
      return {
        state: "invalid",
        fileName,
        errors: [`Stored backup blob is missing: ${storageKey}`],
        warnings: [],
        itemCounts: {}
      };
    }

    return loadBackupPackage(blob, fileName);
  }

  private async withSnapshotRecord(databaseBinary: Uint8Array, snapshotRecord: BackupSnapshotRecord): Promise<Uint8Array> {
    const restoredDb = await createDatabase(databaseBinary);
    await new SqliteBackupSnapshotRepository(restoredDb).insert(snapshotRecord);
    return exportDatabase(restoredDb);
  }

  private async applyRestorePackage(packageData: Omit<BackupPackageData, "blob">): Promise<void> {
    const currentImageKeys = await listKeys("image:");
    const targetImageKeys = new Set(packageData.imageResources.map((resource) => resource.storageKey));

    await setBinary(DATABASE_IDB_KEY, packageData.databaseBinary);

    for (const resource of packageData.imageResources) {
      await setBlob(resource.storageKey, resource.blob);
    }

    for (const key of currentImageKeys) {
      if (!targetImageKeys.has(key)) {
        await deleteValue(key);
      }
    }
  }
}

