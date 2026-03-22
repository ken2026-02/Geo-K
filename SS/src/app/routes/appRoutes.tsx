import { Navigate, type RouteObject } from "react-router-dom";

import { InboxBatchPage } from "../../pages/inbox/InboxBatchPage";
import { InboxPage } from "../../pages/inbox/InboxPage";
import { LibraryDetailPage } from "../../pages/library/LibraryDetailPage";
import { LibraryListPage } from "../../pages/library/LibraryListPage";
import { LibraryPage } from "../../pages/library/LibraryPage";
import { LibrarySearchPage } from "../../pages/library/LibrarySearchPage";
import { LearningImportPage } from "../../pages/learning/LearningImportPage";
import { LearningManagePage } from "../../pages/learning/LearningManagePage";
import { LearningStudyPage } from "../../pages/learning/LearningStudyPage";
import { ReviewPage } from "../../pages/review/ReviewPage";
import { RuleCenterPage } from "../../pages/rule-center/RuleCenterPage";
import { SettingsPage } from "../../pages/settings/SettingsPage";

export const appRoutes: RouteObject[] = [
  {
    path: "/",
    element: <InboxPage />
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


