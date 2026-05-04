"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

// Creates a new league along with its teams, then redirects to the league page
export async function createLeague(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const name = (formData.get("name") as string)?.trim();
  const seasonYear = parseInt(formData.get("seasonYear") as string, 10);

  if (!name || Number.isNaN(seasonYear)) {
    return { error: "Please provide a league name and a valid season year." };
  }

  // Collect, trim, and deduplicate team names — skip blanks
  const rawTeamNames: string[] = Array.from(formData.entries())
    .filter(([key]) => key.startsWith("teamName_"))
    .map(([, value]) => (value as string).trim())
    .filter((n) => n.length > 0);

  const teamNames = [...new Set(rawTeamNames)];

  if (teamNames.length < 2) {
    return { error: "Please provide at least 2 team names." };
  }

  const league = await prisma.league.create({
    data: {
      name,
      seasonYear,
      teams: {
        create: teamNames.map((teamName) => ({ name: teamName })),
      },
    },
  });

  redirect(`/league/${league.id}`);
}

// Updates an existing league's name/year and adds any new teams.
// Existing teams are not modified — they're tied to matchup history.
export async function updateLeague(
  leagueId: number,
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const name = (formData.get("name") as string)?.trim();
  const seasonYear = parseInt(formData.get("seasonYear") as string, 10);

  if (!name || Number.isNaN(seasonYear)) {
    return { error: "League name and a valid season year are required." };
  }

  // Collect, trim, and deduplicate new team names — skip blanks
  const rawNewTeamNames: string[] = Array.from(formData.entries())
    .filter(([key]) => key.startsWith("newTeam_"))
    .map(([, value]) => (value as string).trim())
    .filter((n) => n.length > 0);

  const newTeamNames = [...new Set(rawNewTeamNames)];

  // Filter out teams that already exist in this league to avoid crashing
  // on the unique constraint. Silently skip duplicates — the DB already has them.
  let teamsToCreate: string[] = [];
  if (newTeamNames.length > 0) {
    const existingTeams = await prisma.team.findMany({
      where: { leagueId },
      select: { name: true },
    });
    const existingNames = new Set(existingTeams.map((t) => t.name));
    teamsToCreate = newTeamNames.filter((n) => !existingNames.has(n));
  }

  await prisma.league.update({
    where: { id: leagueId },
    data: {
      name,
      seasonYear,
      ...(teamsToCreate.length > 0 && {
        teams: { create: teamsToCreate.map((n) => ({ name: n })) },
      }),
    },
  });

  redirect(`/league/${leagueId}`);
}
