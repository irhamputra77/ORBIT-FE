"use client";

import { AppProvider } from './(orbit)/context/AppContext';
import { ServiceBulletinUploadProvider } from '@/features/service-bulletins';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <ServiceBulletinUploadProvider>{children}</ServiceBulletinUploadProvider>
    </AppProvider>
  );
}
