"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileSidebar } from "@/components/layout/MobileSidebar";
import type { ComparisonPeriod } from "@/lib/types/common";
import { SessionProvider } from "next-auth/react";

function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [period, setPeriod] = useState<ComparisonPeriod>("30d");

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
          ga4Connected={false}
        />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ga4Connected={false}
      />

      {/* Main content area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Header
          period={period}
          onPeriodChange={setPeriod}
          onMenuToggle={() => setMobileOpen(true)}
          userName="Administrador"
          alertCount={0}
        />
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
          {children}
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
