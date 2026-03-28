import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { PowerRankingEntry } from "@/lib/generateRecap";

// The public recap page — shareable with anyone in the league.
// All data is pre-generated and stored; this page just displays it.
export default async function RecapPage({
  params,
}: {
  params: Promise<{ leagueId: string; weekId: string }>;
}) {
  const { leagueId, weekId } = await params;

  const week = await prisma.week.findUnique({
    where: { id: parseInt(weekId, 10) },
    include: {
      league: true,
      matchups: {
        include: { teamA: true, teamB: true },
        orderBy: { id: "asc" },
      },
      recap: true,
    },
  });

  if (!week || week.leagueId !== parseInt(leagueId, 10)) notFound();
  if (!week.recap) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-2xl mb-2">⏳</p>
        <p>Recap not generated yet.</p>
      </div>
    );
  }

  // Parse stored JSON fields back into their typed shapes
  const headlines: string[] = JSON.parse(week.recap.headlines);
  const matchupRecaps: string[] = JSON.parse(week.recap.storyline);
  const callouts: { biggestWin: string; worstLoss: string; teamInTrouble: string; teamToWatch: string } = JSON.parse(week.recap.awards);
  const powerRankings: PowerRankingEntry[] = JSON.parse(week.recap.powerRankings);

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500">
        <Link href={`/league/${leagueId}`} className="underline hover:text-green-600">
          ← {week.league.name}
        </Link>
      </div>

      {/* Page header */}
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold uppercase tracking-widest text-green-600">
          {week.league.name} · {week.league.seasonYear} · Week {week.weekNumber}
        </p>
        <h1 className="text-3xl font-extrabold text-gray-900">
          {week.recap.title || `Week ${week.weekNumber} Recap`}
        </h1>
        <p className="text-gray-500 text-sm">
          {week.matchups.length} matchup{week.matchups.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Headlines */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2">
          📰 Headlines
        </h2>
        <ul className="space-y-2">
          {headlines.map((h, i) => (
            <li
              key={i}
              className="bg-green-50 border-l-4 border-green-500 px-4 py-3 text-sm font-semibold text-gray-800 rounded-r-lg"
            >
              {h}
            </li>
          ))}
        </ul>
      </section>

      {/* Matchup results */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2">
          🏈 Matchup Results
        </h2>
        <div className="space-y-3">
          {week.matchups.map((m) => {
            const aWon = m.scoreA > m.scoreB;
            const bWon = m.scoreB > m.scoreA;
            return (
              <div
                key={m.id}
                className="bg-white border border-gray-200 rounded-xl px-5 py-4"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Team A */}
                  <div className={`flex-1 text-right ${aWon ? "font-bold text-gray-900" : "text-gray-500"}`}>
                    <div className="text-sm">{m.teamA.name}</div>
                    <div className={`text-2xl ${aWon ? "text-green-600" : ""}`}>
                      {m.scoreA.toFixed(2)}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="text-gray-400 font-bold text-sm shrink-0">vs</div>

                  {/* Team B */}
                  <div className={`flex-1 text-left ${bWon ? "font-bold text-gray-900" : "text-gray-500"}`}>
                    <div className="text-sm">{m.teamB.name}</div>
                    <div className={`text-2xl ${bWon ? "text-green-600" : ""}`}>
                      {m.scoreB.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Matchup Recaps */}
      {matchupRecaps.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2">
            📖 Matchup Recaps
          </h2>
          <div className="space-y-4">
            {week.matchups.map((m, i) => (
              <div key={m.id} className="bg-white border border-gray-200 rounded-xl px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                  {m.teamA.name} vs {m.teamB.name}
                </p>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {matchupRecaps[i] ?? ""}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Weekly Callouts */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2">
          🏅 Weekly Callouts
        </h2>
        <div className="space-y-3">
          {(
            [
              { label: "Biggest Win", value: callouts.biggestWin },
              { label: "Worst Loss", value: callouts.worstLoss },
              { label: "Team in Trouble", value: callouts.teamInTrouble },
              { label: "Team to Watch", value: callouts.teamToWatch },
            ] as const
          ).map(({ label, value }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl px-5 py-4">
              <p className="font-bold text-gray-900 text-sm">{label}</p>
              <p className="text-gray-600 text-sm mt-1">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Power Rankings */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2">
          📊 Power Rankings
        </h2>
        <div className="space-y-2">
          {powerRankings.map((entry) => (
            <div
              key={entry.rank}
              className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-5 py-3"
            >
              {/* Rank badge */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0 ${
                  entry.rank === 1
                    ? "bg-yellow-400 text-yellow-900"
                    : entry.rank === 2
                    ? "bg-gray-300 text-gray-700"
                    : entry.rank === 3
                    ? "bg-amber-600 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {entry.rank}
              </div>
              {/* Team name */}
              <div className="flex-1 font-semibold text-gray-900 text-sm">
                {entry.teamName}
              </div>
              {/* Record */}
              <div className="text-sm text-gray-500 shrink-0">
                {entry.wins}–{entry.losses}
              </div>
              {/* Total points */}
              <div className="text-sm font-mono text-gray-700 shrink-0">
                {entry.totalPoints.toFixed(2)} pts
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer nav */}
      <div className="pt-4 flex items-center justify-between text-sm text-gray-400">
        <Link href={`/league/${leagueId}`} className="underline hover:text-green-600">
          ← Back to {week.league.name}
        </Link>
        <Link
          href={`/league/${leagueId}/week/${weekId}/edit`}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
        >
          Edit Scores
        </Link>
      </div>
    </div>
  );
}
