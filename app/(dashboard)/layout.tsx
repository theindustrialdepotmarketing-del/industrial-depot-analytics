"use client";

import React, { useState, Suspense } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileSidebar } from "@/components/layout/MobileSidebar";
import type { ComparisonPeriod } from "@/lib/types/common";
import { SessionProvider } from "next-auth/react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

function HeaderWithSearchParams({
  onMenuToggle,
}: {
  onMenuToggle: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPeriodParam = (searchParams.get("period") as ComparisonPeriod) || "30d";

  const handlePeriodChange = (newPeriod: ComparisonPeriod) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", newPeriod);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Header
      period={currentPeriodParam}
      onPeriodChange={handlePeriodChange}
      onMenuToggle={onMenuToggle}
      userName="Administrador"
      alertCount={0}
    />
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--bg-primary)",
      }}
    >
      {/* Desktop Sidebar */}
      <div style={{ display: "none" }} id="desktop-sidebar-wrapper">
        <style>{`
          @media (min-width: 769px) {
            #desktop-sidebar-wrapper { display: flex !important; }
          }
        `}</style>
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((c) => !c)}
          ga4Connected={true}
        />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ga4Connected={true}
      />

      {/* Main content area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Suspense fallback={<div style={{ height: "72px", background: "var(--bg-secondary)" }} />}>
          <HeaderWithSearchParams onMenuToggle={() => setMobileOpen(true)} />
        </Suspense>

        <main
          style={{
            flex: 1,
            padding: "1.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.75rem",
            maxWidth: "1440px",
            width: "100%",
            margin: "0 auto",
          }}
        >
          <Suspense fallback={
            <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
              <LoadingSpinner size={32} color="#1e9bd7" />
            </div>
          }>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <DashboardShell>{children}</DashboardShell>
    </SessionProvider>
  );
}
