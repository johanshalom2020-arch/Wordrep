import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Folio — The free & open-source word processor",
  description:
    "Write beautifully, save real .docx files, and keep everything on your own server. Folio is a free and open-source word processor: paged editing, DOCX import/export, autosave to your database, zero telemetry, zero cost.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="grain bg-ink font-sans text-paper antialiased">{children}</body>
    </html>
  );
}
