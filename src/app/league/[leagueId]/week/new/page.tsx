import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createWeekWithMatchups } from "../actions";
import WeekForm from "./WeekForm";

// Fetches league teams and passes them (and a bound action) down to the form
export default async function NewWeekPage({
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

  // Bind the leagueId so the form action knows which league it belongs to
  const action = createWeekWithMatchups.bind(null, id);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500 mb-1">
          <a href={`/league/${id}`} className="underline hover:text-green-600">
            ← {league.name}
          </a>
        </p>
        <h1 className="text-2xl font-extrabold text-gray-900">Add a Week</h1>
        <p className="text-gray-500 mt-1">
          Enter matchup scores and a recap will be generated automatically.
        </p>
      </div>

      <WeekForm teams={league.teams} action={action} />
    </div>
  );
}
