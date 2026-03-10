import Link from "next/link";
import { prisma } from "@/lib/prisma";

// Landing page — explains the app and lets the commissioner create a league
export default async function HomePage() {
  // Show existing leagues so commissioners can get back to their league quickly
  const leagues = await prisma.league.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="space-y-10">
      {/* Hero section */}
      <div className="text-center space-y-4 pt-4">
        <div className="text-6xl">🏆</div>
        <h1 className="text-3xl font-extrabold text-gray-900">
          Fantasy League Weekly Recap
        </h1>
        <p className="text-gray-600 text-lg max-w-xl mx-auto">
          Enter your weekly matchup results and get a fun, shareable recap page
          your whole league will actually want to read.
        </p>
        <Link
          href="/league/new"
          className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg text-lg transition-colors"
        >
          Create a League →
        </Link>
      </div>

      {/* How it works */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="text-xl font-bold text-gray-800">How it works</h2>
        <ol className="space-y-3 text-gray-700">
          <li className="flex gap-3">
            <span className="font-bold text-green-600 shrink-0">1.</span>
            <span>Create your league with team names.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-green-600 shrink-0">2.</span>
            <span>After each week, enter the matchup scores.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-green-600 shrink-0">3.</span>
            <span>
              A recap page is automatically generated — share the link with your
              league.
            </span>
          </li>
        </ol>
      </div>

      {/* Existing leagues */}
      {leagues.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-gray-800">Your Leagues</h2>
          <ul className="space-y-2">
            {leagues.map((league) => (
              <li key={league.id}>
                <Link
                  href={`/league/${league.id}`}
                  className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3 hover:border-green-400 hover:shadow-sm transition-all"
                >
                  <span className="font-semibold text-gray-900">
                    {league.name}
                  </span>
                  <span className="text-gray-500 text-sm">
                    {league.seasonYear} →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
