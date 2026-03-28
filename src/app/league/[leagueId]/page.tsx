import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { deleteWeek } from "./week/actions";

// League home page — shows teams and all entered weeks with links to recaps
export default async function LeaguePage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;
  const id = parseInt(leagueId, 10);

  const league = await prisma.league.findUnique({
    where: { id },
    include: {
      teams: { orderBy: { name: "asc" } },
      weeks: {
        orderBy: { weekNumber: "asc" },
        include: { recap: true }, // know if a recap exists so we can link to it
      },
    },
  });

  if (!league) notFound();

  return (
    <div className="space-y-8">
      {/* League header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">{league.name}</h1>
          <p className="text-gray-500 mt-1">{league.seasonYear} Season</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            href={`/league/${league.id}/standings`}
            className="border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Standings
          </Link>
          <Link
            href={`/league/${league.id}/edit`}
            className="border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Edit League
          </Link>
          <Link
            href={`/league/${league.id}/week/new`}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            + Add Week
          </Link>
        </div>
      </div>

      {/* Teams grid */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-3">
          Teams ({league.teams.length})
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {league.teams.map((team) => (
            <div
              key={team.id}
              className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700"
            >
              🏈 {team.name}
            </div>
          ))}
        </div>
      </div>

      {/* Weeks list */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-3">Weekly Recaps</h2>
        {league.weeks.length === 0 ? (
          <div className="text-center py-10 bg-white border border-dashed border-gray-300 rounded-xl text-gray-500">
            <p className="text-2xl mb-2">📋</p>
            <p>No weeks yet. Add the first week to get started!</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {league.weeks.map((week) => {
              const boundDelete = deleteWeek.bind(null, league.id, week.id);
              return (
                <li key={week.id} className="flex items-center gap-2">
                  <Link
                    href={`/league/${league.id}/week/${week.id}`}
                    className="flex-1 flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3 hover:border-green-400 hover:shadow-sm transition-all"
                  >
                    <span className="font-semibold text-gray-900">
                      Week {week.weekNumber}
                    </span>
                    <span className="text-sm text-green-600 font-medium">
                      {week.recap ? "View Recap →" : "No recap yet"}
                    </span>
                  </Link>
                  <Link
                    href={`/league/${league.id}/week/${week.id}/edit`}
                    className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-3 bg-white hover:border-gray-300 transition-colors shrink-0"
                  >
                    Edit
                  </Link>
                  <form action={boundDelete}>
                    <button
                      type="submit"
                      className="text-xs text-red-500 hover:text-red-700 border border-red-200 rounded-lg px-3 py-3 bg-white hover:border-red-300 transition-colors shrink-0"
                    >
                      Delete
                    </button>
                  </form>
                </li>
              );
            })}

          </ul>
        )}
      </div>
    </div>
  );
}
