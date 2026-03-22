import { openDB } from "idb";

const IDB_NAME = "engineering-knowledge-vault";
const STORE_NAME = "app-state";

async function getStore() {
  return openDB(IDB_NAME, 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    }
  });
}

export async function setValue(key: string, value: unknown): Promise<void> {
  const db = await getStore();
  await db.put(STORE_NAME, value, key);
}

export async function getValue<T>(key: string): Promise<T | undefined> {
  const db = await getStore();
  return db.get(STORE_NAME, key) as Promise<T | undefined>;
}

export async function setBinary(key: string, value: Uint8Array): Promise<void> {
  await setValue(key, value);
}

export async function getBinary(key: string): Promise<Uint8Array | undefined> {
  return getValue<Uint8Array>(key);
}

export async function setBlob(key: string, value: Blob): Promise<void> {
  await setValue(key, value);
}

export async function getBlob(key: string): Promise<Blob | undefined> {
  return getValue<Blob>(key);
}

export async function deleteValue(key: string): Promise<void> {
  const db = await getStore();
  await db.delete(STORE_NAME, key);
}

export async function listKeys(prefix?: string): Promise<string[]> {
  const db = await getStore();
  const keys = await db.getAllKeys(STORE_NAME);
  return keys
    .filter((key): key is string => typeof key === "string")
    .filter((key) => (prefix ? key.startsWith(prefix) : true));
}
