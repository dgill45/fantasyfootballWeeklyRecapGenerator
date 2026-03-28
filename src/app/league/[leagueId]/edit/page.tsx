import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateLeague } from "@/app/league/actions";
import EditLeagueForm from "./EditLeagueForm";

export default async function EditLeaguePage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;
  const id = parseInt(leagueId, 10);

  const league = await prisma.league.findUnique({
    where: { id },
    include: { teams: { orderBy: { name: "asc" } } },
  });

  if (!league) notFound();

  const action = updateLeague.bind(null, id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/league/${id}`}
          className="text-sm text-gray-500 hover:text-green-600 underline"
        >
          ← Back to {league.name}
        </Link>
        <h1 className="text-2xl font-extrabold text-gray-900 mt-2">Edit League</h1>
      </div>

      <EditLeagueForm league={league} action={action} />
    </div>
  );
}
