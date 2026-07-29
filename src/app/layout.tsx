import type { Metadata } from "next";
import "../globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "ORBIT Enterprise Platform",
  description: "Engineering Evaluation Sheet Workflow Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}