import type { Metadata } from "next";
import "./globals.css";
import { SidebarProvider } from "./context/SidebarContext";
import { ProfileProvider } from "./context/ProfileContext";
import LayoutInner from "./components/LayoutInner";

export const metadata: Metadata = {
  title: "Dashboard Logistic",
  description: "Detail kargo TRC-204 dan manajemen armada operasi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className="h-full antialiased"
    >
      <body className="min-h-full bg-[#f8fafc] text-slate-800 antialiased">
        <ProfileProvider>
          <SidebarProvider>
            <LayoutInner>{children}</LayoutInner>
          </SidebarProvider>
        </ProfileProvider>
      </body>
    </html>
  );
}
