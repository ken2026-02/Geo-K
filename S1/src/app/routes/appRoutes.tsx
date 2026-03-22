import { lazy } from "react";
import { Navigate, type RouteObject } from "react-router-dom";

const InboxBatchPage = lazy(() => import("../../pages/inbox/InboxBatchPage").then((module) => ({ default: module.InboxBatchPage })));
const InboxPage = lazy(() => import("../../pages/inbox/InboxPage").then((module) => ({ default: module.InboxPage })));
const LibraryDetailPage = lazy(() => import("../../pages/library/LibraryDetailPage").then((module) => ({ default: module.LibraryDetailPage })));
const LibraryListPage = lazy(() => import("../../pages/library/LibraryListPage").then((module) => ({ default: module.LibraryListPage })));
const LibraryPage = lazy(() => import("../../pages/library/LibraryPage").then((module) => ({ default: module.LibraryPage })));
const LibrarySearchPage = lazy(() => import("../../pages/library/LibrarySearchPage").then((module) => ({ default: module.LibrarySearchPage })));
const LearningImportPage = lazy(() => import("../../pages/learning/LearningImportPage").then((module) => ({ default: module.LearningImportPage })));
const LearningManagePage = lazy(() => import("../../pages/learning/LearningManagePage").then((module) => ({ default: module.LearningManagePage })));
const LearningStudyPage = lazy(() => import("../../pages/learning/LearningStudyPage").then((module) => ({ default: module.LearningStudyPage })));
const ReviewPage = lazy(() => import("../../pages/review/ReviewPage").then((module) => ({ default: module.ReviewPage })));
const RuleCenterPage = lazy(() => import("../../pages/rule-center/RuleCenterPage").then((module) => ({ default: module.RuleCenterPage })));
const SettingsPage = lazy(() => import("../../pages/settings/SettingsPage").then((module) => ({ default: module.SettingsPage })));
const AuditPage = lazy(() => import("../../pages/audit/AuditPage").then((module) => ({ default: module.AuditPage })));

export const appRoutes: RouteObject[] = [
  {
    path: "/",
    element: <Navigate to="/learning/import" replace />
  },
  {
    path: "/inbox",
    element: <InboxPage />
  },
  {
    path: "/audit",
    element: <AuditPage />
  },
  {
    path: "/inbox/:batchId",
    element: <InboxBatchPage />
  },
  {
    path: "/rules",
    element: <RuleCenterPage />
  },
  {
    path: "/library",
    element: <LibraryPage />
  },
  {
    path: "/library/search",
    element: <LibrarySearchPage />
  },
  {
    path: "/library/:section",
    element: <LibraryListPage />
  },
  {
    path: "/library/:section/:itemId",
    element: <LibraryDetailPage />
  },
  {
    path: "/review",
    element: <ReviewPage />
  },
  {
    path: "/learning",
    element: <Navigate to="/learning/import" replace />
  },
  {
    path: "/learning/import",
    element: <LearningImportPage />
  },
  {
    path: "/learning/manage",
    element: <LearningManagePage />
  },
  {
    path: "/learning/study",
    element: <LearningStudyPage />
  },
  {
    path: "/settings",
    element: <SettingsPage />
  }
];


