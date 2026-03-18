import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function StandingsPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;
  const id = parseInt(leagueId, 10);

  const league = await prisma.league.findUnique({
    where: { id },
    include: {
      weeks: {
        include: {
          matchups: {
            include: { teamA: true, teamB: true },
          },
        },
      },
    },
  });

  if (!league) notFound();

  const allMatchups = league.weeks.flatMap((w) => w.matchups);

  // Aggregate wins, losses, and total points per team across all weeks
  type Standing = {
    teamName: string;
    wins: number;
    losses: number;
    totalPoints: number;
    pointsAgainst: number;
  };

  const map = new Map<number, Standing>();

  for (const m of allMatchups) {
    if (!map.has(m.teamAId)) {
      map.set(m.teamAId, {
        teamName: m.teamA.name,
        wins: 0,
        losses: 0,
        totalPoints: 0,
        pointsAgainst: 0,
      });
    }
    if (!map.has(m.teamBId)) {
      map.set(m.teamBId, {
        teamName: m.teamB.name,
        wins: 0,
        losses: 0,
        totalPoints: 0,
        pointsAgainst: 0,
      });
    }

    const a = map.get(m.teamAId)!;
    const b = map.get(m.teamBId)!;

    a.totalPoints += m.scoreA;
    a.pointsAgainst += m.scoreB;
    b.totalPoints += m.scoreB;
    b.pointsAgainst += m.scoreA;

    if (m.scoreA > m.scoreB) {
      a.wins += 1;
      b.losses += 1;
    } else if (m.scoreB > m.scoreA) {
      b.wins += 1;
      a.losses += 1;
    }
    // ties: no win or loss recorded
  }

  const standings = Array.from(map.values()).sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.totalPoints - a.totalPoints;
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500">
        <Link href={`/league/${id}`} className="underline hover:text-green-600">
          ← {league.name}
        </Link>
      </div>

      {/* Header */}
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-green-600">
          {league.name} · {league.seasonYear}
        </p>
        <h1 className="text-2xl font-extrabold text-gray-900 mt-1">
          Season Standings
        </h1>
      </div>

      {standings.length === 0 ? (
        <div className="text-center py-10 bg-white border border-dashed border-gray-300 rounded-xl text-gray-500">
          <p className="text-2xl mb-2">📋</p>
          <p>No matchups recorded yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[2rem_1fr_4rem_4rem_6rem_6rem] gap-x-4 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <div>#</div>
            <div>Team</div>
            <div className="text-center">W</div>
            <div className="text-center">L</div>
            <div className="text-right">PF</div>
            <div className="text-right">PA</div>
          </div>

          {/* Rows */}
          {standings.map((s, i) => (
            <div
              key={s.teamName}
              className={`grid grid-cols-[2rem_1fr_4rem_4rem_6rem_6rem] gap-x-4 px-5 py-3 items-center text-sm ${
                i !== standings.length - 1 ? "border-b border-gray-100" : ""
              }`}
            >
              {/* Rank badge */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${
                  i === 0
                    ? "bg-yellow-400 text-yellow-900"
                    : i === 1
                    ? "bg-gray-300 text-gray-700"
                    : i === 2
                    ? "bg-amber-600 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {i + 1}
              </div>

              <div className="font-semibold text-gray-900 truncate">
                {s.teamName}
              </div>
              <div className="text-center font-mono text-gray-700">{s.wins}</div>
              <div className="text-center font-mono text-gray-700">{s.losses}</div>
              <div className="text-right font-mono text-gray-700">
                {s.totalPoints.toFixed(2)}
              </div>
              <div className="text-right font-mono text-gray-400">
                {s.pointsAgainst.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
