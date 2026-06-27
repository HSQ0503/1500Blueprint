import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { canEditSet, getSetForViewer } from "@/lib/flashcards/queries";
import { SetDetail } from "@/components/flashcards/SetDetail";

export default async function SetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const set = await getSetForViewer(id, session.email);
  if (!set) notFound();

  const editable = await canEditSet(id, session.email);
  return <SetDetail set={set} editable={editable} />;
}
