"use client";

import { AppProvider } from './(orbit)/context/AppContext';
import { ServiceBulletinUploadProvider } from '@/features/service-bulletins';
import { ShopVisitReportUploadProvider } from '@/features/database/hooks/useShopVisitReportUploadTask';
import { EdsUploadProvider } from '@/features/database/hooks/useEdsUploadTask';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <ServiceBulletinUploadProvider>
        <ShopVisitReportUploadProvider>
          <EdsUploadProvider>
            {children}
          </EdsUploadProvider>
        </ShopVisitReportUploadProvider>
      </ServiceBulletinUploadProvider>
    </AppProvider>
  );
}
