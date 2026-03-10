"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { generateRecap, type MatchupData, type TeamRecord } from "@/lib/generateRecap";

/**
 * Creates a week, saves all matchups, generates a recap, and saves it.
 * Called when the commissioner submits the weekly scores form.
 */
export async function createWeekWithMatchups(
  leagueId: number,
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const weekNumber = parseInt(formData.get("weekNumber") as string, 10);

  if (!weekNumber || weekNumber < 1) {
    return { error: "Invalid week number." };
  }

  const existingWeek = await prisma.week.findFirst({
    where: { leagueId, weekNumber },
  });
  if (existingWeek) {
    return { error: `Week ${weekNumber} already exists for this league.` };
  }

  // Parse matchups from form — each matchup is identified by an index
  const matchupInputs: Array<{
    teamAId: number;
    teamBId: number;
    scoreA: number;
    scoreB: number;
  }> = [];

  // The form sends fields like: matchup_0_teamA, matchup_0_scoreA, etc.
  let i = 0;
  while (formData.get(`matchup_${i}_teamA`) !== null) {
    const teamAId = parseInt(formData.get(`matchup_${i}_teamA`) as string, 10);
    const teamBId = parseInt(formData.get(`matchup_${i}_teamB`) as string, 10);
    const scoreA = parseFloat(formData.get(`matchup_${i}_scoreA`) as string);
    const scoreB = parseFloat(formData.get(`matchup_${i}_scoreB`) as string);

    if (teamAId && teamBId && !isNaN(scoreA) && !isNaN(scoreB)) {
      matchupInputs.push({ teamAId, teamBId, scoreA, scoreB });
    }
    i++;
  }

  if (matchupInputs.length === 0) {
    return { error: "Please enter at least one matchup." };
  }

  // Create the week and all matchups in one transaction
  const week = await prisma.week.create({
    data: {
      weekNumber,
      leagueId,
      matchups: {
        create: matchupInputs,
      },
    },
    include: {
      matchups: {
        include: {
          teamA: true,
          teamB: true,
        },
      },
    },
  });

  // Build MatchupData for the recap generator
  const matchupData: MatchupData[] = week.matchups.map((m) => ({
    teamA: m.teamA.name,
    teamB: m.teamB.name,
    scoreA: m.scoreA,
    scoreB: m.scoreB,
  }));

  // Build cumulative team records from all PREVIOUS weeks in this league
  const previousMatchups = await prisma.matchup.findMany({
    where: {
      week: {
        leagueId,
        id: { not: week.id }, // exclude the week we just created
      },
    },
    include: {
      teamA: true,
      teamB: true,
    },
  });

  // Tally wins, losses, and total points across all past matchups
  const recordMap = new Map<string, TeamRecord>();

  for (const m of previousMatchups) {
    const aKey = m.teamA.name;
    const bKey = m.teamB.name;

    if (!recordMap.has(aKey)) {
      recordMap.set(aKey, { teamName: aKey, wins: 0, losses: 0, totalPoints: 0 });
    }
    if (!recordMap.has(bKey)) {
      recordMap.set(bKey, { teamName: bKey, wins: 0, losses: 0, totalPoints: 0 });
    }

    const aRec = recordMap.get(aKey)!;
    const bRec = recordMap.get(bKey)!;

    aRec.totalPoints += m.scoreA;
    bRec.totalPoints += m.scoreB;

    if (m.scoreA > m.scoreB) {
      aRec.wins += 1;
      bRec.losses += 1;
    } else {
      bRec.wins += 1;
      aRec.losses += 1;
    }
  }

  const priorRecords = Array.from(recordMap.values());

  // Generate the recap content
  const recap = generateRecap(weekNumber, matchupData, priorRecords);

  // Save the recap to the database as JSON strings
  await prisma.recap.create({
    data: {
      weekId: week.id,
      headlines: JSON.stringify(recap.headlines),
      storyline: recap.storyline,
      awards: JSON.stringify(recap.awards),
      roast: JSON.stringify(recap.roast),
      powerRankings: JSON.stringify(recap.powerRankings),
    },
  });

  redirect(`/league/${leagueId}/week/${week.id}`);
}
