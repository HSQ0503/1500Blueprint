import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/auth/admin";
import { canEditSet, getSetForViewer } from "@/lib/flashcards/queries";
import { SetEditor } from "@/components/flashcards/SetEditor";

export default async function EditSetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const set = await getSetForViewer(id, session.email);
  if (!set) notFound();
  if (!(await canEditSet(id, session.email))) redirect(`/flashcards/${id}`);

  return (
    <SetEditor
      mode="edit"
      setId={set.id}
      initial={{
        title: set.title,
        description: set.description ?? "",
        visibility: set.visibility,
        cards: set.cards.map((c) => ({ term: c.term, definition: c.definition })),
      }}
      allowSharing={isAdminEmail(session.email)}
      backHref={`/flashcards/${id}`}
    />
  );
}
