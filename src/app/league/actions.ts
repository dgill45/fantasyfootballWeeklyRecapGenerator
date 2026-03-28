"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

// Creates a new league along with its teams, then redirects to the league page
export async function createLeague(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const name = formData.get("name") as string;
  const seasonYear = parseInt(formData.get("seasonYear") as string, 10);

  // Collect all teamName_N entries from the form.
  // We use Array.from() to avoid TS iterator compatibility issues.
  const teamNames: string[] = Array.from(formData.entries())
    .filter(([key, value]) => key.startsWith("teamName_") && typeof value === "string" && (value as string).trim())
    .map(([, value]) => (value as string).trim());

  if (!name || !seasonYear || teamNames.length < 2) {
    return { error: "Please provide a league name, year, and at least 2 teams." };
  }

  const league = await prisma.league.create({
    data: {
      name: name.trim(),
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

  if (!name || !seasonYear) {
    return { error: "League name and season year are required." };
  }

  const newTeamNames: string[] = Array.from(formData.entries())
    .filter(([key, value]) => key.startsWith("newTeam_") && typeof value === "string" && (value as string).trim())
    .map(([, value]) => (value as string).trim());

  await prisma.league.update({
    where: { id: leagueId },
    data: {
      name,
      seasonYear,
      ...(newTeamNames.length > 0 && {
        teams: { create: newTeamNames.map((n) => ({ name: n })) },
      }),
    },
  });

  redirect(`/league/${leagueId}`);
}
