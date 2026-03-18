import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateWeekMatchups } from "../../actions";
import EditWeekForm from "./EditWeekForm";

export default async function EditWeekPage({
  params,
}: {
  params: Promise<{ leagueId: string; weekId: string }>;
}) {
  const { leagueId, weekId } = await params;
  const lid = parseInt(leagueId, 10);
  const wid = parseInt(weekId, 10);

  const week = await prisma.week.findUnique({
    where: { id: wid },
    include: {
      league: true,
      matchups: {
        include: { teamA: true, teamB: true },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!week || week.leagueId !== lid) notFound();

  const action = updateWeekMatchups.bind(null, lid, wid);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500 mb-1">
          <Link
            href={`/league/${lid}/week/${wid}`}
            className="underline hover:text-green-600"
          >
            ← Week {week.weekNumber} Recap
          </Link>
        </p>
        <h1 className="text-2xl font-extrabold text-gray-900">
          Edit Week {week.weekNumber}
        </h1>
        <p className="text-gray-500 mt-1">
          Correct the scores below and the recap will be regenerated.
        </p>
      </div>

      <EditWeekForm
        weekNumber={week.weekNumber}
        matchups={week.matchups.map((m) => ({
          id: m.id,
          teamAName: m.teamA.name,
          teamBName: m.teamB.name,
          scoreA: m.scoreA,
          scoreB: m.scoreB,
        }))}
        action={action}
      />
    </div>
  );
}
