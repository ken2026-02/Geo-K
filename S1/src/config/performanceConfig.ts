export const performanceConfig = {
  importChunkSizes: {
    words: 200,
    phrases: 100,
    sentences: 50,
    geoMaterials: 25,
    geoFeatures: 25,
    images: 10
  },
  search: {
    defaultPageSize: 50,
    maxPreviewRelations: 20
  },
  images: {
    thumbnailMaxPx: 320,
    standardMaxPx: 1280,
    keepOriginalByDefault: false
  },
  caches: {
    appShellVersion: "v1",
    staticAssetsVersion: "v1"
  }
} as const;
