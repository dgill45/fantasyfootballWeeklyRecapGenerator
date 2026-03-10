/**
 * Recap generation logic — purely deterministic, no AI APIs.
 *
 * Given matchup data for a week, this file produces headlines, a storyline,
 * awards, roast lines, and power rankings.
 *
 * The tone is playful and sports-media-inspired. Think ESPN segment, not spreadsheet.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type MatchupData = {
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
};

export type PowerRankingEntry = {
  rank: number;
  teamName: string;
  wins: number;
  losses: number;
  totalPoints: number;
};

export type RecapContent = {
  headlines: string[];
  storyline: string;
  awards: Record<string, string>;
  roast: string[];
  powerRankings: PowerRankingEntry[];
};

// Prior week records for all teams in the league (from all previous weeks)
export type TeamRecord = {
  teamName: string;
  wins: number;
  losses: number;
  totalPoints: number;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function winner(m: MatchupData): { name: string; score: number } {
  return m.scoreA >= m.scoreB
    ? { name: m.teamA, score: m.scoreA }
    : { name: m.teamB, score: m.scoreB };
}

function loser(m: MatchupData): { name: string; score: number } {
  return m.scoreA < m.scoreB
    ? { name: m.teamA, score: m.scoreA }
    : { name: m.teamB, score: m.scoreB };
}

function scoreDiff(m: MatchupData): number {
  return Math.abs(m.scoreA - m.scoreB);
}

// Pick a random item from an array — used to add variety to templated lines
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Main generator ─────────────────────────────────────────────────────────

export function generateRecap(
  weekNumber: number,
  matchups: MatchupData[],
  allTeamRecords: TeamRecord[] // cumulative records BEFORE this week's results
): RecapContent {
  if (matchups.length === 0) {
    return {
      headlines: ["No matchups recorded yet."],
      storyline: "Nothing to report this week.",
      awards: {},
      roast: [],
      powerRankings: [],
    };
  }

  // ── Key matchup stats ────────────────────────────────────────────────────

  // Blowout = biggest point differential
  const blowout = [...matchups].sort((a, b) => scoreDiff(b) - scoreDiff(a))[0];

  // Closest game = smallest point differential
  const closest = [...matchups].sort((a, b) => scoreDiff(a) - scoreDiff(b))[0];

  // All individual performances (both sides of every matchup)
  const allPerfs = matchups.flatMap((m) => [
    { team: m.teamA, score: m.scoreA },
    { team: m.teamB, score: m.scoreB },
  ]);

  const highScore = allPerfs.reduce((best, p) =>
    p.score > best.score ? p : best
  );
  const lowScore = allPerfs.reduce((worst, p) =>
    p.score < worst.score ? p : worst
  );

  // ── Headlines ────────────────────────────────────────────────────────────

  const headlines: string[] = [
    // Blowout headline
    `${winner(blowout).name} DESTROYS ${loser(blowout).name} by ${scoreDiff(blowout).toFixed(2)} points in Week ${weekNumber}'s biggest beatdown`,
    // Closest game headline
    `NAIL-BITER: ${winner(closest).name} escapes with a win over ${loser(closest).name} — margin of just ${scoreDiff(closest).toFixed(2)} points`,
    // High score headline
    `${highScore.team} drops a season-high ${highScore.score.toFixed(2)} points — somebody check if they're cheating`,
  ];

  // ── Storyline ────────────────────────────────────────────────────────────

  const storylineOpeners = [
    `Week ${weekNumber} did NOT disappoint.`,
    `Another week, another batch of tears in the group chat.`,
    `Week ${weekNumber} was chaos, drama, and exactly what we signed up for.`,
  ];

  const storylineBody = `${pick(storylineOpeners)} The big story was ${winner(blowout).name} putting up a dominant performance against ${loser(blowout).name}, winning ${winner(blowout).score.toFixed(2)}–${loser(blowout).score.toFixed(2)}. Meanwhile, ${winner(closest).name} barely survived ${loser(closest).name} in a thriller that came down to the wire — final score ${winner(closest).score.toFixed(2)}–${loser(closest).score.toFixed(2)}. On the high end, ${highScore.team} torched the field with ${highScore.score.toFixed(2)} points. On the low end, ${lowScore.team} managed just ${lowScore.score.toFixed(2)} — not great, not great at all.`;

  // ── Awards ───────────────────────────────────────────────────────────────

  const awards: Record<string, string> = {
    "🔥 Offensive Juggernaut":
      `${highScore.team} with ${highScore.score.toFixed(2)} points. Dominant. Unstoppable. Please take it easy.`,
    "🧊 Ice in Their Veins":
      `${winner(closest).name} wins the closest game of the week (${scoreDiff(closest).toFixed(2)} pts). Therapist on speed dial recommended.`,
    "💣 Blowout Artist":
      `${winner(blowout).name} wins by ${scoreDiff(blowout).toFixed(2)} points. That's not a football score, that's a statement.`,
    "😬 Participation Award":
      `${lowScore.team} with ${lowScore.score.toFixed(2)} points. We're rooting for you. Kind of.`,
  };

  // ── Roast section ────────────────────────────────────────────────────────

  const roast: string[] = [
    pick([
      `${lowScore.team} scored ${lowScore.score.toFixed(2)} points. My grandma watching the game on a rotary TV could have done better.`,
      `${lowScore.team}: ${lowScore.score.toFixed(2)} points. The spirit is willing, but the lineup is not.`,
      `${lowScore.team} put up ${lowScore.score.toFixed(2)} this week. That's it. That's the roast.`,
    ]),
    pick([
      `${loser(blowout).name} got handled ${winner(blowout).score.toFixed(2)}–${loser(blowout).score.toFixed(2)}. That's not a loss, that's a humbling.`,
      `Someone tell ${loser(blowout).name} that starting injured players is not a personality trait.`,
    ]),
  ];

  // Add a roast for anyone who lost by under 5 points — tough luck section
  const heartbreakers = matchups.filter(
    (m) => scoreDiff(m) < 5 && scoreDiff(m) > 0
  );
  if (heartbreakers.length > 0) {
    const hb = heartbreakers[0];
    roast.push(
      `${loser(hb).name} lost by ${scoreDiff(hb).toFixed(2)} points. ${pick([
        "Brutal. Absolutely brutal.",
        "That's the kind of loss you think about on Sunday night.",
        "Somewhere, a bench player is catching a stray.",
      ])}`
    );
  }

  // ── Power Rankings ───────────────────────────────────────────────────────

  // Update records based on this week's results
  const updatedRecords = new Map<string, TeamRecord>();

  // Seed from prior records
  for (const r of allTeamRecords) {
    updatedRecords.set(r.teamName, { ...r });
  }

  // Apply this week's outcomes
  for (const m of matchups) {
    const aRec = updatedRecords.get(m.teamA) ?? {
      teamName: m.teamA,
      wins: 0,
      losses: 0,
      totalPoints: 0,
    };
    const bRec = updatedRecords.get(m.teamB) ?? {
      teamName: m.teamB,
      wins: 0,
      losses: 0,
      totalPoints: 0,
    };

    aRec.totalPoints += m.scoreA;
    bRec.totalPoints += m.scoreB;

    if (m.scoreA > m.scoreB) {
      aRec.wins += 1;
      bRec.losses += 1;
    } else {
      bRec.wins += 1;
      aRec.losses += 1;
    }

    updatedRecords.set(m.teamA, aRec);
    updatedRecords.set(m.teamB, bRec);
  }

  // Sort: most wins first, then total points as a tiebreaker
  const sorted = Array.from(updatedRecords.values()).sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.totalPoints - a.totalPoints;
  });

  const powerRankings: PowerRankingEntry[] = sorted.map((r, i) => ({
    rank: i + 1,
    teamName: r.teamName,
    wins: r.wins,
    losses: r.losses,
    totalPoints: Math.round(r.totalPoints * 100) / 100,
  }));

  return { headlines, storyline: storylineBody, awards, roast, powerRankings };
}
