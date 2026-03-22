export const testingConfig = {
  samplePacks: [
    "small-language-only-pack",
    "mixed-geo-feature-pack",
    "image-heavy-pack",
    "malformed-schema-pack",
    "duplicate-heavy-pack",
    "large-threshold-pack"
  ],
  mandatoryScenarios: [
    "valid-json-import-without-images",
    "valid-zip-import-with-images",
    "invalid-schema-import-rejection",
    "import-with-unknown-optional-fields",
    "duplicate-candidate-handling",
    "image-processing-partial-failure",
    "commit-failure-rollback",
    "restore-from-valid-backup",
    "restore-rejection-for-invalid-backup",
    "unfinished-batch-reopened-after-restart",
    "migration-from-previous-schema-version",
    "search-after-import"
  ]
} as const;
