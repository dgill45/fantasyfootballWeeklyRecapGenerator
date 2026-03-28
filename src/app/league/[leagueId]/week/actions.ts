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
      if (scoreA < 0 || scoreA > 500 || scoreB < 0 || scoreB > 500) {
        return { error: `Matchup ${i + 1} has an invalid score. Scores must be between 0 and 500.` };
      }
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

  // Fetch league name for the recap prompt
  const league = await prisma.league.findUnique({ where: { id: leagueId }, select: { name: true } });

  // Generate the recap content via Claude API
  let recap;
  try {
    recap = await generateRecap(weekNumber, matchupData, priorRecords, league?.name ?? "Fantasy League");
  } catch (err) {
    // Delete the week we just created so the commissioner can try again
    await prisma.week.delete({ where: { id: week.id } });
    const message = err instanceof Error ? err.message : "Unknown error";
    return { error: `Recap generation failed: ${message}` };
  }

  // Save the recap to the database
  await prisma.recap.create({
    data: {
      weekId: week.id,
      title: recap.title,
      headlines: JSON.stringify(recap.headlines),
      storyline: JSON.stringify(recap.matchupRecaps),
      awards: JSON.stringify(recap.callouts),
      roast: "[]",
      powerRankings: JSON.stringify(recap.powerRankings),
    },
  });

  redirect(`/league/${leagueId}/week/${week.id}`);
}

/**
 * Deletes a week (and its matchups + recap via cascade).
 */
export async function deleteWeek(leagueId: number, weekId: number) {
  await prisma.week.delete({ where: { id: weekId } });
  redirect(`/league/${leagueId}`);
}

/**
 * Updates matchup scores for an existing week and regenerates the recap.
 */
export async function updateWeekMatchups(
  leagueId: number,
  weekId: number,
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const updates: Array<{ id: number; scoreA: number; scoreB: number }> = [];

  let i = 0;
  while (formData.get(`matchup_${i}_id`) !== null) {
    const id = parseInt(formData.get(`matchup_${i}_id`) as string, 10);
    const scoreA = parseFloat(formData.get(`matchup_${i}_scoreA`) as string);
    const scoreB = parseFloat(formData.get(`matchup_${i}_scoreB`) as string);

    if (isNaN(scoreA) || isNaN(scoreB) || scoreA < 0 || scoreA > 500 || scoreB < 0 || scoreB > 500) {
      return { error: `Matchup ${i + 1} has an invalid score. Scores must be between 0 and 500.` };
    }
    updates.push({ id, scoreA, scoreB });
    i++;
  }

  if (updates.length === 0) {
    return { error: "No matchups found to update." };
  }

  // Parse any new matchups being added
  const newMatchups: Array<{ teamAId: number; teamBId: number; scoreA: number; scoreB: number }> = [];
  let j = 0;
  while (formData.get(`new_${j}_teamA`) !== null) {
    const teamAId = parseInt(formData.get(`new_${j}_teamA`) as string, 10);
    const teamBId = parseInt(formData.get(`new_${j}_teamB`) as string, 10);
    const scoreA = parseFloat(formData.get(`new_${j}_scoreA`) as string);
    const scoreB = parseFloat(formData.get(`new_${j}_scoreB`) as string);

    if (!teamAId || !teamBId) { j++; continue; } // skip empty rows
    if (teamAId === teamBId) return { error: `New matchup ${j + 1}: a team cannot play itself.` };
    if (isNaN(scoreA) || isNaN(scoreB) || scoreA < 0 || scoreA > 500 || scoreB < 0 || scoreB > 500) {
      return { error: `New matchup ${j + 1} has an invalid score.` };
    }
    newMatchups.push({ teamAId, teamBId, scoreA, scoreB });
    j++;
  }

  // Update existing matchup scores
  await Promise.all(
    updates.map((u) =>
      prisma.matchup.update({
        where: { id: u.id },
        data: { scoreA: u.scoreA, scoreB: u.scoreB },
      })
    )
  );

  // Create new matchups
  if (newMatchups.length > 0) {
    await prisma.matchup.createMany({
      data: newMatchups.map((m) => ({ ...m, weekId })),
    });
  }

  // Delete old recap so we regenerate fresh
  await prisma.recap.deleteMany({ where: { weekId } });

  // Fetch updated week data for recap generation
  const week = await prisma.week.findUnique({
    where: { id: weekId },
    include: { matchups: { include: { teamA: true, teamB: true } } },
  });

  if (!week) return { error: "Week not found." };

  const matchupData: MatchupData[] = week.matchups.map((m) => ({
    teamA: m.teamA.name,
    teamB: m.teamB.name,
    scoreA: m.scoreA,
    scoreB: m.scoreB,
  }));

  // Build prior records from all other weeks in this league
  const previousMatchups = await prisma.matchup.findMany({
    where: { week: { leagueId, id: { not: weekId } } },
    include: { teamA: true, teamB: true },
  });

  const recordMap = new Map<string, TeamRecord>();
  for (const m of previousMatchups) {
    const aKey = m.teamA.name;
    const bKey = m.teamB.name;
    if (!recordMap.has(aKey)) recordMap.set(aKey, { teamName: aKey, wins: 0, losses: 0, totalPoints: 0 });
    if (!recordMap.has(bKey)) recordMap.set(bKey, { teamName: bKey, wins: 0, losses: 0, totalPoints: 0 });
    const aRec = recordMap.get(aKey)!;
    const bRec = recordMap.get(bKey)!;
    aRec.totalPoints += m.scoreA;
    bRec.totalPoints += m.scoreB;
    if (m.scoreA > m.scoreB) { aRec.wins++; bRec.losses++; }
    else { bRec.wins++; aRec.losses++; }
  }

  const league = await prisma.league.findUnique({ where: { id: leagueId }, select: { name: true } });

  let recap;
  try {
    recap = await generateRecap(week.weekNumber, matchupData, Array.from(recordMap.values()), league?.name ?? "Fantasy League");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { error: `Recap generation failed: ${message}` };
  }

  await prisma.recap.create({
    data: {
      weekId,
      title: recap.title,
      headlines: JSON.stringify(recap.headlines),
      storyline: JSON.stringify(recap.matchupRecaps),
      awards: JSON.stringify(recap.callouts),
      roast: "[]",
      powerRankings: JSON.stringify(recap.powerRankings),
    },
  });

  redirect(`/league/${leagueId}/week/${weekId}`);
}
