import type { Database } from "sql.js";

import { persistDatabase } from "../../data/db/database";
import type {
  PersonalNoteRecord,
  PersonalNoteStatus,
  PersonalNoteTargetItemType,
  PersonalNoteType
} from "../../data/repositories/interfaces";
import { SqlitePersonalNoteRepository } from "../../data/repositories/sqlite/personalNoteRepository";

export interface CreatePersonalNoteInput {
  targetItemType: PersonalNoteTargetItemType;
  targetItemId: string;
  noteType: PersonalNoteType;
  body: string;
}

export interface UpdatePersonalNoteInput {
  id: string;
  noteType: PersonalNoteType;
  body: string;
  status: PersonalNoteStatus;
}

function nowIso(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  return `${prefix}-${nowIso()}-${Math.random().toString(16).slice(2, 8)}`;
}

function sanitizeBody(body: string): string {
  return body.trim();
}

export class PersonalNoteService {
  async listForItem(db: Database, targetItemType: PersonalNoteTargetItemType, targetItemId: string): Promise<PersonalNoteRecord[]> {
    return new SqlitePersonalNoteRepository(db).listByTarget(targetItemType, targetItemId);
  }

  async createForItem(db: Database, input: CreatePersonalNoteInput): Promise<PersonalNoteRecord> {
    const body = sanitizeBody(input.body);
    if (!body) {
      throw new Error("Personal note body is required.");
    }

    const timestamp = nowIso();
    const record: PersonalNoteRecord = {
      id: createId("personal-note"),
      noteType: input.noteType,
      body,
      status: "active",
      targetItemType: input.targetItemType,
      targetItemId: input.targetItemId,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    const repository = new SqlitePersonalNoteRepository(db);
    await repository.insert(record);
    await persistDatabase(db);
    return record;
  }

  async updateNote(db: Database, input: UpdatePersonalNoteInput): Promise<PersonalNoteRecord> {
    const repository = new SqlitePersonalNoteRepository(db);
    const existing = await repository.getById(input.id);

    if (!existing) {
      throw new Error("Personal note not found.");
    }

    const body = sanitizeBody(input.body);
    if (!body) {
      throw new Error("Personal note body is required.");
    }

    const updated: PersonalNoteRecord = {
      ...existing,
      noteType: input.noteType,
      body,
      status: input.status,
      updatedAt: nowIso()
    };

    await repository.update(updated);
    await persistDatabase(db);
    return updated;
  }

  async archiveNote(db: Database, id: string): Promise<void> {
    const repository = new SqlitePersonalNoteRepository(db);
    const existing = await repository.getById(id);
    if (!existing) {
      throw new Error("Personal note not found.");
    }

    await repository.archive(id);
    await persistDatabase(db);
  }
}