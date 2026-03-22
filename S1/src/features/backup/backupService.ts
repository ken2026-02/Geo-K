export interface SnapshotDescriptor {
  id: string;
  snapshotType: "auto_pre_import" | "auto_pre_restore" | "manual_full" | "manual_partial";
  schemaVersion: string;
  createdAt: string;
  storageKey: string;
}

export class BackupService {
  createFullBackupName(createdAt: string): string {
    return `engineering-knowledge-vault-full-${createdAt}.zip`;
  }

  createSnapshotDescriptor(snapshotType: SnapshotDescriptor["snapshotType"], schemaVersion: string): SnapshotDescriptor {
    const timestamp = new Date().toISOString();
    return {
      id: `snapshot-${timestamp}`,
      snapshotType,
      schemaVersion,
      createdAt: timestamp,
      storageKey: `snapshots/${timestamp}.bin`
    };
  }
}
