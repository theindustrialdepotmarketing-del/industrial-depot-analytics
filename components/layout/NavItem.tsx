"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
  collapsed?: boolean;
}

export function NavItem({ href, icon: Icon, label, badge, collapsed = false }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`nav-item ${isActive ? "active" : ""}`}
      title={collapsed ? label : undefined}
      style={collapsed ? { justifyContent: "center", padding: "0.625rem" } : {}}
    >
      <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
      {!collapsed && (
        <>
          <span style={{ flex: 1 }}>{label}</span>
          {badge !== undefined && badge > 0 && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "18px",
                height: "18px",
                borderRadius: "9px",
                background: badge > 0 ? "#1e9bd7" : "transparent",
                color: "#fff",
                fontSize: "0.65rem",
                fontWeight: 700,
                padding: "0 4px",
              }}
            >
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
}
