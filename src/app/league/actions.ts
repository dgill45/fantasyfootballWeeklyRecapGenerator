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
