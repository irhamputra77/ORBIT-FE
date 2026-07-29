import type { LucideIcon } from "lucide-react";

export type DashboardMetric = {
  label: string;
  value: string | number;
  helper: string;
  color: string;
  icon: LucideIcon;
  path: string;
  disabled?: boolean;
};

export type DashboardOperator = {
  id: string | null;
  code: string | null;
  name: string | null;
};

export type DashboardServiceBulletin = {
  id: string;
  bulletinNumber: string;
  revision: string;
  title: string;
  manufacturer: string | null;
  operator: DashboardOperator | null;
  fleet: string | null;
  category: number | null;
  impactType: string | null;
  status: string;
  receivedAt: string;
  createdAt: string;
};

export type DashboardApprovalActivity = {
  id: string;
  status: string;
  submittedAt: string;
  eesNumber: string;
  bulletinNumber: string;
};

export type DashboardCategoryReview = {
  category: number;
  label: string;
  count: number;
  percentage: number;
};

export type EngineeringReviewSummary = {
  serviceBulletins: {
    newCount: number;
    unreadCount: number;
    recent: DashboardServiceBulletin[];
  };
  secondEngineerApprovals: {
    pendingCount: number;
    recentActivityCount: number;
    recent: DashboardApprovalActivity[];
  };
  monthlyReviews: {
    month: string;
    timezone: string;
    totalReviewed: number;
    approved: number;
    rejected: number;
    returned: number;
    byCategory: DashboardCategoryReview[];
  };
};

export type EngineeringReviewSummaryResponse = {
  message: string;
  data: EngineeringReviewSummary;
};

export type EngineeringReviewSummaryParams = {
  month?: string;
  operatorId?: string;
};
