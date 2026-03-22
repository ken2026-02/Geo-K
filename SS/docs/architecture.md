# App 开发总体架构（稳定版）

## 1. 产品路线

采用 C 路线：

1. 外部 AI 负责预处理原始报告、词句、图像和结构化候选结果。
2. App 将预处理结果导入 `Inbox`，形成待审核批次。
3. 用户在 `Inbox` 中筛选、修正、批准或拒绝条目。
4. 通过审核的数据进入 `Approved Library`。
5. 正式库对搜索、学习、识别、关系积累和长期知识沉淀提供服务。

## 2. 产品定位

本产品定位为：

- 离线优先
- 移动端友好
- 规则驱动
- 可持续扩展
- 面向个人工程知识管理

核心目标不是“在线协作平台”，而是“个人长期知识资产库”。

## 3. 核心模块

- `Rule Center`
- `Import / Inbox`
- `Language Library`
- `Geo Material Library`
- `Feature Library`
- `Strategy / Method Library`
- `Review / Learning`
- `Backup / Restore / Settings`

## 4. 核心知识对象

- `ImportBatch`
- `Report`
- `Word`
- `Phrase`
- `Sentence`
- `GeoMaterial`
- `GeoFeature`
- `Strategy`
- `ImageAsset`
- `ItemSource`
- `UserNote`
- `ReviewLog`
- `Favorite`
- `Tag`
- `RuleSet`
- `BackupSnapshot`

这些对象都应具备稳定 `id`、创建时间、更新时间、来源信息和版本兼容空间。

## 5. 技术架构

### 前端层

- `React + TypeScript`
- `PWA` 支持安装、缓存、离线启动和移动端使用

### 数据层

- `SQLite (sql.js / WASM)` 作为主数据库
- `IndexedDB` 用于持久化 SQLite 数据库文件和资源缓存
- 图片资源与主数据库解耦存储
- 支持 `schema version + migration`

### 运行原则

- `local-first`
- 数据操作事务化
- 导入、审核、恢复均可回滚
- 所有规则和知识对象可持续扩展

## 6. 数据库架构原则

- `Pending` 与 `Approved` 逻辑分离
- 事务安全
- 可回滚
- 可迁移
- 规则驱动
- 对象化数据结构
- 图片与主数据解耦

建议实现上将“状态”作为统一抽象，但在查询、索引和审核流程上明确区分：

- 待审核区：高吞吐、高筛选效率
- 正式库：高查询质量、高关系可追溯性

## 7. 图片架构原则

- 单个条目可绑定多张图片
- 导入时自动压缩
- 默认生成 `thumbnail` 与 `standard`
- `original` 为可选保留
- 格式优先使用 `WebP`
- 支持备份与恢复
- 图片元数据独立管理

推荐资源层拆分为两部分：

1. `ImageAsset` 元数据表
2. 二进制资源缓存或文件块存储

这样可以避免主库膨胀，并降低迁移复杂度。

## 8. 页面架构

### 一级页面

- `Inbox`
- `Library`
- `Review`
- `Backup / Settings`

### Library 子页面

- `Search`
- `Words`
- `Phrases`
- `Sentences`
- `Geo Materials`
- `Features`
- `Strategies`
- `Favorites`

## 9. 必须支持的关联能力

- `Word -> related phrases -> related sentences`
- `Phrase -> related sentences -> source reports`
- `GeoMaterial -> related features -> related strategies -> related images`
- `Feature -> related report expressions -> related treatment strategies`
- `Any item -> source report / source sentence / images / user notes`

关系查看器必须支持：

- 正反向关系
- 来源回溯
- 上下文片段预览
- 多跳跳转

## 10. 审核效率要求

- 快速筛选
- 快速多选
- 批量 approve / reject
- 批量改分类
- 快速查看上下文
- 重复项快速处理
- 手机端单手高效操作

因此 `Inbox` 设计必须优先于“精美详情页”，先保证高频审核动作最短路径完成。

## 11. 备份恢复要求

- `full backup`
- `full restore`
- `partial export`
- `partial restore`
- `pre-import snapshot`
- `pre-restore snapshot`
- `schema compatibility check`

所有导入和恢复动作都应支持创建快照，确保误操作可回退。

## 12. 可扩展要求

后期应能通过以下扩展方式演进而不破坏旧数据：

- 新对象类型
- 新分类规则
- 新详情模板
- 新页面视图

设计要求：

- 核心表稳定
- 扩展字段尽量对象化或模板化
- 关系表使用通用设计
- 详情页由对象类型和模板驱动

## 13. 第一阶段开发重点

- `Rule Center` 基础版本
- `Import / Inbox`
- `Approved Library`
- `Image processing pipeline`
- `Search and relation viewer`
- `Backup / Restore`
- `Basic Review`

## 14. 建议的应用分层

### 表现层

- 页面路由
- 响应式布局
- 移动端操作组件
- 列表、筛选、详情、关系查看器

### 应用层

- 导入编排
- 审核编排
- 搜索与关系查询
- 备份恢复编排
- 规则执行服务

### 领域层

- 各知识对象模型
- 状态流转规则
- 重复项判定规则
- 关联规则

### 基础设施层

- SQLite 仓储
- IndexedDB 持久化
- 图片处理与缓存
- schema migration
- PWA 缓存策略

## 15. 稳定版架构结论

本架构的核心不是“把所有知识对象堆到一个库里”，而是建立一条稳定数据链：

`外部预处理 -> Inbox 审核 -> Approved Library -> Search / Review / Learning -> Backup / Restore`

只要这条主链稳定，后续新增对象类型、规则、模板和页面都可以在不破坏旧数据结构的前提下继续扩展。
