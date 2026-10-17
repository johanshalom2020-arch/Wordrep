import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Documents — Folio",
  description: "Your documents. Free forever, saved on your own server.",
};

export default function EditorLayout({ children }: { children: ReactNode }) {
  return children;
}
