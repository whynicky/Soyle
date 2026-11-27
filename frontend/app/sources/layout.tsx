import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Источники и методика · Söyle",
  description: "Как создаются задания Söyle, какие источники помогают их разрабатывать и как локальный помощник подбирает ответы родителям.",
};

export default function SourcesLayout({ children }: { children: ReactNode }) {
  return <LegalPageLayout>{children}</LegalPageLayout>;
}
