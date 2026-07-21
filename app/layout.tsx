import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Industrial Depot Analytics",
    default: "Industrial Depot Analytics",
  },
  description:
    "Dashboard privado de analítica web para TheIndustrialDepot.com — métricas de Google Analytics 4 en tiempo real.",
  robots: { index: false, follow: false },
  icons: { icon: "/logo.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
