# 数据模型基线

## 1. 四层结构

### Import Layer

- `ImportBatch`
- `PendingWord`
- `PendingPhrase`
- `PendingSentence`
- `PendingGeoMaterial`
- `PendingGeoFeature`
- `PendingStrategy`
- `PendingImageAsset`
- `PendingItemImageLink`

### Approved Knowledge Layer

- `Report`
- `Word`
- `Phrase`
- `Sentence`
- `GeoMaterial`
- `GeoFeature`
- `Strategy`
- `ImageAsset`
- `ItemSource`
- `ItemRelation`
- `ItemImageLink`

### User Enhancement Layer

- `UserNote`
- `Favorite`
- `CustomTag`
- `ReviewLog`
- `UserImageLink`
- `UserEntryMetadata`

### System Layer

- `RuleSet`
- `BackupSnapshot`
- `StorageMeta`
- `MigrationLog`

## 2. 关键原则

- `Pending` 与 `Approved` 必须分离
- 图片独立管理，通过 link table 关联
- imported data 与 user enhancement 分离
- 关系必须显式建模
- approved item 保存 canonical 和 normalized 两套字段
- pending item 保留 raw AI 输出和 review 专用字段
- user-created item 进入 approved tables，但必须带 provenance 标记

## 3. Phase 1 最低落地对象

### Import

- `ImportBatch`
- `PendingWord`
- `PendingPhrase`
- `PendingSentence`
- `PendingGeoMaterial`
- `PendingGeoFeature`
- `PendingImageAsset`

### Approved

- `Report`
- `Word`
- `Phrase`
- `Sentence`
- `GeoMaterial`
- `GeoFeature`
- `Strategy`
- `ImageAsset`
- `ItemSource`
- `ItemRelation`
- `ItemImageLink`

### User

- `UserNote`
- `Favorite`
- `CustomTag`
- `ReviewLog`

### System

- `RuleSet`
- `BackupSnapshot`

## 4. 查询与索引基线

必须优先索引：

- canonical / normalized 字段
- `category`
- `scenario_type`
- `function_type`
- `source_report_id`
- `item_type + item_id`
- `asset_group_id`
- `review_status`
- `duplicate_status`

## 5. 扩展策略

后续新增 `Formula`、`Standard`、`ConcreteDefect`、`SupportQA`、`MonitoringItem`、`CaseStudy` 时：

- 不改写现有核心对象
- 新对象新增独立 approved / pending table
- 复用 `ItemRelation`、`ItemSource`、`ItemImageLink`、`UserNote` 等横切对象
- migration 只做增量扩展
