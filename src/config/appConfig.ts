import { SCHEMA_VERSION } from "../data/db/schemaVersion";

export const appConfig = {
  appName: "Engineering Knowledge Vault",
  appVersion: "0.1.0",
  currentSchemaVersion: SCHEMA_VERSION,
  storage: {
    sqliteKey: "ekv:sqlite-db",
    imageBucket: "ekv:image-bucket"
  },
  search: {
    mode: "sqlite-indexed",
    futureMode: "sqlite-fts"
  },
  review: {
    defaultModes: ["word-review", "phrase-review", "sentence-review", "geo-feature-review"]
  }
} as const;
