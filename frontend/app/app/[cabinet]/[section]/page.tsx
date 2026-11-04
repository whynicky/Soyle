import { notFound } from "next/navigation";
import { SoyleApp } from "@/components/SoyleApp";
import { workspacePages } from "@/lib/workspacePages";

export default async function WorkspacePage({ params }: { params: Promise<{ cabinet: string; section: string }> }) {
  const { cabinet, section } = await params;
  if ((cabinet !== "parent" && cabinet !== "admin") || !workspacePages[cabinet].some(page => page.slug === section)) notFound();
  return <SoyleApp/>;
}
