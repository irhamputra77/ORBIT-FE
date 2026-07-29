export const featureFlags = {
  engineeringDashboard:
    process.env.NEXT_PUBLIC_ENABLE_ENGINEERING_DASHBOARD === "true",
  eesApproval: process.env.NEXT_PUBLIC_ENABLE_EES_APPROVAL === "true",
} as const;
