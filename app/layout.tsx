import type { Metadata } from "next";
import "./globals.css";
import { SidebarProvider } from "./context/SidebarContext";
import { ProfileProvider } from "./context/ProfileContext";
import LayoutInner from "./components/LayoutInner";

export const metadata: Metadata = {
  title: "Dashboard Logistic",
  description: "Detail kargo dan manajemen armada operasi logistik",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
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
