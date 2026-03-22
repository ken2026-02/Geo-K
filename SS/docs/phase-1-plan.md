# 第一阶段实施方案

## 1. 目标范围

第一阶段只解决主链路闭环：

`导入 -> 待审核 -> 批准入库 -> 搜索 -> 关系查看 -> 备份恢复`

不在第一阶段优先处理：

- 高级学习算法
- 复杂自动推荐
- 多人协作
- 云同步
- 高定制可视化报表

## 2. 功能切分

### A. Rule Center 基础版

- 查看规则集
- 启用或停用规则
- 支持基础分类规则
- 支持重复项判定规则

### B. Import / Inbox

- 导入外部 AI 预处理结果
- 建立 `ImportBatch`
- 展示待审核条目列表
- 支持单条和批量 `approve / reject`
- 支持批量改分类
- 支持上下文预览和重复项处理

### C. Approved Library

- 多对象统一搜索入口
- 分类浏览
- 详情页
- 来源查看
- 关系跳转

### D. Image Processing Pipeline

- 图片导入
- 压缩
- 生成 `thumbnail`、`standard`
- 可选保留 `original`
- 建立图片元数据

### E. Search and Relation Viewer

- 关键字搜索
- 对象类型切换
- 关联链路查看
- 来源句和来源报告回溯

### F. Backup / Restore

- 全量备份
- 全量恢复
- 导入前快照
- 恢复前快照
- schema compatibility check

### G. Basic Review

- 基础复习列表
- 最近查看记录
- 收藏项复习入口

## 3. 推荐前端目录结构

```text
src/
  app/
    routes/
    providers/
  pages/
    inbox/
    library/
    review/
    settings/
  features/
    import/
    approval/
    search/
    relations/
    backup/
    rules/
    images/
  domain/
    models/
    services/
    rules/
  data/
    db/
    repositories/
    migrations/
    idb/
  shared/
    ui/
    utils/
    types/
```

## 4. 推荐数据流

1. 外部 AI 输出结构化 JSON 和图片资源
2. 导入器校验 schema 与文件完整性
3. 创建 `ImportBatch` 与待审核对象
4. 执行规则集，生成分类、去重和关系建议
5. 用户在 `Inbox` 审核
6. 审核通过的对象进入正式查询范围
7. 搜索和关系查看基于正式库运行
8. 导入和恢复前自动创建快照

## 5. 推荐 UI 优先级

移动端优先级应按以下顺序实现：

1. `Inbox` 列表高效操作
2. `Library Search`
3. `Item Detail + Relation Viewer`
4. `Backup / Restore`
5. `Review`

原因很直接：没有高效率审核，正式库质量会迅速下降。

## 6. 技术决策基线

- 前端采用 `React + TypeScript`
- 数据库采用 `sql.js` 驱动的 SQLite WASM
- 数据库存储到 `IndexedDB`
- 图片资源单独缓存并记录元数据
- 以 migration 保障 schema 演进
- 所有核心写操作走事务

## 7. 第一阶段完成标准

满足以下条件即可视为阶段一闭环完成：

- 可以导入一批预处理结果
- 可以在手机端高效审核和批量处理
- 可以把批准结果写入正式库
- 可以按对象类型搜索
- 可以查看来源和关联链路
- 可以完成全量备份与恢复
- schema 升级后旧数据仍可迁移
